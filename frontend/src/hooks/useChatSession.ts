import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { trackSessionStart, trackSessionEnd, trackChatMessage } from '@/lib/analytics/tracker';

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'reconnecting'
  | 'closed'
  | 'offline'
  | 'auth_error'
  | 'error';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  status?: 'queued' | 'sending' | 'sent';
}

export interface ContextChunk {
  id: string;
  filename: string;
  chunk_index: number;
  content: string;
  distance?: number | null;
  metadata?: Record<string, unknown>;
}

interface ChatServerMessageBase {
  type: string;
}

interface ChatServerInfoMessage extends ChatServerMessageBase {
  type: 'info';
  message: string;
  user_id?: string;
}

interface ChatServerContextMessage extends ChatServerMessageBase {
  type: 'context';
  chunks: ContextChunk[];
}

interface ChatServerTokenMessage extends ChatServerMessageBase {
  type: 'token';
  value: string;
}

interface ChatServerCompleteMessage extends ChatServerMessageBase {
  type: 'complete';
  message?: string;
}

interface ChatServerErrorMessage extends ChatServerMessageBase {
  type: 'error';
  message: string;
}

type ChatServerMessage =
  | ChatServerInfoMessage
  | ChatServerContextMessage
  | ChatServerTokenMessage
  | ChatServerCompleteMessage
  | ChatServerErrorMessage;

export interface ChatSessionOptions {
  url?: string;
  userLevel?: number;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  profile?: string;
  /** If false, do not connect on mount; user must click Reconnect */
  autoConnect?: boolean;
}

interface OutboundMessage {
  type: 'user_message';
  content: string;
  user_level: number;
  profile?: string;
  effort?: 'minimal' | 'low' | 'medium' | 'high';
  verbosity?: 'concise' | 'balanced' | 'detailed';
}

interface QueuedOutboundMessage {
  id: string;
  payload: OutboundMessage;
}

export interface ChatSessionState {
  status: ConnectionStatus;
  isOnline: boolean;
  messages: ChatMessage[];
  pendingAssistant: string | null;
  contextChunks: ContextChunk[];
  lastError: string | null;
  canRetry: boolean;
  sendMessage: (content: string) => void;
  reconnect: () => void;
  retryLastMessage: () => void;
  setUserLevel: (level: number) => void;
  setProfile: (profile: string) => void;
  setEffort: (effort: 'minimal' | 'low' | 'medium' | 'high') => void;
  setVerbosity: (verbosity: 'concise' | 'balanced' | 'detailed') => void;
}

const DEFAULT_WS_URL = 'ws://localhost:8000/api/chat/ws';
const MAX_TOKEN_BUFFER = 8000;

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `msg_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
}

function buildWebSocketUrl(baseUrl: string): string {
  // Build a WS URL that respects the current page protocol.
  // If baseUrl already includes ws(s)://, normalize protocol to page's protocol.
  try {
    if (typeof window !== 'undefined') {
      const pageIsHTTPS = window.location.protocol === 'https:';
      const desiredProtocol = pageIsHTTPS ? 'wss:' : 'ws:';
      if (baseUrl.startsWith('ws://') || baseUrl.startsWith('wss://')) {
        const url = new URL(baseUrl);
        url.protocol = desiredProtocol;
        return url.toString();
      }
      // If baseUrl is http(s), convert to ws(s)
      if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
        const httpUrl = new URL(baseUrl);
        httpUrl.protocol = desiredProtocol;
        return httpUrl.toString();
      }
      // Treat as path, prepend current origin with ws(s)
      const origin = new URL(window.location.origin);
      origin.protocol = desiredProtocol;
      return new URL(baseUrl, origin).toString();
    }
  } catch (_) {
    // fall through to baseUrl
  }
  return baseUrl;
}

export function useChatSession(options: ChatSessionOptions = {}): ChatSessionState {
  const wsUrl = useMemo(() => options.url ?? import.meta.env.VITE_WS_URL ?? DEFAULT_WS_URL, [options.url]);
  const autoReconnect = options.autoReconnect ?? true;
  const maxReconnectAttempts = options.maxReconnectAttempts ?? 5;

  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingAssistant, setPendingAssistant] = useState<string | null>(null);
  const [contextChunks, setContextChunks] = useState<ContextChunk[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);
  const queueRef = useRef<QueuedOutboundMessage[]>([]);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(autoReconnect);
  const userLevelRef = useRef(options.userLevel ?? 3);
  const profileRef = useRef(options.profile ?? 'studyin_fast');
  const effortRef = useRef<'minimal' | 'low' | 'medium' | 'high'>('high');
  const verbosityRef = useRef<'concise' | 'balanced' | 'detailed'>('balanced');
  const pendingAssistantRef = useRef<string | null>(null);
  const isOnlineRef = useRef(isOnline);
  const lastSentMessageRef = useRef<{ id: string; content: string } | null>(null);
  const connectedOnceRef = useRef(false);

  useEffect(() => {
    shouldReconnectRef.current = autoReconnect;
  }, [autoReconnect]);

  useEffect(() => {
    userLevelRef.current = options.userLevel ?? userLevelRef.current;
  }, [options.userLevel]);

  useEffect(() => {
    pendingAssistantRef.current = pendingAssistant;
  }, [pendingAssistant]);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  const markMessageStatus = useCallback((id: string, messageStatus: ChatMessage['status']) => {
    if (!id) {
      return;
    }
    setMessages((prev) =>
      prev.map((message) => (message.id === id ? { ...message, status: messageStatus ?? message.status } : message))
    );
  }, []);

  const closeSocket = useCallback(() => {
    const socket = wsRef.current;
    if (!socket) {
      return;
    }

    console.log('[WS] closeSocket called', { readyState: socket.readyState });
    socket.onopen = null;
    socket.onclose = null;
    socket.onerror = null;
    socket.onmessage = null;

    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      console.log('[WS] Actively closing socket');
      socket.close();
    }

    wsRef.current = null;
  }, []);

  const flushQueue = useCallback(() => {
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    while (queueRef.current.length > 0) {
      const queued = queueRef.current.shift();
      if (!queued) {
        continue;
      }
      socket.send(JSON.stringify(queued.payload));
      markMessageStatus(queued.id, 'sent');
    }
  }, [markMessageStatus]);

  const handleServerMessage = useCallback(
    (payload: ChatServerMessage) => {
      switch (payload.type) {
        case 'info':
          // Optionally surface info messages to the UI later.
          setLastError(null);
          setCanRetry(false);
          break;
        case 'context':
          setContextChunks(Array.isArray(payload.chunks) ? payload.chunks : []);
          setCanRetry(false);
          break;
        case 'token': {
          const token = payload.value ?? '';
          if (!token) {
            break;
          }

          setPendingAssistant((prev) => {
            const current = (prev ?? '') + token;
            if (current.length > MAX_TOKEN_BUFFER) {
              return current.slice(-MAX_TOKEN_BUFFER);
            }
            return current;
          });
          setCanRetry(false);
          break;
        }
        case 'complete': {
          const serverMessage = typeof payload.message === 'string' ? payload.message.trim() : '';
          const finalMessage = serverMessage || pendingAssistantRef.current || '';
          if (finalMessage) {
            setMessages((prev) => [...prev, { id: generateId(), role: 'assistant', content: finalMessage }]);
          }
          setPendingAssistant(null);
          pendingAssistantRef.current = null;
          lastSentMessageRef.current = null;
          setCanRetry(false);
          break;
        }
        case 'error': {
          const message = payload.message || 'The AI coach encountered a problem.';
          setLastError(message);
          toast.error(message);
          setPendingAssistant(null);
          pendingAssistantRef.current = null;
          const retryable = /try again|temporarily|interrupted|shortly/i.test(message);
          setCanRetry(retryable);
          break;
        }
        default:
          // eslint-disable-next-line no-console
          console.warn('Received unknown WebSocket payload', payload);
      }
    },
    []
  );

  const connect = useCallback(() => {
    const existing = wsRef.current;
    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
      console.log('[WS] Skipping connect - already connected/connecting', existing.readyState);
      return;
    }

    if (!isOnlineRef.current) {
      console.log('[WS] Skipping connect - offline');
      setStatus('offline');
      setLastError('You appear to be offline. Connect to the internet to chat with the AI coach.');
      return;
    }

    try {
      const nextStatus = reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting';
      const finalWsUrl = buildWebSocketUrl(wsUrl);
      console.log('[WS] Creating new WebSocket connection', { wsUrl: finalWsUrl, nextStatus });
      setStatus(nextStatus);
      setLastError(null);
      setCanRetry(false);
      const socket = new WebSocket(finalWsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        const reconnecting = reconnectAttemptsRef.current > 0 || connectedOnceRef.current;
        console.log('[WS] onopen fired', { reconnecting });
        connectedOnceRef.current = true;
        setStatus('ready');
        setLastError(null);
        setCanRetry(false);
        reconnectAttemptsRef.current = 0;
        flushQueue();

        // Track session start
        if (!reconnecting && !sessionStartTimeRef.current) {
          sessionStartTimeRef.current = Date.now();
          trackSessionStart();
        }

        if (reconnecting) {
          toast.success('Connection to the AI coach restored.');
        } else {
          toast.success('Connected to the AI coach.');
        }
      };

      socket.onmessage = (event: MessageEvent<string>) => {
        try {
          const data = JSON.parse(event.data) as ChatServerMessage;
          handleServerMessage(data);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to parse WebSocket payload', error);
        }
      };

      socket.onerror = (event) => {
        console.error('[WS] socket.onerror fired', event);
        if (!isOnlineRef.current) {
          setStatus('offline');
          setLastError('You are offline. Messages will send when you reconnect.');
          return;
        }
        setStatus('error');
        setLastError('Connection error. Trying to reconnect…');
      };

      socket.onclose = (event: CloseEvent) => {
        console.log('[WS] onclose fired', { code: event.code, reason: event.reason, wasClean: event.wasClean });
        if (event.code === 4001 || event.code === 4401 || event.code === 1008) {
          const message = 'Your session is no longer authenticated. Please sign in again.';
          setStatus('auth_error');
          setLastError(message);
          setCanRetry(false);
          shouldReconnectRef.current = false;
          toast.error(message);
          return;
        }

        if (!isOnlineRef.current) {
          setStatus('offline');
          return;
        }

        if (!shouldReconnectRef.current) {
          setStatus('closed');
          return;
        }

        reconnectAttemptsRef.current += 1;
        if (reconnectAttemptsRef.current > maxReconnectAttempts) {
          const message = 'Unable to reconnect to the AI coach. Please refresh and try again.';
          setStatus('error');
          setLastError(message);
          setCanRetry(false);
          shouldReconnectRef.current = false;
          toast.error(message);
          return;
        }

        setStatus('reconnecting');
        const delay = Math.min(5000, 1000 * reconnectAttemptsRef.current);
        window.setTimeout(() => {
          connect();
        }, delay);
      };
    } catch (error) {
      setStatus('error');
      const message = error instanceof Error ? error.message : 'Failed to initialise WebSocket connection.';
      setLastError(message);
      setCanRetry(false);
      toast.error(message);
    }
  }, [flushQueue, handleServerMessage, maxReconnectAttempts, wsUrl]);

  useEffect(() => {
    console.log('[WS] Main useEffect running - mounting');
    shouldReconnectRef.current = autoReconnect;
    const autoConnect = options.autoConnect ?? true;
    if (autoConnect) {
      connect();
    } else {
      setStatus('closed');
    }

    return () => {
      console.log('[WS] Main useEffect cleanup - unmounting');
      shouldReconnectRef.current = false;

      // Track session end
      if (sessionStartTimeRef.current) {
        const durationMs = Date.now() - sessionStartTimeRef.current;
        trackSessionEnd(undefined, durationMs);
        sessionStartTimeRef.current = null;
      }

      closeSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) {
        return;
      }

      if (!isOnlineRef.current) {
        const offlineMessage = 'You are offline. Reconnect to send a new question.';
        setLastError(offlineMessage);
        toast.error(offlineMessage);
        return;
      }

      const messageId = generateId();
      const userMessage: ChatMessage = { id: messageId, role: 'user', content: trimmed, status: 'queued' };
      setMessages((prev) => [...prev, userMessage]);
      setPendingAssistant('');
      pendingAssistantRef.current = '';
      setContextChunks([]);
      setLastError(null);
      setCanRetry(false);

      const payload: OutboundMessage = {
        type: 'user_message',
        content: trimmed,
        user_level: userLevelRef.current,
        profile: profileRef.current,
        effort: effortRef.current,
        verbosity: verbosityRef.current,
      };

      const socket = wsRef.current;
      lastSentMessageRef.current = { id: messageId, content: trimmed };

      // Track chat message
      trackChatMessage(trimmed.length);

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload));
        markMessageStatus(messageId, 'sent');
        return;
      }

      if (socket && socket.readyState === WebSocket.CONNECTING) {
        markMessageStatus(messageId, 'sending');
      }

      queueRef.current.push({ id: messageId, payload });
      connect();
    },
    [connect, markMessageStatus]
  );

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    shouldReconnectRef.current = true;
    closeSocket();
    connect();
  }, [closeSocket, connect]);

  const retryLastMessage = useCallback(() => {
    const lastMessage = lastSentMessageRef.current;
    if (!lastMessage) {
      return;
    }

    if (!isOnlineRef.current) {
      toast.error('You are offline. Reconnect to retry your last question.');
      return;
    }

    setLastError(null);
    setCanRetry(false);
    setPendingAssistant('');
    pendingAssistantRef.current = '';
    setContextChunks([]);

    const payload: OutboundMessage = {
      type: 'user_message',
      content: lastMessage.content,
      user_level: userLevelRef.current,
      profile: profileRef.current,
      effort: effortRef.current,
      verbosity: verbosityRef.current,
    };

    queueRef.current = queueRef.current.filter((item) => item.id !== lastMessage.id);

    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
      markMessageStatus(lastMessage.id, 'sent');
      return;
    }

    if (socket && socket.readyState === WebSocket.CONNECTING) {
      markMessageStatus(lastMessage.id, 'sending');
    } else {
      markMessageStatus(lastMessage.id, 'queued');
    }

    queueRef.current.push({ id: lastMessage.id, payload });
    connect();
  }, [connect, markMessageStatus]);

  const setUserLevel = useCallback((level: number) => {
    userLevelRef.current = Math.min(5, Math.max(1, Math.round(level)));
  }, []);

  const setProfile = useCallback((profile: string) => {
    if (['studyin_fast', 'studyin_study', 'studyin_deep'].includes(profile)) {
      profileRef.current = profile;
    }
  }, []);

  const setEffort = useCallback((effort: 'minimal' | 'low' | 'medium' | 'high') => {
    effortRef.current = effort;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('studyin_effort', effort);
      }
    } catch (_) {
      // ignore storage errors
    }
  }, []);

  const setVerbosity = useCallback((verbosity: 'concise' | 'balanced' | 'detailed') => {
    verbosityRef.current = verbosity;
  }, []);

  // Load persisted effort on mount
  useEffect(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('studyin_effort') : null;
      if (saved === 'minimal' || saved === 'low' || saved === 'medium' || saved === 'high') {
        effortRef.current = saved;
      }
    } catch (_) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleOnline = () => {
      setIsOnline(true);
      // Only auto-connect on coming online if autoReconnect is enabled
      if (!shouldReconnectRef.current) return;
      if (status === 'offline' || status === 'error' || status === 'closed') {
        reconnect();
      } else if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
        connect();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus('offline');
      setLastError('You are offline. Messages are paused until you reconnect.');
      setCanRetry(false);
      closeSocket();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [closeSocket, connect, reconnect, status]);

  return {
    status,
    isOnline,
    messages,
    pendingAssistant,
    contextChunks,
    lastError,
    canRetry,
    sendMessage,
    reconnect,
    retryLastMessage,
    setUserLevel,
    setProfile,
    setEffort,
    setVerbosity,
  };
}

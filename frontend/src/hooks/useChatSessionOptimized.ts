/**
 * Optimized chat session hook for personal use
 * - Lazy connection (only connect when actually using chat)
 * - Aggressive reconnection for local network
 * - Simplified error handling
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type {
  ConnectionStatus,
  ChatMessage,
  ContextChunk,
  ChatSessionState
} from './useChatSession';

interface OptimizedChatSessionOptions {
  url?: string;
  userLevel?: number;
  profile?: string;
  lazyConnect?: boolean; // New: don't connect until first message
  effort?: 'minimal' | 'low' | 'medium' | 'high';
}

const DEFAULT_WS_URL = 'ws://localhost:8000/api/chat/ws';

export function useChatSessionOptimized(options: OptimizedChatSessionOptions = {}): ChatSessionState & { initialize: () => void } {
  const wsUrl = useMemo(() => options.url ?? import.meta.env.VITE_WS_URL ?? DEFAULT_WS_URL, [options.url]);
  const lazyConnect = options.lazyConnect ?? true;

  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [isOnline, setIsOnline] = useState<boolean>(true); // Assume online for local use
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingAssistant, setPendingAssistant] = useState<string | null>(null);
  const [contextChunks, setContextChunks] = useState<ContextChunk[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(!lazyConnect);
  const [effortState, setEffortState] = useState<'minimal' | 'low' | 'medium' | 'high'>(options.effort ?? 'high');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const messageQueueRef = useRef<any[]>([]);

  // Simplified WebSocket connection for local use
  const connect = useCallback(() => {
    // Skip if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      setStatus('connecting');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('ready');
        setLastError(null);

        // Flush any queued messages
        while (messageQueueRef.current.length > 0) {
          const msg = messageQueueRef.current.shift();
          ws.send(JSON.stringify(msg));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'context':
              setContextChunks(data.chunks || []);
              break;

            case 'token':
              if (data.value) {
                setPendingAssistant(prev => (prev || '') + data.value);
              }
              break;

            case 'complete':
              const finalMessage = data.message || pendingAssistant;
              if (finalMessage) {
                setMessages(prev => [...prev, {
                  id: `msg_${Date.now()}`,
                  role: 'assistant',
                  content: finalMessage
                }]);
              }
              setPendingAssistant(null);
              break;

            case 'error':
              setLastError(data.message);
              toast.error(data.message);
              break;
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = () => {
        setStatus('error');
        setLastError('Connection error - retrying...');
      };

      ws.onclose = () => {
        wsRef.current = null;
        setStatus('closed');

        // Auto-reconnect for local use (aggressive)
        if (initialized) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, 1000); // Fast reconnect for local network
        }
      };
    } catch (error) {
      setStatus('error');
      setLastError(error instanceof Error ? error.message : 'Connection failed');
    }
  }, [wsUrl, initialized, pendingAssistant]);

  // Initialize connection (called lazily or immediately based on config)
  const initialize = useCallback(() => {
    if (!initialized) {
      setInitialized(true);
      connect();
    }
  }, [initialized, connect]);

  // Send message with lazy initialization
  const sendMessage = useCallback((content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    // Lazy initialize on first message
    if (!initialized) {
      initialize();
    }

    // Add to messages immediately for instant feedback
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: trimmed,
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setPendingAssistant('');
    setContextChunks([]);
    setLastError(null);

    const payload = {
      type: 'user_message',
      content: trimmed,
      user_level: options.userLevel ?? 3,
      profile: options.profile ?? 'studyin_fast',
      effort: effortState,
    };

    // Send or queue message
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
      setMessages(prev =>
        prev.map(m => m.id === userMessage.id ? {...m, status: 'sent'} : m)
      );
    } else {
      messageQueueRef.current.push(payload);
      if (!wsRef.current) {
        connect();
      }
    }
  }, [initialized, initialize, connect, options.userLevel, options.profile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Auto-connect if not lazy
  useEffect(() => {
    if (!lazyConnect) {
      initialize();
    }
  }, [lazyConnect, initialize]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect]);

  const retryLastMessage = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  const setUserLevel = useCallback((level: number) => {
    // Store in ref or state as needed
  }, []);

  const setProfile = useCallback((profile: string) => {
    // Store in ref or state as needed
  }, []);

  const setEffort = useCallback((effort: 'minimal' | 'low' | 'medium' | 'high') => {
    setEffortState(effort);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('studyin_effort', effort);
      }
    } catch {}
  }, []);

  return {
    status,
    isOnline,
    messages,
    pendingAssistant,
    contextChunks,
    lastError,
    canRetry: !!lastError,
    sendMessage,
    reconnect,
    retryLastMessage,
    setUserLevel,
    setProfile,
    setEffort,
    initialize, // New: manual initialization for lazy loading
  };
}

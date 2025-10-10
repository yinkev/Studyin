import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { authEvents } from '@/lib/events/authEvents';

interface UseWebSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export interface WebSocketHook {
  isConnected: boolean;
  sendMessage: (event: string, data: unknown) => void;
  subscribe: (event: string, callback: (data: unknown) => void) => void;
  unsubscribe: (event: string, callback?: (data: unknown) => void) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): WebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { accessToken } = useAuthStore();
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    connectionTimeoutRef.current = setTimeout(() => {
      if (!socket.connected) {
        socket.disconnect();
        options.onError?.(new Error('Connection timeout'));
      }
    }, 30000);

    socket.on('connect', () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      setIsConnected(true);
      options.onConnect?.();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      options.onDisconnect?.();
    });

    socket.on('connect_error', (err) => {
      options.onError?.(err);
    });

    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 25000);

    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      clearInterval(heartbeatInterval);
      socket.disconnect();
    };
  }, [accessToken]);

  useEffect(() => {
    const unsubscribeRefresh = authEvents.on('tokenRefreshSucceeded', ({ accessToken: nextToken }) => {
      const socket = socketRef.current;
      if (!socket) {
        return;
      }

      socket.auth = { token: nextToken };

      if (socket.disconnected) {
        socket.connect();
        return;
      }

      socket.disconnect();
      socket.connect();
    });

    const unsubscribeLogout = authEvents.on('logoutForced', () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    });

    return () => {
      unsubscribeRefresh();
      unsubscribeLogout();
    };
  }, []);

  const sendMessage = (event: string, data: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  const subscribe = (event: string, callback: (data: unknown) => void) => {
    socketRef.current?.on(event, callback);
  };

  const unsubscribe = (event: string, callback?: (data: unknown) => void) => {
    if (!socketRef.current) return;
    if (callback) {
      socketRef.current.off(event, callback);
    } else {
      socketRef.current.off(event);
    }
  };

  return { isConnected, sendMessage, subscribe, unsubscribe };
}

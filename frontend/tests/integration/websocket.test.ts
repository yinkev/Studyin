import { EventEmitter } from 'events';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';

import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/stores/authStore';

class FakeSocket extends EventEmitter {
  connected = false;
  disconnect = vi.fn(() => {
    this.connected = false;
    super.emit('disconnect');
  });

  emit(event: string, data?: unknown): boolean {
    if (event === 'ping') {
      return true;
    }
    return super.emit(event, data);
  }

  off(event: string, callback?: (...args: unknown[]) => void): this {
    if (callback) {
      this.removeListener(event, callback);
    } else {
      this.removeAllListeners(event);
    }
    return this;
  }
}

const socketInstances: FakeSocket[] = [];

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => {
    const socket = new FakeSocket();
    socketInstances.push(socket);
    return socket;
  }),
}));

describe('useWebSocket hook', () => {
  beforeEach(() => {
    socketInstances.length = 0;
    vi.useFakeTimers();
    useAuthStore.setState({ accessToken: 'token-1' }, false);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    useAuthStore.setState({ accessToken: null }, false);
  });

  test('re-establishes connection after token refresh', async () => {
    vi.stubEnv('VITE_WS_URL', 'ws://localhost:8000/ws');

    const onConnect = vi.fn();
    const onDisconnect = vi.fn();

    const { result } = renderHook(() => useWebSocket({ onConnect, onDisconnect }));

    expect(socketInstances).toHaveLength(1);
    const firstSocket = socketInstances[0];

    act(() => {
      firstSocket.connected = true;
      firstSocket.emit('connect');
    });

    expect(result.current.isConnected).toBe(true);
    expect(onConnect).toHaveBeenCalledTimes(1);

    await act(async () => {
      useAuthStore.setState({ accessToken: 'token-2' }, false);
      await vi.runAllTimersAsync();
    });

    expect(socketInstances).toHaveLength(2);
    const secondSocket = socketInstances[1];

    expect(firstSocket.disconnect).toHaveBeenCalled();
    expect(onDisconnect).toHaveBeenCalledTimes(1);

    act(() => {
      secondSocket.connected = true;
      secondSocket.emit('connect');
    });

    expect(onConnect).toHaveBeenCalledTimes(2);
    expect(result.current.isConnected).toBe(true);
  });
});

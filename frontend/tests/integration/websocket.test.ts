import { act, renderHook } from '@testing-library/react';
import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, test, vi } from 'vitest';

import { useChatSession } from '@/hooks/useChatSession';

type MessageHandler = (event: MessageEvent<string>) => void;

declare global {
  // eslint-disable-next-line no-var
  var WebSocket: typeof MockWebSocket;
}

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  static instances: MockWebSocket[] = [];

  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: MessageHandler | null = null;
  onclose: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  sent: string[] = [];

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  send(payload: string) {
    this.sent.push(payload);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new Event('close'));
  }

  triggerOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  triggerMessage(data: unknown) {
    const serialized = JSON.stringify(data);
    this.onmessage?.({ data: serialized } as MessageEvent<string>);
  }

  triggerError() {
    this.onerror?.(new Event('error'));
  }

  triggerClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new Event('close'));
  }
}

const originalWebSocket = globalThis.WebSocket;

describe('useChatSession hook', () => {
  beforeAll(() => {
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterAll(() => {
    globalThis.WebSocket = originalWebSocket;
  });

  beforeEach(() => {
    MockWebSocket.instances.length = 0;
    vi.stubEnv('VITE_WS_URL', 'ws://test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('streams assistant responses and finalises completion', () => {
    const { result } = renderHook(() => useChatSession({ autoReconnect: false }));
    expect(MockWebSocket.instances).toHaveLength(1);
    const socket = MockWebSocket.instances[0];

    act(() => {
      socket.triggerOpen();
    });

    act(() => {
      result.current.sendMessage('Explain the cardiac cycle');
    });

    expect(result.current.messages).toHaveLength(1);
    expect(socket.sent).toHaveLength(1);

    act(() => {
      socket.triggerMessage({ type: 'token', value: 'Let us break it down' });
    });
    expect(result.current.pendingAssistant).toContain('Let us break it down');

    act(() => {
      socket.triggerMessage({ type: 'complete', message: 'Final answer' });
    });

    expect(result.current.pendingAssistant).toBeNull();
    expect(result.current.messages.at(-1)?.content).toBe('Final answer');
  });

  test('queues messages until the socket opens', () => {
    const { result } = renderHook(() => useChatSession({ autoReconnect: false }));
    const socket = MockWebSocket.instances[0];

    act(() => {
      result.current.sendMessage('Queued message');
    });

    expect(socket.sent).toHaveLength(0);

    act(() => {
      socket.triggerOpen();
    });

    expect(socket.sent).toHaveLength(1);
    expect(JSON.parse(socket.sent[0])).toMatchObject({ content: 'Queued message' });
  });
});

type TokenRefreshSucceededPayload = {
  accessToken: string;
};

type TokenRefreshFailedPayload = {
  error: unknown;
};

type AuthEventMap = {
  tokenRefreshStarted: void;
  tokenRefreshSucceeded: TokenRefreshSucceededPayload;
  tokenRefreshFailed: TokenRefreshFailedPayload;
  logoutForced: { reason: string };
};

type EventKey = keyof AuthEventMap;
type EventHandler<K extends EventKey> = (payload: AuthEventMap[K]) => void;

class AuthEventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- internal storage compatible with all payload types
  private readonly listeners: Map<EventKey, Set<EventHandler<any>>> = new Map();

  on<K extends EventKey>(event: K, handler: EventHandler<K>): () => void {
    const handlers = this.listeners.get(event) ?? new Set();
    handlers.add(handler as EventHandler<any>);
    this.listeners.set(event, handlers);

    return () => {
      this.off(event, handler);
    };
  }

  off<K extends EventKey>(event: K, handler: EventHandler<K>): void {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }

    handlers.delete(handler as EventHandler<any>);
    if (handlers.size === 0) {
      this.listeners.delete(event);
    }
  }

  emit<K extends EventKey>(event: K, payload: AuthEventMap[K]): void {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) {
      return;
    }

    handlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`AuthEvent handler for ${event} threw an error`, error);
      }
    });
  }
}

export const authEvents = new AuthEventBus();

export type { AuthEventMap, TokenRefreshFailedPayload, TokenRefreshSucceededPayload };

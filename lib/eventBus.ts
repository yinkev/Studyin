import { appEventSchema, type AppEvent } from '../core/types/events';

export type EventType = AppEvent['type'];
export type EventListener<TType extends EventType> = (event: Extract<AppEvent, { type: TType }>) => void | Promise<void>;

export interface EventBusOptions {
  /**
   * When true, the bus will throw on the first listener error. Otherwise errors are collected and rethrown after all listeners run.
   * Defaults to false.
   */
  failFast?: boolean;
}

export class EventBus {
  private readonly listeners = new Map<EventType, Set<EventListener<EventType>>>();
  private readonly failFast: boolean;

  constructor(options?: EventBusOptions) {
    this.failFast = Boolean(options?.failFast);
  }

  on<TType extends EventType>(type: TType, listener: EventListener<TType>): () => void {
    const set = this.listeners.get(type) ?? new Set();
    // Cast to EventListener<EventType> for storage while preserving runtime identity.
    set.add(listener as EventListener<EventType>);
    this.listeners.set(type, set);
    return () => this.off(type, listener);
  }

  once<TType extends EventType>(type: TType, listener: EventListener<TType>): () => void {
    const wrapper: EventListener<TType> = async (event) => {
      try {
        await listener(event);
      } finally {
        this.off(type, wrapper);
      }
    };
    return this.on(type, wrapper);
  }

  off<TType extends EventType>(type: TType, listener: EventListener<TType>): void {
    const set = this.listeners.get(type);
    if (!set) return;
    set.delete(listener as EventListener<EventType>);
    if (!set.size) {
      this.listeners.delete(type);
    }
  }

  hasListeners(type?: EventType): boolean {
    if (!type) {
      return Array.from(this.listeners.values()).some((set) => set.size > 0);
    }
    const set = this.listeners.get(type);
    return !!set && set.size > 0;
  }

  listenerCount(type?: EventType): number {
    if (!type) {
      let total = 0;
      for (const set of this.listeners.values()) {
        total += set.size;
      }
      return total;
    }
    return this.listeners.get(type)?.size ?? 0;
  }

  clear(): void {
    this.listeners.clear();
  }

  async emit<TEvent extends AppEvent>(event: TEvent): Promise<void> {
    const parsed = appEventSchema.parse(event);
    const set = this.listeners.get(parsed.type);
    if (!set || !set.size) return;

    const errors: unknown[] = [];
    for (const listener of Array.from(set)) {
      try {
        await listener(parsed as Extract<AppEvent, { type: TEvent['type'] }>);
      } catch (error) {
        if (this.failFast) {
          throw error;
        }
        errors.push(error);
      }
    }
    if (errors.length) {
      const aggregate = new AggregateError(errors, `EventBus encountered ${errors.length} error(s) while emitting ${parsed.type}`);
      throw aggregate;
    }
  }
}

export const globalEventBus = new EventBus();

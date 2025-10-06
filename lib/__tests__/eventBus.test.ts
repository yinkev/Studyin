import { describe, it, expect } from 'vitest';
import { EventBus } from '../eventBus';
import {
  answerSubmittedEventSchema,
  stateUpdatedEventSchema,
  type AnswerSubmittedEvent,
  type StateUpdatedEvent
} from '../../core/types/events';

function buildAnswerEvent(): AnswerSubmittedEvent {
  return answerSubmittedEventSchema.parse({
    type: 'ANSWER_SUBMITTED',
    learnerId: 'learner-1',
    sessionId: 'session-1',
    appVersion: 'test',
    itemId: 'item-1',
    loIds: ['lo-1'] as [string, ...string[]],
    difficulty: 'medium',
    choice: 'A',
    correct: true,
    ts: 1730870400000
  }) as AnswerSubmittedEvent;
}

describe('EventBus', () => {
  it('invokes listeners in registration order', async () => {
    const bus = new EventBus();
    const calls: string[] = [];

    bus.on('ANSWER_SUBMITTED', async (event: AnswerSubmittedEvent) => {
      calls.push(`first:${event.itemId}`);
    });
    bus.on('ANSWER_SUBMITTED', async (event: AnswerSubmittedEvent) => {
      calls.push(`second:${event.itemId}`);
    });

    await bus.emit(buildAnswerEvent());

    expect(calls).toEqual(['first:item-1', 'second:item-1']);
  });

  it('supports once listeners', async () => {
    const bus = new EventBus();
    let count = 0;
    bus.once('ANSWER_SUBMITTED', async () => {
      count += 1;
    });

    await bus.emit(buildAnswerEvent());
    await bus.emit(buildAnswerEvent());

    expect(count).toBe(1);
  });

  it('collects errors and throws aggregate by default', async () => {
    const bus = new EventBus();
    bus.on('ANSWER_SUBMITTED', async () => {
      throw new Error('boom');
    });
    bus.on('ANSWER_SUBMITTED', async () => {
      throw new Error('kaboom');
    });

    await expect(bus.emit(buildAnswerEvent())).rejects.toThrow(/encountered 2 error/);
  });

  it('emits secondary events inside listener', async () => {
    const bus = new EventBus();
    const updated: string[] = [];

    bus.on('ANSWER_SUBMITTED', async (event: AnswerSubmittedEvent) => {
      const stateEvent = stateUpdatedEventSchema.parse({
        type: 'STATE_UPDATED',
        learnerId: event.learnerId,
        state: {
          learnerId: event.learnerId,
          updatedAt: new Date(event.ts).toISOString(),
          los: {},
          items: {},
          retention: {}
        },
        ts: event.ts,
        reason: 'attempt'
      }) as StateUpdatedEvent;
      await bus.emit(stateEvent);
    });

    bus.on('STATE_UPDATED', async (event: StateUpdatedEvent) => {
      updated.push(event.learnerId);
    });

    await bus.emit(buildAnswerEvent());

    expect(updated).toEqual(['learner-1']);
  });
});

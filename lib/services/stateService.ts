import { EventBus, globalEventBus } from '../eventBus';
import {
  answerSubmittedEventSchema,
  stateUpdatedEventSchema,
  type AnswerSubmittedEvent
} from '../../core/types/events';
import type { LearnerStateRepository } from '../../core/types/repositories';
import { JsonLearnerStateRepository } from '../../services/state/jsonRepository';
import type { IPersonalizationEngine } from '../engine/IPersonalizationEngine';
import { createPersonalizationEngine } from '../engine/personalizationEngine';
import { recordStateSnapshot } from '../persistence/stateLog';

export interface StateServiceOptions {
  bus?: EventBus;
  engine?: IPersonalizationEngine;
  repository?: LearnerStateRepository;
}

export class StateService {
  private readonly bus: EventBus;
  private readonly engine: IPersonalizationEngine;
  private readonly repository: LearnerStateRepository;
  private readonly unsubs: Array<() => void> = [];

  constructor(options?: StateServiceOptions) {
    this.bus = options?.bus ?? globalEventBus;
    this.engine = options?.engine ?? createPersonalizationEngine();
    this.repository = options?.repository ?? new JsonLearnerStateRepository();

    this.unsubs.push(this.bus.on('ANSWER_SUBMITTED', (event) => this.handleAnswerSubmitted(event)));
  }

  private async handleAnswerSubmitted(event: AnswerSubmittedEvent): Promise<void> {
    const parsed = answerSubmittedEventSchema.parse(event);
    const learnerState = await this.repository.load(parsed.learnerId);
    const result = this.engine.update({
      learnerId: parsed.learnerId,
      state: learnerState,
      loIds: parsed.loIds,
      difficulty: parsed.difficulty,
      correct: parsed.correct,
      itemId: parsed.itemId,
      timestampMs: parsed.ts
    });

    const saved = await this.repository.save(parsed.learnerId, result.state);
    await recordStateSnapshot(parsed.learnerId, saved);
    const stateEvent = stateUpdatedEventSchema.parse({
      type: 'STATE_UPDATED',
      learnerId: parsed.learnerId,
      state: saved,
      reason: 'attempt',
      ts: parsed.ts
    });
    await this.bus.emit(stateEvent);
  }

  dispose(): void {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs.length = 0;
  }
}

export function createStateService(options?: StateServiceOptions): StateService {
  return new StateService(options);
}

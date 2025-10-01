import { randomUUID } from 'crypto';
import { RetentionReviewInput, RetentionReviewInputSchema, RetentionReviewResult } from '../types/events';
import { LearnerStateRepository, TelemetryService } from '../types/repositories';
import { updateHalfLife, scheduleNextReview } from '../../scripts/lib/fsrs.mjs';
import { attemptEventSchema } from '../../scripts/lib/schema.mjs';

interface Dependencies {
  repository: LearnerStateRepository;
  telemetry: TelemetryService;
}

export class ExecuteRetentionReview {
  private readonly repository: LearnerStateRepository;
  private readonly telemetry: TelemetryService;

  constructor(deps: Dependencies) {
    this.repository = deps.repository;
    this.telemetry = deps.telemetry;
  }

  async execute(input: RetentionReviewInput): Promise<RetentionReviewResult> {
    const data = RetentionReviewInputSchema.parse(input);
    const state = await this.repository.load(data.learnerId);
    const retention = { ...state.retention };
    const card = retention[data.itemId] ?? {
      loIds: data.loIds,
      halfLifeHours: 12,
      nextReviewMs: Date.now(),
      lastReviewMs: undefined,
      lapses: 0
    };

    const expected = data.correct ? 0.8 : 0.4;
    const { halfLifeHours } = updateHalfLife({
      halfLifeHours: card.halfLifeHours,
      expected,
      correct: data.correct
    });
    const now = Date.now();
    const { nextReviewMs } = scheduleNextReview({ halfLifeHours, nowMs: now });

    retention[data.itemId] = {
      loIds: data.loIds,
      halfLifeHours,
      nextReviewMs,
      lastReviewMs: now,
      lapses: data.correct ? card.lapses ?? 0 : (card.lapses ?? 0) + 1
    };

    const nextState = await this.repository.save(data.learnerId, {
      ...state,
      retention
    });

    const attemptEvent = attemptEventSchema.parse({
      app_version: data.appVersion ?? 'dev',
      session_id: data.sessionId ?? randomUUID(),
      user_id: data.learnerId,
      item_id: data.itemId,
      lo_ids: data.loIds.length ? data.loIds : ['unmapped'],
      ts_start: now - 30_000,
      ts_submit: now,
      duration_ms: 30_000,
      mode: 'spotter',
      choice: data.correct ? 'A' : 'B',
      correct: data.correct,
      opened_evidence: false
    });

    await this.telemetry.recordAttempt(attemptEvent);

    return { learnerState: nextState };
  }
}

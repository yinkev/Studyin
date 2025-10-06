import { randomUUID } from 'crypto';
import { RetentionReviewInput, RetentionReviewInputSchema, RetentionReviewResult } from '../types/events';
import { LearnerStateRepository, TelemetryService } from '../types/repositories';
import { updateHalfLife, scheduleNextReview } from '../../lib/engine/shims/fsrs';
import { attemptEventSchema } from '../../lib/core/schemas';

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
    const data = RetentionReviewInputSchema.parse(input) as RetentionReviewInput;
    const state = await this.repository.load(data.learnerId);
    const retention = { ...state.retention };
    const card = retention[data.itemId] ?? {
      loIds: data.loIds,
      halfLifeHours: 12,
      nextReviewMs: Date.now(),
      lastReviewMs: undefined,
      lapses: 0
    };
    const loIds = data.loIds.length ? data.loIds : card.loIds ?? [];

    const expected = data.correct ? 0.8 : 0.4;
    const { halfLifeHours } = updateHalfLife({
      halfLifeHours: card.halfLifeHours,
      expected,
      correct: data.correct
    });
    const now = Date.now();
    const { nextReviewMs } = scheduleNextReview({ halfLifeHours, nowMs: now });

    retention[data.itemId] = {
      loIds,
      halfLifeHours,
      nextReviewMs,
      lastReviewMs: now,
      lapses: data.correct ? card.lapses ?? 0 : (card.lapses ?? 0) + 1
    };

    const nextState = await this.repository.save(data.learnerId, {
      ...state,
      retention
    });

    const overdueDays = card.nextReviewMs ? Math.max(0, now - card.nextReviewMs) / (1000 * 60 * 60 * 24) : 0;
    const retentionMetadata = {
      ...(data.engine?.retention ?? {}),
      max_days_overdue: Number.isFinite(overdueDays) ? overdueDays : undefined,
      reason: data.engine?.retention?.reason ?? (data.correct ? 'retention-success' : 'retention-lapse')
    };
    const engineMetadata = {
      ...(data.engine ?? {}),
      retention: retentionMetadata
    };

    const attemptEvent = attemptEventSchema.parse({
      app_version: data.appVersion ?? 'dev',
      session_id: data.sessionId ?? randomUUID(),
      user_id: data.learnerId,
      item_id: data.itemId,
      lo_ids: loIds.length ? loIds : ['unmapped'],
      ts_start: now - 30_000,
      ts_submit: now,
      duration_ms: 30_000,
      mode: 'spotter',
      choice: data.correct ? 'A' : 'B',
      correct: data.correct,
      opened_evidence: false,
      engine: engineMetadata
    });

    await this.telemetry.recordAttempt(attemptEvent);

    return { learnerState: nextState };
  }
}

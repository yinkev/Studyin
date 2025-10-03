import { randomUUID } from 'crypto';
import { StudyAttemptInput, StudyAttemptInputSchema, StudyAttemptResult } from '../types/events';
import { LearnerStateRepository, TelemetryService } from '../types/repositories';
import {
  STOP_RULES,
  runEapUpdate,
  difficultyToBeta,
  rasch
} from '../../lib/study-engine';
import { attemptEventSchema } from 'lib/core/schemas';
import type { LearnerState } from '../../lib/server/study-state';

interface Dependencies {
  repository: LearnerStateRepository;
  telemetry: TelemetryService;
}

export class ExecuteStudyAttempt {
  private readonly repository: LearnerStateRepository;
  private readonly telemetry: TelemetryService;

  constructor(deps: Dependencies) {
    this.repository = deps.repository;
    this.telemetry = deps.telemetry;
  }

  async execute(input: StudyAttemptInput): Promise<StudyAttemptResult> {
    const data = StudyAttemptInputSchema.parse(input);
    const learnerState = await this.repository.load(data.learnerId);

    const los = { ...learnerState.los };
    const retention = { ...learnerState.retention };
    const items = { ...learnerState.items };

    const beta = difficultyToBeta(data.difficulty);

    for (const loId of data.loIds) {
      const current = los[loId] ?? {
        thetaHat: 0,
        se: 0.8,
        itemsAttempted: 0,
        recentSes: [],
        priorMu: 0,
        priorSigma: 0.8
      } as LearnerState['los'][string];

      const { thetaHat, se } = await runEapUpdate({
        priorMu: current.priorMu ?? current.thetaHat,
        priorSigma: current.priorSigma ?? 0.8,
        response: { k: data.correct ? 1 : 0, m: 1 },
        difficulty: beta
      });

      const mastery = rasch.masteryProbability(thetaHat, se);
      los[loId] = {
        ...current,
        thetaHat,
        se,
        priorMu: thetaHat,
        priorSigma: Math.max(0.25, se),
        itemsAttempted: (current.itemsAttempted ?? 0) + 1,
        recentSes: [...(current.recentSes ?? []), se].slice(-10),
        lastProbeDifficulty: beta,
        masteryConfirmed:
          current.masteryConfirmed ||
          (Math.abs(thetaHat - beta) <= STOP_RULES.probeWindow && mastery >= STOP_RULES.masteryProb)
      };
    }

    const item = items[data.itemId] ?? { attempts: 0, correct: 0, recentAttempts: [] as number[] };
    const now = Date.now();
    item.attempts += 1;
    if (data.correct) item.correct += 1;
    item.lastAttemptTs = now;
    item.recentAttempts = [...(item.recentAttempts ?? []), now].slice(-20);
    items[data.itemId] = item;

    // Persist learner state
    const nextState = await this.repository.save(data.learnerId, {
      ...learnerState,
      los,
      items,
      retention
    });

    const duration = typeof data.durationMs === 'number' ? Math.max(0, data.durationMs) : 60_000;
    const tsSubmit = now;
    const tsStart = tsSubmit - duration;
    const attemptEvent = attemptEventSchema.parse({
      app_version: data.appVersion ?? 'dev',
      session_id: data.sessionId ?? randomUUID(),
      user_id: data.learnerId,
      item_id: data.itemId,
      lo_ids: data.loIds.length ? data.loIds : ['unmapped'],
      ts_start: tsStart,
      ts_submit: tsSubmit,
      duration_ms: duration,
      mode: 'learn',
      choice: data.choice,
      correct: data.correct,
      opened_evidence: data.openedEvidence ?? false
    });

    await this.telemetry.recordAttempt(attemptEvent);

    return { learnerState: nextState };
  }
}

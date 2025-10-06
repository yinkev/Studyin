import { randomUUID } from 'crypto';
import { logSessionEvent, scheduleNextLo } from '../../app/study/engine';
import { buildThompsonArms } from '../../lib/study-engine';
import type { LearnerStateRepository } from '../types/repositories';

interface StartStudySessionDeps {
  repository: LearnerStateRepository;
}

export class StartStudySession {
  private repository: LearnerStateRepository;

  constructor(deps: StartStudySessionDeps) {
    this.repository = deps.repository;
  }

  async execute(learnerId: string, appVersion: string = '0.1.0-dev') {
    const learnerState = await this.repository.load(learnerId);

    const arms = buildThompsonArms({ learnerState, items: [] });
    const decision = scheduleNextLo({ arms }) ?? null;
    const startingLo = decision?.loId ?? null;
    const engine = decision
      ? {
          scheduler: {
            lo_id: decision.loId,
            score: decision.score,
            sample: decision.sample
          }
        }
      : undefined;

    const sessionId = randomUUID();

    await logSessionEvent({
      event: {
        session_id: sessionId,
        user_id: learnerId,
        mode: 'learn',
        start_ts: Date.now()
      },
      engine,
      appVersion
    });

    return {
      sessionId,
      startingLo,
      engine
    };
  }
}

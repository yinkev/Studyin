import {
  logSessionEvent,
  scheduleNextLo,
  type LearnerState
} from '../../app/study/engine';
import { type LearnerStateRepository } from './executeStudyAttempt';
import { v4 as uuidv4 } from 'uuid';

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

    // 1. Decide which Learning Objective to focus on for this session.
    // This generates the "why" for the session.
    const { lo, signal: engineSignal } = scheduleNextLo(learnerState);

    const sessionId = uuidv4();

    // 2. Log the session creation event with the engine signal.
    await logSessionEvent({
      event: {
        session_id: sessionId,
        user_id: learnerId,
        mode: 'learn',
        start_ts: Date.now()
      },
      engineSignal,
      appVersion
    });

    // 3. Return the session details to the caller (e.g., the UI).
    return {
      sessionId,
      startingLo: lo,
      engineSignal
    };
  }
}
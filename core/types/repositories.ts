import type { LearnerState } from '../../lib/server/study-state';
import type { AttemptEvent } from './events';

export interface LearnerStateRepository {
  load(learnerId: string): Promise<LearnerState>;
  save(learnerId: string, state: LearnerState): Promise<LearnerState>;
}

export interface TelemetryService {
  recordAttempt(event: AttemptEvent): Promise<void>;
}

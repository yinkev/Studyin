import type { LearnerState } from '../../lib/server/study-state';
import type { z } from 'zod';
import { attemptEventSchema } from 'lib/core/schemas';

export type AttemptEvent = z.infer<typeof attemptEventSchema>;

export interface LearnerStateRepository {
  load(learnerId: string): Promise<LearnerState>;
  save(learnerId: string, state: LearnerState): Promise<LearnerState>;
}

export interface TelemetryService {
  recordAttempt(event: AttemptEvent): Promise<void>;
}

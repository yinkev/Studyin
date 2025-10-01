import type { LearnerState } from '../../lib/server/study-state';
import { loadLearnerState, saveLearnerState } from '../../lib/server/study-state';
import { LearnerStateRepository } from '../../core/types/repositories';

export class JsonLearnerStateRepository implements LearnerStateRepository {
  async load(learnerId: string): Promise<LearnerState> {
    return loadLearnerState(learnerId);
  }

  async save(learnerId: string, state: LearnerState): Promise<LearnerState> {
    return saveLearnerState(learnerId, state);
  }
}

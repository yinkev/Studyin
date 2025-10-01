import { promises as fs } from 'fs';
import path from 'path';
import { createEmptyLearnerState, LearnerState, normaliseLearnerState } from '../../lib/server/study-state';

const DATA_DIR = path.join(process.cwd(), 'data', 'learner-state');

export class JsonLearnerStateRepository {
  private async ensureDir() {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  private filePath(learnerId: string) {
    const safeId = learnerId.replace(/[^a-zA-Z0-9-_]/g, '_');
    return path.join(DATA_DIR, `${safeId}.json`);
  }

  async load(learnerId: string): Promise<LearnerState> {
    await this.ensureDir();
    const file = this.filePath(learnerId);
    try {
      const raw = await fs.readFile(file, 'utf8');
      const parsed = JSON.parse(raw) as Partial<LearnerState>;
      return normaliseLearnerState(parsed, learnerId);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        const empty = createEmptyLearnerState(learnerId);
        await this.save(empty);
        return empty;
      }
      throw error;
    }
  }

  async save(state: LearnerState): Promise<void> {
    await this.ensureDir();
    const file = this.filePath(state.learnerId);
    const payload = JSON.stringify({
      ...state,
      updatedAt: state.updatedAt ?? new Date().toISOString()
    }, null, 2);
    await fs.writeFile(file, payload, 'utf8');
  }
}

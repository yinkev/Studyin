import { promises as fs } from 'fs';
import path from 'path';
import type { LearnerState } from '../server/study-state';

const LOG_DIR = process.env.STATE_LOG_DIR ?? path.join(process.cwd(), 'data', 'state', 'snapshots');

interface StateSnapshot {
  learnerId: string;
  recordedAt: string;
  state: LearnerState;
}

function logPath(learnerId: string): string {
  const safeId = learnerId.replace(/[^a-zA-Z0-9-_]/g, '_');
  return path.join(LOG_DIR, `${safeId}.ndjson`);
}

export async function recordStateSnapshot(learnerId: string, state: LearnerState): Promise<void> {
  const entry: StateSnapshot = {
    learnerId,
    recordedAt: new Date().toISOString(),
    state
  };
  await fs.mkdir(LOG_DIR, { recursive: true });
  await fs.appendFile(logPath(learnerId), JSON.stringify(entry) + '\n', 'utf8');
}

export async function loadStateSnapshots(learnerId: string, limit = 50): Promise<StateSnapshot[]> {
  try {
    const raw = await fs.readFile(logPath(learnerId), 'utf8');
    const lines = raw.split('\n').filter(Boolean);
    return lines
      .slice(-limit)
      .map((line) => JSON.parse(line) as StateSnapshot)
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export type { StateSnapshot };

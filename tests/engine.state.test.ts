import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import path from 'path';
import { promises as fs } from 'fs';
import {
  loadLearnerState,
  updateLearnerLoState,
  recordItemExposure,
  getLearnerStatePath
} from '../lib/server/study-state';

const TEMP_DIR = path.join(process.cwd(), '.tmp-state-tests');

beforeAll(async () => {
  process.env.STUDY_STATE_DIR = TEMP_DIR;
  await fs.rm(TEMP_DIR, { recursive: true, force: true });
});

afterAll(async () => {
  await fs.rm(TEMP_DIR, { recursive: true, force: true });
});

describe('study-state persistence', () => {
  it('creates defaults when no state file exists', async () => {
    const state = await loadLearnerState('demo-user');
    expect(state.learnerId).toBe('demo-user');
    expect(state.los).toEqual({});
    expect(state.items).toEqual({});
    expect(state.retention).toEqual({});
  });

  it('updates LO state and persists to disk', async () => {
    await updateLearnerLoState('demo-user', 'lo.alpha', (current) => ({
      ...current,
      thetaHat: 0.25,
      se: 0.3,
      itemsAttempted: current.itemsAttempted + 1,
      recentSes: [...current.recentSes, 0.3].slice(-5),
      priorMu: 0,
      priorSigma: 0.75
    }));

    const persisted = await loadLearnerState('demo-user');
    expect(persisted.los['lo.alpha']).toMatchObject({
      thetaHat: 0.25,
      se: 0.3,
      itemsAttempted: 1,
      priorSigma: 0.75
    });
  });

  it('records item exposure counts and timestamps', async () => {
    const ts = Date.now();
    await recordItemExposure('demo-user', 'item-1', true, ts);
    await recordItemExposure('demo-user', 'item-1', false, ts + 1000);
    const state = await loadLearnerState('demo-user');
    expect(state.items['item-1']).toMatchObject({ attempts: 2, correct: 1, lastAttemptTs: ts + 1000 });
    expect(state.items['item-1'].recentAttempts).toHaveLength(2);
    expect(state.retention).toEqual({});
  });

  it('writes JSON file to configured directory', async () => {
    const filePath = getLearnerStatePath('demo-user');
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed.learnerId).toBe('demo-user');
  });
});

import { promises as fs } from 'fs';
import path from 'path';
import type { LearnerLoState } from '../study-engine';

const ROOT = process.cwd();

function resolveStateDir(): string {
  const custom = process.env.STUDY_STATE_DIR;
  if (custom) {
    return path.isAbsolute(custom) ? custom : path.join(ROOT, custom);
  }
  return path.join(ROOT, 'data', 'state');
}

function getStatePath(learnerId: string): string {
  const safeId = learnerId.replace(/[^a-zA-Z0-9-_]/g, '_');
  return path.join(resolveStateDir(), `${safeId}.json`);
}

export function createDefaultLoState(): LearnerLoState {
  return {
    thetaHat: 0,
    se: 0.8,
    itemsAttempted: 0,
    recentSes: [],
    priorMu: 0,
    priorSigma: 0.8
  };
}

export interface RetentionCard {
  loIds: string[];
  halfLifeHours: number;
  nextReviewMs: number;
  lastReviewMs?: number;
  lapses?: number;
}

export interface LearnerState {
  learnerId: string;
  updatedAt: string;
  los: Record<string, LearnerLoState>;
  items: Record<
    string,
    {
      attempts: number;
      correct: number;
      lastAttemptTs?: number;
      recentAttempts?: number[];
    }
  >;
  retention: Record<string, RetentionCard>;
}

function sanitizeLo(raw: Partial<LearnerLoState> | undefined): LearnerLoState {
  const base = createDefaultLoState();
  if (!raw) return base;
  return {
    thetaHat: typeof raw.thetaHat === 'number' ? raw.thetaHat : base.thetaHat,
    se: typeof raw.se === 'number' ? raw.se : base.se,
    itemsAttempted: typeof raw.itemsAttempted === 'number' ? raw.itemsAttempted : base.itemsAttempted,
    recentSes: Array.isArray(raw.recentSes) ? raw.recentSes.map((value) => Number(value) || 0) : base.recentSes,
    lastProbeDifficulty: typeof raw.lastProbeDifficulty === 'number' ? raw.lastProbeDifficulty : undefined,
    masteryConfirmed: typeof raw.masteryConfirmed === 'boolean' ? raw.masteryConfirmed : undefined,
    priorMu: typeof raw.priorMu === 'number' ? raw.priorMu : base.priorMu,
    priorSigma: typeof raw.priorSigma === 'number' ? raw.priorSigma : base.priorSigma
  };
}

function sanitizeState(learnerId: string, raw: Partial<LearnerState> | undefined): LearnerState {
  const losRaw = raw?.los ?? {};
  const los: Record<string, LearnerLoState> = {};
  for (const [loId, value] of Object.entries(losRaw)) {
    los[loId] = sanitizeLo(value as Partial<LearnerLoState>);
  }
  const itemsRaw = raw?.items ?? {};
  const items: LearnerState['items'] = {};
  for (const [itemId, value] of Object.entries(itemsRaw)) {
    const meta = value as { attempts?: number; correct?: number; lastAttemptTs?: number; recentAttempts?: number[] };
    items[itemId] = {
      attempts: typeof meta.attempts === 'number' ? meta.attempts : 0,
      correct: typeof meta.correct === 'number' ? meta.correct : 0,
      lastAttemptTs: typeof meta.lastAttemptTs === 'number' ? meta.lastAttemptTs : undefined,
      recentAttempts: Array.isArray(meta.recentAttempts)
        ? meta.recentAttempts
            .map((value) => (typeof value === 'number' ? value : Number(value)))
            .filter((value) => Number.isFinite(value))
            .slice(-20)
        : undefined
    };
  }
  const retentionRaw = raw?.retention ?? {};
  const retention: Record<string, RetentionCard> = {};
  for (const [itemId, value] of Object.entries(retentionRaw)) {
    const card = value as Partial<RetentionCard>;
    retention[itemId] = {
      loIds: Array.isArray(card.loIds) ? card.loIds.filter((loId) => typeof loId === 'string') : [],
      halfLifeHours:
        typeof card.halfLifeHours === 'number' && Number.isFinite(card.halfLifeHours)
          ? Math.max(card.halfLifeHours, 1 / 60)
          : 12,
      nextReviewMs:
        typeof card.nextReviewMs === 'number' && Number.isFinite(card.nextReviewMs)
          ? card.nextReviewMs
          : Date.now() + 12 * 60 * 60 * 1000,
      lastReviewMs:
        typeof card.lastReviewMs === 'number' && Number.isFinite(card.lastReviewMs)
          ? card.lastReviewMs
          : undefined,
      lapses: typeof card.lapses === 'number' ? Math.max(0, Math.floor(card.lapses)) : undefined
    };
  }
  return {
    learnerId,
    updatedAt: raw?.updatedAt ?? new Date().toISOString(),
    los,
    items,
    retention
  };
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(resolveStateDir(), { recursive: true });
}

export async function loadLearnerState(learnerId: string): Promise<LearnerState> {
  const filePath = getStatePath(learnerId);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<LearnerState>;
    return sanitizeState(learnerId, parsed);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return sanitizeState(learnerId, undefined);
    }
    throw error;
  }
}

export async function saveLearnerState(learnerId: string, state: LearnerState): Promise<LearnerState> {
  const next = {
    ...state,
    learnerId,
    updatedAt: new Date().toISOString()
  } satisfies LearnerState;
  await ensureDir();
  await fs.writeFile(getStatePath(learnerId), JSON.stringify(next, null, 2) + '\n', 'utf8');
  return next;
}

export async function updateLearnerLoState(
  learnerId: string,
  loId: string,
  updater: (state: LearnerLoState) => LearnerLoState
): Promise<LearnerState> {
  const state = await loadLearnerState(learnerId);
  const current = state.los[loId] ?? createDefaultLoState();
  const nextLo = updater(current);
  state.los[loId] = {
    ...createDefaultLoState(),
    ...nextLo,
    recentSes: Array.isArray(nextLo.recentSes) ? nextLo.recentSes.slice(-10) : []
  };
  return saveLearnerState(learnerId, state);
}

export async function recordItemExposure(
  learnerId: string,
  itemId: string,
  correct: boolean,
  timestampMs: number
): Promise<LearnerState> {
  const state = await loadLearnerState(learnerId);
  const item = state.items[itemId] ?? { attempts: 0, correct: 0, recentAttempts: [] };
  item.attempts += 1;
  if (correct) item.correct += 1;
  item.lastAttemptTs = timestampMs;
  const attempts = Array.isArray(item.recentAttempts) ? item.recentAttempts.slice() : [];
  attempts.push(timestampMs);
  item.recentAttempts = attempts.slice(-20);
  state.items[itemId] = item;
  return saveLearnerState(learnerId, state);
}

export function getLearnerStatePath(learnerId: string): string {
  return getStatePath(learnerId);
}

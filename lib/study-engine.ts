import { gpcmPmf } from '../scripts/lib/gpcm.mjs';
import { utility, pickRandomesque } from '../scripts/lib/selector.mjs';
import { thompsonSchedule } from '../scripts/lib/scheduler.mjs';
import { exposureMultiplier as baseExposureMultiplier, clampOverfamiliar } from '../scripts/lib/exposure.mjs';
import { retentionBudget } from '../scripts/lib/fsrs.mjs';
import { eapUpdate, masteryProbability } from '../scripts/lib/rasch.mjs';

export const STOP_RULES = Object.freeze({
  minItems: 12,
  seThreshold: 0.2,
  deltaSeThreshold: 0.02,
  masteryProb: 0.85,
  probeWindow: 0.3
});

export type DifficultyCode = 'easy' | 'medium' | 'hard';

export interface CandidateItem {
  id: string;
  loIds: string[];
  difficulty: number;
  thresholds?: number[];
  medianTimeSeconds: number;
  blueprintMultiplier: number;
  exposure: {
    last24h: number;
    last7d: number;
    hoursSinceLast: number;
    meanScore: number;
    se: number;
  };
  fatigueScalar: number;
}

export interface CandidateScore {
  itemId: string;
  loIds: string[];
  utility: number;
  info: number;
  blueprintMultiplier: number;
  exposureMultiplier: number;
  fatigueScalar: number;
  medianTimeSeconds: number;
}

export interface SelectionResult {
  itemId: string;
  loIds: string[];
  signals: CandidateScore;
  pool: CandidateScore[];
}

export interface ThompsonArm {
  loId: string;
  mu: number;
  sigma: number;
  urgency: number;
  blueprintMultiplier: number;
  eligible: boolean;
  cooldownHours: number;
}

export interface ThompsonResult {
  loId: string;
  score: number;
  sample: number;
}

export interface LoState {
  thetaHat: number;
  se: number;
  itemsAttempted: number;
  recentSes: number[];
  lastProbeDifficulty?: number;
  masteryConfirmed?: boolean;
}

export interface LearnerLoState extends LoState {
  priorMu: number;
  priorSigma: number;
}

const DIFFICULTY_TO_BETA: Record<DifficultyCode, number> = {
  easy: -0.7,
  medium: 0,
  hard: 0.7
};

export function difficultyToBeta(difficulty: DifficultyCode): number {
  return DIFFICULTY_TO_BETA[difficulty] ?? 0;
}

function computeExposureMultiplier(exposure: CandidateItem['exposure']): number {
  const base = baseExposureMultiplier({
    last24h: exposure.last24h,
    last7d: exposure.last7d,
    hoursSinceLast: exposure.hoursSinceLast
  });
  return clampOverfamiliar({
    meanScore: exposure.meanScore,
    se: exposure.se,
    base
  });
}

function computeItemInfo(thetaHat: number, difficulty: number, thresholds?: number[]): number {
  if (!thresholds || thresholds.length === 0) {
    const pmf = gpcmPmf(thetaHat, difficulty, undefined, 1);
    const expected = pmf[1];
    return expected * (1 - expected);
  }
  const pmf = gpcmPmf(thetaHat, difficulty, thresholds, thresholds.length);
  const expected = pmf.reduce((sum, prob, idx) => sum + prob * idx, 0);
  const variance = pmf.reduce((sum, prob, idx) => sum + prob * (idx - expected) ** 2, 0);
  return variance;
}

export function scoreCandidates(params: {
  thetaHat: number;
  items: CandidateItem[];
}): CandidateScore[] {
  const { thetaHat, items } = params;
  return items.map((item) => {
    const exposureMultiplier = computeExposureMultiplier(item.exposure);
    const info = computeItemInfo(thetaHat, item.difficulty, item.thresholds);
    const u = utility({
      thetaHat,
      b: item.difficulty,
      medianTimeSec: item.medianTimeSeconds,
      blueprintMultiplier: item.blueprintMultiplier,
      exposureMultiplier,
      fatigueScalar: item.fatigueScalar
    });
    return {
      itemId: item.id,
      loIds: item.loIds,
      utility: u,
      info,
      blueprintMultiplier: item.blueprintMultiplier,
      exposureMultiplier,
      fatigueScalar: item.fatigueScalar,
      medianTimeSeconds: item.medianTimeSeconds
    };
  });
}

export function selectNextItem(params: {
  thetaHat: number;
  items: CandidateItem[];
  seed?: number;
}): SelectionResult | null {
  const { thetaHat, items, seed = 1 } = params;
  if (!items.length) return null;
  const scored = scoreCandidates({ thetaHat, items });
  const eligible = scored.filter((score) => score.exposureMultiplier > 0);
  if (!eligible.length) return null;
  const selected = pickRandomesque(
    eligible.map((score) => ({ id: score.itemId, u: score.utility })),
    Math.min(5, eligible.length),
    seed
  );
  const match = eligible.find((score) => score.itemId === selected?.id) ?? eligible[0];
  return {
    itemId: match.itemId,
    loIds: match.loIds,
    signals: match,
    pool: eligible
  };
}

export function scheduleNextLo(params: { arms: ThompsonArm[]; seed?: number }): ThompsonResult | null {
  const { arms, seed = 1 } = params;
  const eligible = arms.filter((arm) => arm.eligible);
  const pool = eligible.length ? eligible : arms;
  if (!pool.length) return null;
  const result = thompsonSchedule(pool.map(({ eligible: _eligible, cooldownHours: _cooldown, ...rest }) => rest), seed);
  if (!result) return null;
  return result;
}

export function shouldStopLo(loState: LoState): boolean {
  if (loState.itemsAttempted < STOP_RULES.minItems) {
    return false;
  }
  if (loState.se <= STOP_RULES.seThreshold) {
    return true;
  }
  if (loState.recentSes.length >= 5) {
    const deltas = loState.recentSes.slice(-5).map((value, idx, arr) => {
      if (idx === 0) return 0;
      return Math.abs(value - arr[idx - 1]);
    });
    const avgDelta =
      deltas.reduce((sum, delta) => sum + delta, 0) /
      (deltas.length > 1 ? deltas.length - 1 : 1);
    if (avgDelta < STOP_RULES.deltaSeThreshold) {
      return true;
    }
  }
  if (loState.masteryConfirmed) {
    return true;
  }
  if (loState.lastProbeDifficulty !== undefined) {
    const withinWindow = Math.abs(loState.thetaHat - loState.lastProbeDifficulty) <= STOP_RULES.probeWindow;
    const mastery = masteryProbability(loState.thetaHat, loState.se) >= STOP_RULES.masteryProb;
    if (withinWindow && mastery) {
      return true;
    }
  }
  return false;
}

export function computeRetentionBudget(params: { maxDaysOverdue: number; sessionMinutes: number }): {
  minutes: number;
  fraction: number;
} {
  const fraction = retentionBudget({ maxDaysOverdue: params.maxDaysOverdue });
  const minutes = Math.floor(params.sessionMinutes * fraction);
  return { minutes, fraction };
}

export async function runEapUpdate(params: {
  priorMu: number;
  priorSigma: number;
  response: { k: number; m: number };
  difficulty: number;
}): Promise<{ thetaHat: number; se: number }> {
  return eapUpdate(params);
}

export function buildWhyThisNext(signals: CandidateScore, extras: {
  thetaHat: number;
  se: number;
  masteryProb: number;
}): string {
  const parts = [
    `Info ${signals.info.toFixed(2)}`,
    `Blueprint×${signals.blueprintMultiplier.toFixed(2)}`,
    `Exposure×${signals.exposureMultiplier.toFixed(2)}`,
    `Fatigue×${signals.fatigueScalar.toFixed(2)}`,
    `Median ${signals.medianTimeSeconds.toFixed(1)}s`,
    `θ̂=${extras.thetaHat.toFixed(2)}`,
    `SE=${extras.se.toFixed(2)}`,
    `Mastery=${extras.masteryProb.toFixed(2)}`
  ];
  return parts.join(' · ');
}

export const rasch = { masteryProbability };

export interface MinimalAnalyticsLo {
  lo_id: string;
  attempts: number;
  current_accuracy: number;
  projected_minutes_to_mastery: number;
  overdue: boolean;
}

export interface MinimalAnalyticsSummary {
  ttm_per_lo: MinimalAnalyticsLo[];
  elg_per_min?: Array<{ item_id: string; estimated_minutes: number }>;
}

export interface LearnerStateLike {
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
}

export interface BlueprintWeights {
  weights: Record<string, number>;
}

export interface ItemLoIndex {
  id: string;
  los: string[];
}

export interface RetentionQueueEntry {
  itemId: string;
  loIds: string[];
  nextReviewMs: number;
  overdue: boolean;
  overdueDays: number;
  estimatedMinutes: number;
}

function findAnalyticsForLo(analytics: MinimalAnalyticsSummary | undefined, loId: string): MinimalAnalyticsLo | undefined {
  return analytics?.ttm_per_lo?.find((entry) => entry.lo_id === loId);
}

export function deriveLoAbility(
  loIds: string[],
  learnerState: LearnerStateLike,
  analytics?: MinimalAnalyticsSummary
): { thetaHat: number; se: number } {
  const states = loIds
    .map((loId) => learnerState.los[loId])
    .filter((value): value is LearnerLoState => Boolean(value));
  if (states.length) {
    const thetaHat = states.reduce((sum, state) => sum + (state.thetaHat ?? 0), 0) / states.length;
    const se = states.reduce((sum, state) => sum + (state.se ?? 0.6), 0) / states.length;
    return { thetaHat, se: Math.max(0.18, se) };
  }
  const analyticsEntries = loIds
    .map((loId) => findAnalyticsForLo(analytics, loId))
    .filter((value): value is MinimalAnalyticsLo => Boolean(value));
  if (analyticsEntries.length) {
    const avgAccuracy =
      analyticsEntries.reduce((sum, entry) => sum + (entry.current_accuracy ?? 0.5), 0) / analyticsEntries.length;
    const totalAttempts = analyticsEntries.reduce((sum, entry) => sum + (entry.attempts ?? 0), 0);
    const thetaHat = (avgAccuracy - 0.5) * 2;
    const se = Math.max(0.22, 0.6 - Math.min(totalAttempts / 40, 0.35));
    return { thetaHat, se };
  }
  return { thetaHat: 0, se: 0.6 };
}

function computeBlueprintMultiplierForLo(params: {
  loId: string;
  learnerState: LearnerStateLike;
  blueprint?: BlueprintWeights;
}): number {
  const { loId, learnerState, blueprint } = params;
  const target = blueprint?.weights?.[loId] ?? 0;
  const totalAttempts = Object.values(learnerState.los).reduce((sum, state) => sum + (state.itemsAttempted ?? 0), 0);
  const loAttempts = learnerState.los[loId]?.itemsAttempted ?? 0;
  if (!totalAttempts || totalAttempts === 0 || target === 0) {
    return target > 0 ? 1.1 : 1;
  }
  const share = loAttempts / totalAttempts;
  const drift = share - target;
  if (drift > 0) {
    return Math.max(0.2, 1 - drift * 2);
  }
  const boost = 1 + Math.min(1.5, Math.abs(drift) * 3);
  return Math.min(1.5, boost);
}

function computeLoCooldownHours(loId: string, learnerState: LearnerStateLike, items: ItemLoIndex[], now: number): number {
  const itemTimestamps: number[] = [];
  items.forEach((item) => {
    if (!item.los.includes(loId)) return;
    const meta = learnerState.items[item.id];
    if (meta?.lastAttemptTs) {
      itemTimestamps.push(meta.lastAttemptTs);
    }
  });
  if (itemTimestamps.length === 0) return Number.POSITIVE_INFINITY;
  const last = Math.max(...itemTimestamps);
  const diffHours = (now - last) / (1000 * 60 * 60);
  return diffHours;
}

function computeUrgency(daysSinceLast: number): number {
  return 1 + Math.max(0, daysSinceLast - 3) / 7;
}

export function buildThompsonArms(params: {
  learnerState: LearnerStateLike;
  analytics?: MinimalAnalyticsSummary;
  blueprint?: BlueprintWeights;
  items: ItemLoIndex[];
  now?: number;
  cooldownHours?: number;
}): ThompsonArm[] {
  const { learnerState, analytics, blueprint, items, now = Date.now(), cooldownHours = 96 } = params;
  const loIds = new Set<string>();
  Object.keys(learnerState.los).forEach((loId) => loIds.add(loId));
  analytics?.ttm_per_lo?.forEach((entry) => loIds.add(entry.lo_id));
  blueprint?.weights && Object.keys(blueprint.weights).forEach((loId) => loIds.add(loId));
  items.forEach((item) => item.los.forEach((loId) => loIds.add(loId)));

  const arms: ThompsonArm[] = [];
  loIds.forEach((loId) => {
    const { thetaHat, se } = deriveLoAbility([loId], learnerState, analytics);
    const deficit = Math.max(0, se - STOP_RULES.seThreshold);
    const sigma = 0.3 + se * 0.2;
    const cooldown = computeLoCooldownHours(loId, learnerState, items, now);
    const daysSinceLastRaw = Number.isFinite(cooldown) ? cooldown / 24 : 14;
    const urgency = computeUrgency(daysSinceLastRaw);
    const blueprintMult = computeBlueprintMultiplierForLo({ loId, learnerState, blueprint });
    const eligible = !Number.isFinite(cooldown) || cooldown >= cooldownHours;

    arms.push({
      loId,
      mu: deficit || 0.01,
      sigma,
      urgency,
      blueprintMultiplier: blueprintMult,
      eligible,
      cooldownHours: Number.isFinite(cooldown) ? cooldown : Number.POSITIVE_INFINITY
    });
  });
  return arms;
}

function estimateMedianSecondsForItem(
  itemId: string,
  items: ItemLoIndex[],
  analytics?: MinimalAnalyticsSummary & { elg_per_min?: Array<{ item_id: string; estimated_minutes: number }> }
): number {
  const analyticsMatch = analytics?.elg_per_min?.find((entry) => entry.item_id === itemId);
  if (analyticsMatch) {
    return Math.max(30, analyticsMatch.estimated_minutes * 60);
  }
  const loCount = items.find((item) => item.id === itemId)?.los.length ?? 0;
  const baseline = 90;
  return loCount > 1 ? baseline + loCount * 6 : baseline;
}

export function buildRetentionQueue(params: {
  learnerState: LearnerStateLike & { retention?: Record<string, { loIds: string[]; halfLifeHours: number; nextReviewMs: number; lastReviewMs?: number; lapses?: number }> };
  items: ItemLoIndex[];
  analytics?: MinimalAnalyticsSummary;
  budgetMinutes: number;
  now?: number;
}): RetentionQueueEntry[] {
  const { learnerState, items, analytics, budgetMinutes, now = Date.now() } = params;
  const cards = learnerState.retention ?? {};
  const entries: RetentionQueueEntry[] = Object.entries(cards).map(([itemId, card]) => {
    const dueInMs = card.nextReviewMs - now;
    const overdue = dueInMs <= 0;
    const overdueDays = overdue ? Math.abs(dueInMs) / (1000 * 60 * 60 * 24) : 0;
    const estSeconds = estimateMedianSecondsForItem(itemId, items, analytics);
    return {
      itemId,
      loIds: card.loIds ?? [],
      nextReviewMs: card.nextReviewMs,
      overdue,
      overdueDays,
      estimatedMinutes: Number((estSeconds / 60).toFixed(2))
    };
  });

  entries.sort((a, b) => {
    if (a.overdue && !b.overdue) return -1;
    if (!a.overdue && b.overdue) return 1;
    if (a.nextReviewMs === b.nextReviewMs) {
      return b.overdueDays - a.overdueDays;
    }
    return a.nextReviewMs - b.nextReviewMs;
  });

  const budget = Math.max(0, budgetMinutes);
  if (budget === 0) return [];

  const queue: RetentionQueueEntry[] = [];
  let minutesUsed = 0;
  for (const entry of entries) {
    const cost = Math.max(0.5, entry.estimatedMinutes);
    if (minutesUsed + cost > budget && queue.length > 0) break;
    queue.push(entry);
    minutesUsed += cost;
    if (minutesUsed >= budget) break;
  }
  return queue;
}

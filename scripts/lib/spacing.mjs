const DEFAULTS = Object.freeze({
  baseHalfLifeHours: 12,
  minHalfLifeHours: 0.5,
  maxHalfLifeHours: 720,
  gamma: 0.35,
  targetRetention: 0.9,
  fatigueCooldownMultiplier: 1.1
});

/**
 * Update half-life hours using a simple exponential adjustment.
 * @param {object} params
 * @param {number} params.halfLifeHours Current half-life in hours.
 * @param {number} params.expected Expected probability of success.
 * @param {boolean} params.correct Outcome (true if correct).
 * @param {number} [params.fatigueStrikes] Count of recent fast-wrong responses.
 * @param {Partial<typeof DEFAULTS>} [params.config]
 * @returns {{ halfLifeHours: number, cooldownApplied: boolean }}
 */
export function updateHalfLife({
  halfLifeHours = DEFAULTS.baseHalfLifeHours,
  expected,
  correct,
  fatigueStrikes = 0,
  config = {}
}) {
  const merged = { ...DEFAULTS, ...config };
  const outcome = correct ? 1 : 0;
  const delta = Math.exp(merged.gamma * (outcome - expected));
  let nextHalfLife = halfLifeHours * delta;
  let cooldownApplied = false;

  if (fatigueStrikes >= 3) {
    cooldownApplied = true;
    nextHalfLife *= merged.fatigueCooldownMultiplier;
  }

  nextHalfLife = clamp(nextHalfLife, merged.minHalfLifeHours, merged.maxHalfLifeHours);
  return { halfLifeHours: nextHalfLife, cooldownApplied };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Schedule the next review timestamp based on half-life.
 * @param {object} params
 * @param {number} params.halfLifeHours Current half-life.
 * @param {number} [params.nowMs] Reference timestamp (ms since epoch).
 * @param {Partial<typeof DEFAULTS>} [params.config]
 * @returns {{ nextReviewMs: number, intervalMs: number }}
 */
export function scheduleNextReview({ halfLifeHours, nowMs = Date.now(), config = {} }) {
  const merged = { ...DEFAULTS, ...config };
  const lnRetention = Math.log(1 / merged.targetRetention) / Math.log(2);
  const intervalHours = halfLifeHours * lnRetention;
  const intervalMs = Math.max(intervalHours, merged.minHalfLifeHours) * 60 * 60 * 1000;
  return { nextReviewMs: nowMs + intervalMs, intervalMs };
}

export const DEFAULT_SPACING_CONFIG = DEFAULTS;


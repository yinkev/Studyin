/**
 * Exposure ledger and multipliers enforcing caps:
 * ≤1/day, ≤2/week, 96h cooldown. Deterministic pure functions.
 */

/**
 * Compute exposure multiplier given last exposures.
 * @param {{ last24h:number, last7d:number, hoursSinceLast:number }} p
 */
export function exposureMultiplier({ last24h, last7d, hoursSinceLast }) {
  if (last24h >= 1) return 0; // daily cap
  if (last7d >= 2) return 0; // weekly cap
  if (hoursSinceLast < 96) return 0; // cooldown
  if (hoursSinceLast < 168) return 0.5; // 4–7 days: partial restoration
  return 1.0; // fully restored
}

/**
 * Reduce exposure when overfamiliar (mean score >0.9 and SE<0.15).
 */
export function clampOverfamiliar({ meanScore, se, base = 1.0 }) {
  if (meanScore > 0.9 && se < 0.15) return Math.min(base, 0.6);
  return base;
}

export default { exposureMultiplier, clampOverfamiliar };


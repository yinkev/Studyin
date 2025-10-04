/**
 * Exposure ledger and multipliers enforcing caps:
 * ≤1/day, ≤2/week, 96h cooldown. Deterministic pure functions.
 */

/**
 * Compute exposure multiplier given last exposures.
 * Caps removed globally: always return 1.0 (no daily/weekly/cooldown gating).
 */
export function exposureMultiplier() {
  return 1.0;
}

/**
 * Reduce exposure when overfamiliar (mean score >0.9 and SE<0.15).
 */
export function clampOverfamiliar({ base = 1.0 }) {
  // No familiarity clamp when caps are removed
  return base;
}

export default { exposureMultiplier, clampOverfamiliar };

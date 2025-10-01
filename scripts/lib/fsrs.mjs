/**
 * FSRS-inspired retention scheduling stubs.
 * Provides half-life updates and next-review calculation with overdue boosts.
 */

/**
 * Update half-life given expected recall and outcome.
 * Placeholder parameters; align with FSRS in future.
 * @param {{ halfLifeHours:number, expected:number, correct:boolean }} p
 */
export function updateHalfLife({ halfLifeHours, expected, correct }) {
  const gain = correct ? (0.2 + 0.6 * (1 - expected)) : -0.5 * (0.3 + 0.7 * expected);
  const next = Math.max(1 / 60, halfLifeHours * Math.exp(gain));
  return { halfLifeHours: next };
}

/**
 * Schedule next review time in ms.
 * @param {{ halfLifeHours:number, nowMs?:number }} p
 */
export function scheduleNextReview({ halfLifeHours, nowMs = Date.now() }) {
  const intervalMs = Math.max(1, halfLifeHours * 3600 * 1000);
  return { nextReviewMs: nowMs + intervalMs, intervalMs };
}

/**
 * Compute session retention budget (fraction of session minutes).
 * @param {{ maxDaysOverdue:number }} p
 */
export function retentionBudget({ maxDaysOverdue }) {
  return maxDaysOverdue > 7 ? 0.6 : 0.4;
}

export default { updateHalfLife, scheduleNextReview, retentionBudget };


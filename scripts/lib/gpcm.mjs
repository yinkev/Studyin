/**
 * Generalized Partial Credit Model (GPCM) helpers.
 * This is a minimal placeholder that supports dichotomous items by
 * delegating to a 1-PL logistic curve. Extend to full GPCM with
 * category thresholds τ for polytomous items.
 */

import { pCorrect } from './rasch.mjs';

/**
 * PMF for category k given ability theta, difficulty b, and thresholds tau.
 * For dichotomous items (m=1), returns {0: 1-p, 1: p}.
 * @param {number} theta
 * @param {number} b
 * @param {number[]} tau Category thresholds (unused in dichotomous stub)
 * @param {number} m Max category (defaults 1)
 * @returns {number[]} probabilities for k=0..m
 */
export function gpcmPmf(theta, b, tau = [], m = 1) {
  if (m <= 1) {
    const p = pCorrect(theta, b);
    return [1 - p, p];
  }
  // Placeholder: uniform over categories (to be replaced with proper GPCM)
  const probs = Array.from({ length: m + 1 }, () => 1 / (m + 1));
  return probs;
}

export default { gpcmPmf };


/**
 * Rasch (1-PL) + EAP utilities with Gauss–Hermite quadrature stubs.
 * Deterministic, no side effects. This module provides the interfaces
 * referenced by IMPLEMENTATION.md; internals can be upgraded without
 * breaking callers as long as signatures remain stable.
 */

// 41-point Gauss–Hermite nodes/weights (abridged placeholder; expand for production)
const GH_NODES = Array.from({ length: 41 }, (_, i) => (i - 20) * 0.1);
const GH_WEIGHTS = Array.from({ length: 41 }, () => 1 / 41);

/**
 * Logistic 1-PL probability of correct response.
 * @param {number} theta ability
 * @param {number} b item difficulty
 * @returns {number} P(correct)
 */
export function pCorrect(theta, b) {
  const z = theta - b;
  return 1 / (1 + Math.exp(-z));
}

/**
 * Dichotomous item Fisher information under 1-PL.
 * For GPCM, use category variance trick; this is a placeholder until thresholds are fit.
 * @param {number} theta
 * @param {number} b
 */
export function info(theta, b) {
  const p = pCorrect(theta, b);
  return p * (1 - p);
}

/**
 * EAP update with Gauss–Hermite quadrature (stub using equispaced nodes/weights).
 * @param {object} params
 * @param {number} params.priorMu
 * @param {number} params.priorSigma
 * @param {{k:number,m:number}} params.response Partial credit: k of m (use m=1 for dichotomous)
 * @param {number} params.b Item difficulty
 * @returns {{ thetaHat: number, se: number }}
 */
export function eapUpdate({ priorMu, priorSigma, response, b }) {
  const m = Math.max(1, response?.m ?? 1);
  const k = Math.min(m, Math.max(0, response?.k ?? 0));

  let num = 0;
  let den = 0;
  let mean = 0;
  for (let i = 0; i < GH_NODES.length; i += 1) {
    const theta = priorMu + priorSigma * GH_NODES[i];
    const w = GH_WEIGHTS[i];
    const p = pCorrect(theta, b);
    // simple binomial likelihood as a stand-in for GPCM
    const like = Math.pow(p, k) * Math.pow(1 - p, m - k);
    const weight = w * like;
    num += weight * theta;
    den += weight;
  }
  mean = den > 0 ? num / den : priorMu;
  let varSum = 0;
  for (let i = 0; i < GH_NODES.length; i += 1) {
    const theta = priorMu + priorSigma * GH_NODES[i];
    const w = GH_WEIGHTS[i];
    const p = pCorrect(theta, b);
    const like = Math.pow(p, k) * Math.pow(1 - p, m - k);
    const weight = w * like / (den || 1);
    varSum += weight * (theta - mean) * (theta - mean);
  }
  const se = Math.sqrt(Math.max(1e-12, varSum));
  return { thetaHat: mean, se };
}

/**
 * Map Elo rating R (scale 400, baseline 1500) to Rasch theta.
 * @param {number} R
 */
export function eloToTheta(R) {
  return (R - 1500) / 400;
}

/**
 * Mastery probability Φ((θ̂ − θ_cut)/SE) with θ_cut=0 by default.
 * @param {number} thetaHat
 * @param {number} se
 * @param {number} [thetaCut=0]
 */
export function masteryProbability(thetaHat, se, thetaCut = 0) {
  const z = (thetaHat - thetaCut) / (se || 1e-6);
  // error function based normal CDF approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-0.5 * z * z);
  const prob = 1 - d * t * (1.330274429 * t - 1.821255978 * t * t + 1.781477937 * t ** 3 - 0.356563782 * t ** 4 + 0.319381530 * t ** 5);
  return z >= 0 ? prob : 1 - prob;
}

export default {
  pCorrect,
  info,
  eapUpdate,
  eloToTheta,
  masteryProbability
};


/**
 * In-LO candidate selector utility and randomesque pick.
 * Deterministic given inputs; randomness can be seeded via a simple PRNG.
 */

import { info } from './rasch.mjs';

function mul(...xs) {
  return xs.reduce((a, b) => a * b, 1);
}

/**
 * Compute utility for an item candidate.
 * @param {object} params
 * @param {number} params.thetaHat
 * @param {number} params.b
 * @param {number} params.medianTimeSec
 * @param {number} params.blueprintMultiplier
 * @param {number} params.exposureMultiplier
 * @param {number} params.fatigueScalar
 */
export function utility({ thetaHat, b, medianTimeSec, blueprintMultiplier, exposureMultiplier, fatigueScalar }) {
  const I = info(thetaHat, b);
  const time = Math.max(1, medianTimeSec);
  return (I / time) * mul(blueprintMultiplier, exposureMultiplier, fatigueScalar);
}

/**
 * Randomesque pick: rank by utility, take top K, choose uniformly.
 * @param {Array<{ id:string, u:number }>} scored
 * @param {number} k
 * @param {number} [seed=1]
 */
export function pickRandomesque(scored, k, seed = 1) {
  const sorted = [...scored].sort((a, b) => b.u - a.u);
  const top = sorted.slice(0, Math.max(1, k));
  // xorshift32 for deterministic pseudo-random
  let x = seed | 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  const idx = Math.abs(x) % top.length;
  return top[idx];
}

export default { utility, pickRandomesque };


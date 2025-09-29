/**
 * Cross-topic Thompson Sampling scheduler over LO arms optimizing ΔSE/min.
 * Deterministic sampling via seeded RNG for reproducibility.
 */

function xorshift32(seed) {
  let x = seed | 0;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    // scale to (0,1)
    return ((x >>> 0) / 0xffffffff);
  };
}

/**
 * Sample from N(mu, sigma^2) with seeded RNG.
 */
function normalSample(mu, sigma, rng) {
  // Box–Muller
  const u1 = Math.max(Number.EPSILON, rng());
  const u2 = Math.max(Number.EPSILON, rng());
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mu + sigma * z0;
}

/**
 * Score LOs via TS × urgency × blueprint multiplier and pick the best.
 * @param {Array<{ loId:string, mu:number, sigma:number, urgency:number, blueprintMultiplier:number }>} arms
 * @param {number} seed
 */
export function thompsonSchedule(arms, seed = 1) {
  const rng = xorshift32(seed);
  let best = null;
  let bestScore = -Infinity;
  for (const arm of arms) {
    const sample = normalSample(arm.mu, Math.max(1e-6, arm.sigma), rng);
    const score = sample * arm.urgency * arm.blueprintMultiplier;
    if (score > bestScore) {
      best = { loId: arm.loId, score, sample };
      bestScore = score;
    }
  }
  return best;
}

export default { thompsonSchedule };


const CAP_DISABLED = () => {
  const flag = process.env.STUDY_NO_CAPS;
  if (!flag) return false;
  return flag === '1' || flag.toLowerCase() === 'true';
};

function normalizeNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Reduce exposure when the learner is overfamiliar with an item.
 * Applies even when caps are disabled.
 */
export function clampOverfamiliar({ base = 1.0, meanScore, se }) {
  const score = normalizeNumber(meanScore, 0);
  const stderr = normalizeNumber(se, 1);
  if (score > 0.9 && stderr < 0.15) {
    return Math.min(base, 0.6);
  }
  return base;
}

/**
 * Deterministic exposure multiplier enforcing ≤1/day, ≤2/week, and 96h cooldown.
 * Returns 0 when caps are exceeded unless the STUDY_NO_CAPS flag is set.
 */
export function exposureMultiplier(exposure = {}) {
  const disableCaps = CAP_DISABLED();
  const last24h = normalizeNumber(exposure.last24h, 0);
  const last7d = normalizeNumber(exposure.last7d, 0);
  const hoursSinceLast = normalizeNumber(exposure.hoursSinceLast, Number.POSITIVE_INFINITY);

  let base = 1.0;
  if (!disableCaps) {
    if (last24h >= 1) {
      base = 0;
    } else if (last7d >= 2) {
      base = 0;
    } else if (hoursSinceLast < 96) {
      base = 0;
    }
  }

  return clampOverfamiliar({
    base,
    meanScore: exposure.meanScore,
    se: exposure.se
  });
}

export default { exposureMultiplier, clampOverfamiliar };

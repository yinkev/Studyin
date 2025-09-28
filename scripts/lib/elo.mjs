const DEFAULTS = Object.freeze({
  kUserLearn: 0.08,
  kUserExam: 0.04,
  kItem: 0.02,
  maxDeltaUser: 0.5,
  maxDeltaItem: 0.25
});

/**
 * Logistic expected probability of a correct response.
 * @param {number} theta Learner ability.
 * @param {number} beta Item difficulty.
 * @returns {number}
 */
export function expectedProbability(theta, beta) {
  const exponent = -(theta - beta);
  return 1 / (1 + Math.exp(exponent));
}

function clamp(value, limit) {
  return Math.max(-limit, Math.min(limit, value));
}

/**
 * Update learner ability given an outcome.
 * @param {object} params
 * @param {number} params.theta Current ability.
 * @param {number} params.beta Item difficulty.
 * @param {boolean} params.correct Outcome (true if correct).
 * @param {'learn'|'exam'|'drill'|'spotter'} params.mode Session mode.
 * @param {Partial<typeof DEFAULTS>} [params.config]
 * @returns {number} Updated ability.
 */
export function updateAbility({ theta, beta, correct, mode, config = {} }) {
  const merged = { ...DEFAULTS, ...config };
  const p = expectedProbability(theta, beta);
  const outcome = correct ? 1 : 0;
  const kUser = mode === 'exam' ? merged.kUserExam : merged.kUserLearn;
  const delta = clamp(kUser * (outcome - p), merged.maxDeltaUser);
  return theta + delta;
}

/**
 * Update item difficulty based on outcome.
 * @param {object} params
 * @param {number} params.theta Learner ability.
 * @param {number} params.beta Current item difficulty.
 * @param {boolean} params.correct Outcome (true if correct).
 * @param {Partial<typeof DEFAULTS>} [params.config]
 * @returns {number} Updated difficulty.
 */
export function updateItemDifficulty({ theta, beta, correct, config = {} }) {
  const merged = { ...DEFAULTS, ...config };
  const p = expectedProbability(theta, beta);
  const outcome = correct ? 1 : 0;
  const delta = clamp(-merged.kItem * (outcome - p), merged.maxDeltaItem);
  return beta + delta;
}

/**
 * Convenience helper updating both ability and difficulty.
 * @param {object} params
 * @param {number} params.theta
 * @param {number} params.beta
 * @param {boolean} params.correct
 * @param {'learn'|'exam'|'drill'|'spotter'} params.mode
 * @param {Partial<typeof DEFAULTS>} [params.config]
 * @returns {{ theta: number, beta: number, p: number }}
 */
export function updateAbilityAndDifficulty(params) {
  const p = expectedProbability(params.theta, params.beta);
  return {
    theta: updateAbility({ ...params }),
    beta: updateItemDifficulty({ ...params }),
    p
  };
}

export const DEFAULT_ELO_CONFIG = DEFAULTS;


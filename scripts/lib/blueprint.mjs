import { blueprintSchema } from './schema.mjs';

/**
 * Compute integer LO targets for a given form length using largest remainder.
 * @param {import('./schema.mjs').Blueprint} blueprint
 * @param {number} formLength
 * @returns {Map<string, number>}
 */
export function deriveLoTargets(blueprint, formLength) {
  blueprintSchema.parse(blueprint);
  if (!Number.isInteger(formLength) || formLength <= 0) {
    throw new Error('formLength must be a positive integer');
  }

  const entries = Object.entries(blueprint.weights);
  if (!entries.length) {
    throw new Error('Blueprint has no LO weights');
  }

  const interim = entries.map(([loId, weight]) => {
    const raw = weight * formLength;
    const base = Math.floor(raw);
    return { loId, base, remainder: raw - base };
  });

  let assigned = interim.reduce((sum, item) => sum + item.base, 0);
  const targets = new Map(interim.map(({ loId, base }) => [loId, base]));

  const sortedRemainders = [...interim].sort((a, b) => b.remainder - a.remainder);
  let idx = 0;
  while (assigned < formLength) {
    const current = sortedRemainders[idx % sortedRemainders.length];
    targets.set(current.loId, (targets.get(current.loId) ?? 0) + 1);
    assigned += 1;
    idx += 1;
  }

  return targets;
}

/**
 * Test whether the available items can satisfy the blueprint counts.
 * @param {import('./schema.mjs').Blueprint} blueprint
 * @param {Array<import('./schema.mjs').Item>} items
 * @param {number} formLength
 * @returns {boolean}
 */
export function isBlueprintFeasible(blueprint, items, formLength) {
  const targets = deriveLoTargets(blueprint, formLength);
  for (const [loId, required] of targets.entries()) {
    const supply = items.filter((item) => item.los.includes(loId)).length;
    if (supply < required) {
      return false;
    }
  }
  return true;
}

const MULTIPLIER = 48271;
const MODULUS = 0x7fffffff;

function createPrng(seed = 1) {
  let state = (seed & 0x7fffffff) || 1;
  return () => {
    state = (state * MULTIPLIER) % MODULUS;
    return state / MODULUS;
  };
}

/**
 * Build a form greedily while respecting blueprint deficits.
 * @param {object} params
 * @param {import('./schema.mjs').Blueprint} params.blueprint
 * @param {Array<import('./schema.mjs').Item>} params.items
 * @param {number} params.formLength
 * @param {number} [params.seed]
 * @returns {Array<import('./schema.mjs').Item>}
 */
export function buildFormGreedy({ blueprint, items, formLength, seed = 1 }) {
  if (!isBlueprintFeasible(blueprint, items, formLength)) {
    throw new Error('Blueprint infeasible with provided item bank');
  }

  const targets = deriveLoTargets(blueprint, formLength);
  const selected = [];
  const usedIds = new Set();
  const rng = createPrng(seed);

  const pool = [...items];

  while (selected.length < formLength) {
    const deficits = Array.from(targets.entries())
      .map(([loId, target]) => ({
        loId,
        deficit: target - selected.filter((item) => item.los.includes(loId)).length
      }))
      .filter(({ deficit }) => deficit > 0)
      .sort((a, b) => b.deficit - a.deficit);

    let chosen = null;

    for (const deficit of deficits) {
      const candidates = pool.filter(
        (item) => !usedIds.has(item.id) && item.los.includes(deficit.loId)
      );
      if (candidates.length) {
        const pickIndex = Math.floor(rng() * candidates.length);
        chosen = candidates[pickIndex];
        break;
      }
    }

    if (!chosen) {
      const remaining = pool.filter((item) => !usedIds.has(item.id));
      if (!remaining.length) {
        throw new Error('Ran out of items while building form');
      }
      const pickIndex = Math.floor(rng() * remaining.length);
      chosen = remaining[pickIndex];
    }

    selected.push(chosen);
    usedIds.add(chosen.id);
  }

  return selected;
}


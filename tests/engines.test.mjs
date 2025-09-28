import { describe, it, expect } from 'vitest';
import { expectedProbability, updateAbility, updateItemDifficulty } from '../scripts/lib/elo.mjs';
import { updateHalfLife, scheduleNextReview } from '../scripts/lib/spacing.mjs';
import { deriveLoTargets, isBlueprintFeasible, buildFormGreedy } from '../scripts/lib/blueprint.mjs';

describe('elo-lite engine', () => {
  it('computes symmetric expected probability', () => {
    expect(expectedProbability(0, 0)).toBeCloseTo(0.5, 5);
    expect(expectedProbability(1, -1)).toBeCloseTo(0.88, 2);
  });

  it('updates ability and difficulty inversely on correct answer', () => {
    const theta = 0;
    const beta = 0.2;
    const nextTheta = updateAbility({ theta, beta, correct: true, mode: 'learn' });
    const nextBeta = updateItemDifficulty({ theta, beta, correct: true });
    expect(nextTheta).toBeGreaterThan(theta);
    expect(nextBeta).toBeGreaterThan(beta - 0.25);
  });
});

describe('spacing engine', () => {
  it('extends half-life after correct response', () => {
    const current = 6;
    const { halfLifeHours } = updateHalfLife({
      halfLifeHours: current,
      expected: 0.6,
      correct: true
    });
    expect(halfLifeHours).toBeGreaterThan(current);
  });

  it('schedules future review respecting retention target', () => {
    const now = Date.now();
    const { nextReviewMs, intervalMs } = scheduleNextReview({ halfLifeHours: 12, nowMs: now });
    expect(nextReviewMs).toBeGreaterThan(now);
    expect(intervalMs).toBeGreaterThan(0);
  });
});

describe('blueprint fitter', () => {
  const blueprint = {
    schema_version: '1.0.0',
    id: 'test-blueprint',
    weights: {
      'lo.alpha': 0.5,
      'lo.beta': 0.3,
      'lo.gamma': 0.2
    }
  };

  const items = Array.from({ length: 6 }).map((_, index) => ({
    schema_version: '1.0.0',
    id: `item-${index + 1}`,
    stem: 'placeholder',
    choices: { A: '1', B: '2', C: '3', D: '4', E: '5' },
    key: 'A',
    rationale_correct: 'Because.',
    rationale_distractors: { A: 'NA', B: 'No', C: 'No', D: 'No', E: 'No' },
    los: index % 2 === 0 ? ['lo.alpha'] : ['lo.beta', 'lo.gamma'],
    difficulty: 'medium',
    bloom: 'apply',
    evidence: { file: 'file.pdf', page: 1, bbox: [0, 0, 10, 10] },
    status: 'draft'
  }));

  it('derives LO targets summing to form length', () => {
    const formLength = 5;
    const targets = deriveLoTargets(blueprint, formLength);
    const sum = Array.from(targets.values()).reduce((acc, cur) => acc + cur, 0);
    expect(sum).toBe(formLength);
  });

  it('checks feasibility against item supply', () => {
    expect(isBlueprintFeasible(blueprint, items, 5)).toBe(true);
    expect(isBlueprintFeasible(blueprint, items.slice(0, 2), 5)).toBe(false);
  });

  it('builds deterministic form respecting targets', () => {
    const form = buildFormGreedy({ blueprint, items, formLength: 5, seed: 42 });
    expect(form).toHaveLength(5);
    const counts = form.reduce((map, item) => {
      item.los.forEach((lo) => {
        map.set(lo, (map.get(lo) ?? 0) + 1);
      });
      return map;
    }, new Map());
    expect(counts.get('lo.alpha')).toBeGreaterThanOrEqual(2);
  });
});

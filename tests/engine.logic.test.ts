import { describe, expect, it } from 'vitest';
import {
  STOP_RULES,
  scoreCandidates,
  selectNextItem,
  scheduleNextLo,
  shouldStopLo,
  computeRetentionBudget,
  buildThompsonArms,
  buildRetentionQueue
} from '../lib/study-engine';

describe('scoreCandidates & selectNextItem', () => {
  it('filters by exposure caps and ranks by utility', () => {
    const items = [
      {
        id: 'item-blocked',
        loIds: ['lo.alpha'],
        difficulty: 0,
        thresholds: undefined,
        medianTimeSeconds: 120,
        blueprintMultiplier: 1,
        exposure: {
          last24h: 1,
          last7d: 2,
          hoursSinceLast: 10,
          meanScore: 0.5,
          se: 0.3
        },
        fatigueScalar: 1
      },
      {
        id: 'item-open',
        loIds: ['lo.alpha'],
        difficulty: 0.1,
        thresholds: undefined,
        medianTimeSeconds: 90,
        blueprintMultiplier: 1.2,
        exposure: {
          last24h: 0,
          last7d: 0,
          hoursSinceLast: 200,
          meanScore: 0.6,
          se: 0.25
        },
        fatigueScalar: 0.9
      }
    ];

    const scored = scoreCandidates({ thetaHat: 0, items });
    const blocked = scored.find((score) => score.itemId === 'item-blocked');
    const open = scored.find((score) => score.itemId === 'item-open');

    expect(blocked?.exposureMultiplier).toBe(0);
    expect(open?.exposureMultiplier).toBeGreaterThan(0.5);

    const selection = selectNextItem({ thetaHat: 0, items, seed: 7 });
    expect(selection?.itemId).toBe('item-open');
    expect(selection?.signals.utility).toBeGreaterThan(0);
  });
});

describe('scheduleNextLo', () => {
  it('chooses arm with highest TS score when sigma is zero', () => {
    const result = scheduleNextLo({
      seed: 13,
      arms: [
        { loId: 'lo.alpha', mu: 0.1, sigma: 0, urgency: 1, blueprintMultiplier: 1, eligible: true, cooldownHours: 0 },
        { loId: 'lo.beta', mu: 0.2, sigma: 0, urgency: 1.1, blueprintMultiplier: 1.05, eligible: true, cooldownHours: 0 }
      ]
    });

    expect(result?.loId).toBe('lo.beta');
    expect(result?.score).toBeCloseTo(0.2 * 1.1 * 1.05, 5);
  });

  it('builds arms from learner state and analytics', () => {
    const learnerState = {
      los: {
        'lo.alpha': { thetaHat: 0.1, se: 0.25, itemsAttempted: 5, recentSes: [], priorMu: 0.1, priorSigma: 0.3 }
      },
      items: {
        'item-1': { attempts: 2, correct: 1, lastAttemptTs: Date.now() - 5 * 24 * 60 * 60 * 1000 }
      }
    };
    const analytics = {
      ttm_per_lo: [
        {
          lo_id: 'lo.alpha',
          attempts: 5,
          current_accuracy: 0.6,
          projected_minutes_to_mastery: 1.2,
          overdue: true
        },
        {
          lo_id: 'lo.beta',
          attempts: 2,
          current_accuracy: 0.4,
          projected_minutes_to_mastery: 2,
          overdue: false
        }
      ]
    };
    const blueprint = { weights: { 'lo.alpha': 0.5, 'lo.beta': 0.5 } };
    const arms = buildThompsonArms({
      learnerState,
      analytics,
      blueprint,
      items: [
        { id: 'item-1', los: ['lo.alpha'] },
        { id: 'item-2', los: ['lo.beta'] }
      ]
    });
    expect(arms).toHaveLength(2);
    const alphaArm = arms.find((arm) => arm.loId === 'lo.alpha');
    expect(alphaArm).toBeDefined();
    expect(alphaArm?.eligible).toBe(true);
    expect(alphaArm?.mu).toBeGreaterThan(0);
  });
});

describe('shouldStopLo', () => {
  it('enforces stop rules based on deltas, SE, and mastery probe', () => {
    const notEnough = {
      thetaHat: 0.2,
      se: 0.25,
      itemsAttempted: STOP_RULES.minItems - 1,
      recentSes: Array.from({ length: 5 }, () => 0.25),
      lastProbeDifficulty: 0.25,
      masteryConfirmed: false
    };
    expect(shouldStopLo(notEnough)).toBe(false);

    const base = {
      thetaHat: 0.2,
      se: 0.25,
      itemsAttempted: STOP_RULES.minItems,
      recentSes: Array.from({ length: 5 }, () => 0.25),
      lastProbeDifficulty: 0.25,
      masteryConfirmed: false
    };

    expect(shouldStopLo(base)).toBe(true);

    const lowSe = { ...base, se: 0.18 };
    expect(shouldStopLo(lowSe)).toBe(true);

    const mastery = { ...base, se: 0.22, lastProbeDifficulty: 0.22 };
    expect(shouldStopLo(mastery)).toBe(true);
  });
});

describe('computeRetentionBudget', () => {
  it('clips to correct fraction based on overdue days', () => {
    const regular = computeRetentionBudget({ maxDaysOverdue: 2, sessionMinutes: 50 });
    expect(regular.fraction).toBe(0.4);
    expect(regular.minutes).toBe(20);

    const overdue = computeRetentionBudget({ maxDaysOverdue: 8, sessionMinutes: 50 });
    expect(overdue.fraction).toBe(0.6);
    expect(overdue.minutes).toBe(30);
  });
});

describe('buildRetentionQueue', () => {
  it('returns due items within budget order', () => {
    const now = Date.now();
    const learnerState = {
      los: {},
      items: {},
      retention: {
        'item.a': { loIds: ['lo.alpha'], halfLifeHours: 24, nextReviewMs: now - 3600 * 1000 },
        'item.b': { loIds: ['lo.beta'], halfLifeHours: 12, nextReviewMs: now + 2 * 3600 * 1000 }
      }
    };
    const queue = buildRetentionQueue({
      learnerState,
      items: [
        { id: 'item.a', los: ['lo.alpha'] },
        { id: 'item.b', los: ['lo.beta'] }
      ],
      budgetMinutes: 10,
      now
    });
    expect(queue.length).toBeGreaterThan(0);
    expect(queue[0].itemId).toBe('item.a');
    expect(queue[0].overdue).toBe(true);
  });
});

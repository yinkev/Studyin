/**
 * Engine Cooldown Integration Tests
 *
 * Tests cooldown eligibility and exposure cap enforcement
 */

import { describe, expect, it } from 'vitest';
import { buildThompsonArms, scheduleNextLo } from '../lib/study-engine';
import type { LearnerState } from '../lib/server/study-state';
import type { ItemLoIndex } from '../lib/study-engine';

describe('Engine Cooldown Integration', () => {
  it('marks LOs as ineligible when within cooldown window', () => {
    const now = Date.now();
    const recentTimestamp = now - 24 * 60 * 60 * 1000; // 24 hours ago (within 96h cooldown)
    const oldTimestamp = now - 100 * 60 * 60 * 1000; // 100 hours ago (outside 96h cooldown)

    const learnerState: LearnerState = {
      learnerId: 'test',
      updatedAt: new Date().toISOString(),
      los: {
        'lo-recent': {
          thetaHat: 0.5,
          se: 0.8,
          itemsAttempted: 5,
          recentSes: [0.8, 0.75],
          priorMu: 0,
          priorSigma: 0.8,
        },
        'lo-old': {
          thetaHat: 0.5,
          se: 0.8,
          itemsAttempted: 5,
          recentSes: [0.8, 0.75],
          priorMu: 0,
          priorSigma: 0.8,
        },
      },
      items: {
        'lo-recent-item-1': {
          attempts: 3,
          correct: 2,
          lastAttemptTs: recentTimestamp,
          recentAttempts: [recentTimestamp],
        },
        'lo-old-item-1': {
          attempts: 3,
          correct: 2,
          lastAttemptTs: oldTimestamp,
          recentAttempts: [oldTimestamp],
        },
      },
      retention: {},
    };

    const items: ItemLoIndex[] = [
      {
        id: 'lo-recent-item-1',
        los: ['lo-recent'],
        difficulty: 0.5,
        thresholds: undefined,
        medianTimeSeconds: 60,
      },
      {
        id: 'lo-old-item-1',
        los: ['lo-old'],
        difficulty: 0.5,
        thresholds: undefined,
        medianTimeSeconds: 60,
      },
    ];

    const arms = buildThompsonArms({
      learnerState,
      items,
      now,
      cooldownHours: 96, // 96 hour cooldown
    });

    const recentArm = arms.find(a => a.loId === 'lo-recent');
    const oldArm = arms.find(a => a.loId === 'lo-old');

    expect(recentArm).toBeDefined();
    expect(oldArm).toBeDefined();

    // Recent LO should be ineligible (within cooldown)
    expect(recentArm!.eligible).toBe(false);
    expect(recentArm!.cooldownHours).toBeLessThan(96);

    // Old LO should be eligible (outside cooldown)
    expect(oldArm!.eligible).toBe(true);
    expect(oldArm!.cooldownHours).toBeGreaterThanOrEqual(96);
  });

  it('respects cooldown when scheduling next LO', () => {
    const now = Date.now();
    const recentTimestamp = now - 48 * 60 * 60 * 1000; // 48 hours ago

    const learnerState: LearnerState = {
      learnerId: 'test',
      updatedAt: new Date().toISOString(),
      los: {
        'lo-alpha': {
          thetaHat: 0.5,
          se: 0.8,
          itemsAttempted: 5,
          recentSes: [0.8, 0.75],
          priorMu: 0,
          priorSigma: 0.8,
        },
        'lo-beta': {
          thetaHat: 0.5,
          se: 0.9,
          itemsAttempted: 2,
          recentSes: [0.9],
          priorMu: 0,
          priorSigma: 0.8,
        },
      },
      items: {
        'lo-alpha-item-1': {
          attempts: 5,
          correct: 3,
          lastAttemptTs: recentTimestamp,
          recentAttempts: [recentTimestamp],
        },
      },
      retention: {},
    };

    const items: ItemLoIndex[] = [
      {
        id: 'lo-alpha-item-1',
        los: ['lo-alpha'],
        difficulty: 0.5,
        thresholds: undefined,
        medianTimeSeconds: 60,
      },
      {
        id: 'lo-beta-item-1',
        los: ['lo-beta'],
        difficulty: 0.5,
        thresholds: undefined,
        medianTimeSeconds: 60,
      },
    ];

    const arms = buildThompsonArms({
      learnerState,
      items,
      cooldownHours: 96,
      now,
    });

    const result = scheduleNextLo({
      arms,
      seed: 12345,
    });

    // Should select lo-beta because lo-alpha is in cooldown
    expect(result).toBeDefined();
    expect(result!.loId).toBe('lo-beta');
  });

  it('allows selection from eligible pool when all LOs outside cooldown', () => {
    const now = Date.now();
    const oldTimestamp = now - 100 * 60 * 60 * 1000; // 100 hours ago

    const learnerState: LearnerState = {
      learnerId: 'test',
      updatedAt: new Date().toISOString(),
      los: {
        'lo-alpha': {
          thetaHat: 0.5,
          se: 0.8,
          itemsAttempted: 5,
          recentSes: [0.8, 0.75],
          priorMu: 0,
          priorSigma: 0.8,
        },
        'lo-beta': {
          thetaHat: 0.5,
          se: 0.9,
          itemsAttempted: 2,
          recentSes: [0.9],
          priorMu: 0,
          priorSigma: 0.8,
        },
      },
      items: {
        'lo-alpha-item-1': {
          attempts: 5,
          correct: 3,
          lastAttemptTs: oldTimestamp,
          recentAttempts: [oldTimestamp],
        },
        'lo-beta-item-1': {
          attempts: 2,
          correct: 1,
          lastAttemptTs: oldTimestamp,
          recentAttempts: [oldTimestamp],
        },
      },
      retention: {},
    };

    const items: ItemLoIndex[] = [
      {
        id: 'lo-alpha-item-1',
        los: ['lo-alpha'],
        difficulty: 0.5,
        thresholds: undefined,
        medianTimeSeconds: 60,
      },
      {
        id: 'lo-beta-item-1',
        los: ['lo-beta'],
        difficulty: 0.5,
        thresholds: undefined,
        medianTimeSeconds: 60,
      },
    ];

    const arms = buildThompsonArms({
      learnerState,
      items,
      now,
      cooldownHours: 96,
    });

    // Both should be eligible
    expect(arms.every(a => a.eligible)).toBe(true);

    const result = scheduleNextLo({
      arms,
      seed: 12345,
    });

    // Should select from both (whichever Thompson sampling chooses)
    expect(result).toBeDefined();
    expect(['lo-alpha', 'lo-beta']).toContain(result!.loId);
  });

  it('falls back to ineligible pool if no eligible LOs available', () => {
    const now = Date.now();
    const recentTimestamp = now - 10 * 60 * 60 * 1000; // 10 hours ago (all in cooldown)

    const learnerState: LearnerState = {
      learnerId: 'test',
      updatedAt: new Date().toISOString(),
      los: {
        'lo-alpha': {
          thetaHat: 0.5,
          se: 0.8,
          itemsAttempted: 5,
          recentSes: [0.8, 0.75],
          priorMu: 0,
          priorSigma: 0.8,
        },
      },
      items: {
        'lo-alpha-item-1': {
          attempts: 5,
          correct: 3,
          lastAttemptTs: recentTimestamp,
          recentAttempts: [recentTimestamp],
        },
      },
      retention: {},
    };

    const items: ItemLoIndex[] = [
      {
        id: 'lo-alpha-item-1',
        los: ['lo-alpha'],
        difficulty: 0.5,
        thresholds: undefined,
        medianTimeSeconds: 60,
      },
    ];

    const arms = buildThompsonArms({
      learnerState,
      items,
      cooldownHours: 96,
      now,
    });

    const result = scheduleNextLo({
      arms,
      seed: 12345,
    });

    // Should still return a result (falls back to ineligible pool)
    expect(result).toBeDefined();
    expect(result!.loId).toBe('lo-alpha');
  });
});

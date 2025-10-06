import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { performance } from 'perf_hooks';
import { WhyThisNextPill } from '../../components/pills/WhyThisNextPill';

describe('WhyThisNextPill performance', () => {
  it('renders well under 1ms on average', () => {
    const signals = {
      info: 0.42,
      blueprintMult: 1.08,
      exposureMult: 0.91,
      fatigue: 0.88,
      medianSec: 68,
      thetaHat: 0.24,
      se: 0.28,
      masteryProb: 0.79,
      loIds: ['lo.ulnar-nerve'],
      itemId: 'item.ulnar.claw-hand'
    } as const;

    const iterations = 200;
    const start = performance.now();
    for (let i = 0; i < iterations; i += 1) {
      renderToString(<WhyThisNextPill signals={{ ...signals }} />);
    }
    const avgMs = (performance.now() - start) / iterations;
    expect(avgMs).toBeLessThan(1);
  });
});

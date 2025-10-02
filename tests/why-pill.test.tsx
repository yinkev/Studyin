import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { WhyThisNextPill } from '../components/pills/WhyThisNextPill';

describe('WhyThisNextPill', () => {
  it('renders compact numeric chips deterministically', () => {
    const html = renderToString(
      <WhyThisNextPill
        signals={{
          info: 0.37,
          blueprintMult: 1.1,
          exposureMult: 0.85,
          fatigue: 0.90,
          medianSec: 75,
          thetaHat: 0.12,
          se: 0.30,
          masteryProb: 0.72,
          loIds: ['lo.ulnar-nerve'],
          itemId: 'item.ulnar.claw-hand'
        }}
        title={'TTM: lo.ulnar-nerve: 1.72m (overdue)'}
      />
    );
    expect(html).toContain('Info');
    expect(html).toContain('0.37');
    expect(html).toContain('Blueprint×');
    expect(html).toContain('1.10');
    expect(html).toContain('Exposure×');
    expect(html).toContain('0.85');
    expect(html).toContain('Median');
    expect(html).toContain('75s');
    expect(html).toContain('θ̂');
    expect(html).toContain('0.12');
    expect(html).toContain('SE');
    expect(html).toContain('0.30');
    expect(html).toContain('Mastery');
    expect(html).toContain('0.72');
    expect(html).toContain('TTM: lo.ulnar-nerve: 1.72m (overdue)');
  });
});

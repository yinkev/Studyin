import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { summarize } from '../scripts/analyze.mjs';

const baseAttempt = {
  schema_version: '1.0.0',
  app_version: '1.0.0',
  session_id: 'session-1',
  user_id: 'user-1',
  mode: 'learn',
  opened_evidence: true,
  choice: 'A'
};

describe('analytics summarize', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('produces item recommendations with mastery deficit reasons', () => {
    const dayMs = 1000 * 60 * 60 * 24;
    const attempts = [
      {
        ...baseAttempt,
        item_id: 'item-alpha',
        lo_ids: ['lo.alpha'],
        ts_start: Date.now() - dayMs * 2 - 60000,
        ts_submit: Date.now() - dayMs * 2,
        duration_ms: 60000,
        correct: false
      },
      {
        ...baseAttempt,
        item_id: 'item-alpha',
        lo_ids: ['lo.alpha'],
        ts_start: Date.now() - dayMs - 60000,
        ts_submit: Date.now() - dayMs,
        duration_ms: 60000,
        correct: true
      }
    ];

    const summary = summarize(attempts);
    expect(summary.has_events).toBe(true);
    const ttm = summary.ttm_per_lo.find((entry) => entry.lo_id === 'lo.alpha');
    expect(ttm).toBeDefined();
    expect(ttm?.projected_minutes_to_mastery).toBeGreaterThan(0);

    const recommendation = summary.item_recommendations.find((entry) => entry.item_id === 'item-alpha');
    expect(recommendation).toBeDefined();
    expect(recommendation?.reason_type).toBe('mastery_deficit');
    expect(recommendation?.reason).toContain('lo.alpha');
    expect(recommendation?.projected_minutes_to_mastery).toBeCloseTo(ttm?.projected_minutes_to_mastery ?? 0, 5);
    expect(recommendation?.score ?? 0).toBeGreaterThan(0);
  });

  it('flags spacing recency when attempts are stale', () => {
    const dayMs = 1000 * 60 * 60 * 24;
    const attempts = [
      {
        ...baseAttempt,
        item_id: 'item-beta',
        lo_ids: ['lo.beta'],
        ts_start: Date.now() - dayMs * 5 - 45000,
        ts_submit: Date.now() - dayMs * 5,
        duration_ms: 45000,
        correct: true
      }
    ];

    const summary = summarize(attempts);
    const recommendation = summary.item_recommendations.find((entry) => entry.item_id === 'item-beta');
    expect(recommendation).toBeDefined();
    expect(recommendation?.reason_type).toBe('spacing');
    expect(recommendation?.reason).toContain('Spacing overdue');
    expect(recommendation?.overdue_lo_ids).toEqual(['lo.beta']);
  });
});

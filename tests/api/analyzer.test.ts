import { describe, expect, it } from 'vitest';
import { summarizeAttempts } from '../../scripts/lib/analyzer-core.mjs';

const sampleAttempts = [
  {
    schema_version: '1.0.0',
    app_version: '0.1.0',
    session_id: 'sess-1',
    user_id: 'learner-1',
    item_id: 'item.shoulder.anterior-dislocation',
    lo_ids: ['lo.shoulder-pathology', 'lo.vascular'],
    ts_start: 1,
    ts_submit: 61,
    duration_ms: 60000,
    mode: 'learn',
    choice: 'B',
    correct: true,
    opened_evidence: true
  },
  {
    schema_version: '1.0.0',
    app_version: '0.1.0',
    session_id: 'sess-2',
    user_id: 'learner-2',
    item_id: 'item.ulnar.claw-hand',
    lo_ids: ['lo.ulnar-nerve'],
    ts_start: 2,
    ts_submit: 47,
    duration_ms: 45000,
    mode: 'learn',
    choice: 'C',
    correct: false,
    opened_evidence: false
  },
  {
    schema_version: '1.0.0',
    app_version: '0.1.0',
    session_id: 'sess-3',
    user_id: 'learner-1',
    item_id: 'item.shoulder.anterior-dislocation',
    lo_ids: ['lo.shoulder-pathology'],
    ts_start: 3,
    ts_submit: 63,
    duration_ms: 20000,
    mode: 'spotter',
    choice: 'B',
    correct: false,
    opened_evidence: false
  }
];

describe('summarizeAttempts', () => {
  it('produces deterministic summary metrics', () => {
    const summary = summarizeAttempts(sampleAttempts, 1000);
    expect(summary.has_events).toBe(true);
    expect(summary.totals.attempts).toBe(3);
    expect(summary.speed_accuracy.fast_wrong).toBe(2);
    expect(summary.confusion_edges).toHaveLength(2);
    expect(summary.ttm_per_lo.length).toBeGreaterThan(0);
    expect(summary.reliability.kr20).toBeDefined();
    expect(summary.reliability.item_point_biserial[0]).toHaveProperty('point_biserial');
    expect(summary.retention_summary?.total_reviews).toBe(1);
    expect(summary.retention_summary?.incorrect).toBe(1);
  });

  it('returns empty summary when no attempts', () => {
    const summary = summarizeAttempts([], 1000);
    expect(summary.has_events).toBe(false);
    expect(summary.totals.attempts).toBe(0);
  });
});

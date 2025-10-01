import { describe, it, expect } from 'vitest';
import { computeStudyDashboards } from '../lib/study-insights';

const now = 1_700_000_000_000;

describe('computeStudyDashboards', () => {
  it('produces priority, stalled, and overexposed lists', () => {
    const learnerState = {
      learnerId: 'demo',
      updatedAt: new Date(now).toISOString(),
      los: {},
      items: {
        'item.a': {
          attempts: 6,
          correct: 4,
          lastAttemptTs: now - 2 * 60 * 60 * 1000,
          recentAttempts: [
            now - 2 * 60 * 60 * 1000,
            now - 23 * 60 * 60 * 1000,
            now - 25 * 60 * 60 * 1000,
            now - 26 * 60 * 60 * 1000
          ]
        },
        'item.b': {
          attempts: 2,
          correct: 2,
          lastAttemptTs: now - 5 * 24 * 60 * 60 * 1000,
          recentAttempts: [now - 5 * 24 * 60 * 60 * 1000]
        }
      },
      retention: {}
    };

    const analytics = {
      schema_version: '1.1.0',
      generated_at: new Date(now).toISOString(),
      has_events: true,
      totals: { attempts: 10, learners: 1 },
      ttm_per_lo: [
        {
          lo_id: 'lo.alpha',
          attempts: 6,
          current_accuracy: 0.45,
          projected_minutes_to_mastery: 3.5,
          overdue: true
        }
      ],
      elg_per_min: [
        {
          item_id: 'item.a',
          lo_ids: ['lo.alpha'],
          projected_mastery_gain: 0.2,
          estimated_minutes: 1.4,
          reason: 'Mastery deficit'
        }
      ],
      confusion_edges: [],
      speed_accuracy: { fast_wrong: 0, slow_wrong: 0, fast_right: 0, slow_right: 0 },
      nfd_summary: [],
      reliability: { kr20: null, item_point_biserial: [] }
    } satisfies Parameters<typeof computeStudyDashboards>[1];

    const dashboards = computeStudyDashboards(learnerState as any, analytics, now);

    expect(dashboards.priorityLos[0].loId).toBe('lo.alpha');
    expect(dashboards.stalledLos).toHaveLength(1);
    expect(dashboards.overexposedItems[0].itemId).toBe('item.a');
  });
});

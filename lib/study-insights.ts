import type { AnalyticsSummary } from './getAnalytics';
import type { LearnerState } from './server/study-state';

export interface StudyDashboards {
  priorityLos: Array<{
    loId: string;
    projectedMinutes: number;
    attempts: number;
    overdue: boolean;
  }>;
  stalledLos: Array<{
    loId: string;
    attempts: number;
    accuracy: number;
  }>;
  overexposedItems: Array<{
    itemId: string;
    attempts24h: number;
    attempts7d: number;
    lastAttemptHoursAgo: number;
  }>;
}

const PRIORITY_LIMIT = 5;
const STALLED_ATTEMPTS_THRESHOLD = 5;
const STALLED_ACCURACY_THRESHOLD = 0.5;
const OVEREXPOSE_ATTEMPTS24H = 1;
const OVEREXPOSE_ATTEMPTS7D = 3;

export function computeStudyDashboards(
  learnerState: LearnerState,
  analytics: AnalyticsSummary | null,
  now: number = Date.now()
): StudyDashboards {
  const priorityLos = (analytics?.ttm_per_lo ?? [])
    .map((entry) => ({
      loId: entry.lo_id,
      projectedMinutes: entry.projected_minutes_to_mastery ?? 0,
      attempts: entry.attempts ?? 0,
      overdue: Boolean(entry.overdue)
    }))
    .filter((entry) => entry.projectedMinutes > 0)
    .sort((a, b) => b.projectedMinutes - a.projectedMinutes)
    .slice(0, PRIORITY_LIMIT);

  const stalledLos = priorityLos
    .filter((entry) => entry.attempts >= STALLED_ATTEMPTS_THRESHOLD)
    .map((entry) => {
      const loState = learnerState.los[entry.loId];
      const accuracy = analytics?.ttm_per_lo?.find((row) => row.lo_id === entry.loId)?.current_accuracy ?? 0;
      return {
        loId: entry.loId,
        attempts: entry.attempts,
        accuracy: Number(accuracy.toFixed(2))
      };
    })
    .filter((entry) => entry.accuracy <= STALLED_ACCURACY_THRESHOLD)
    .slice(0, PRIORITY_LIMIT);

  const overexposedItems = Object.entries(learnerState.items)
    .map(([itemId, stats]) => {
      const recent = stats.recentAttempts ?? [];
      const attempts24h = recent.filter((ts) => now - ts <= 24 * 60 * 60 * 1000).length;
      const attempts7d = recent.filter((ts) => now - ts <= 7 * 24 * 60 * 60 * 1000).length;
      const lastAttemptTs = stats.lastAttemptTs ?? 0;
      const lastAttemptHoursAgo = lastAttemptTs ? (now - lastAttemptTs) / (1000 * 60 * 60) : Number.POSITIVE_INFINITY;
      return {
        itemId,
        attempts24h,
        attempts7d,
        lastAttemptHoursAgo
      };
    })
    .filter(
      (entry) =>
        entry.attempts24h > OVEREXPOSE_ATTEMPTS24H ||
        entry.attempts7d > OVEREXPOSE_ATTEMPTS7D
    )
    .sort((a, b) => b.attempts7d - a.attempts7d)
    .slice(0, PRIORITY_LIMIT)
    .map((entry) => ({
      ...entry,
      lastAttemptHoursAgo: Number(entry.lastAttemptHoursAgo.toFixed(1))
    }));

  return {
    priorityLos,
    stalledLos,
    overexposedItems
  };
}

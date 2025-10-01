import { loadAnalyticsSummary } from '../../lib/getAnalytics';
import { loadStudyItems } from '../../lib/getItems';
import { loadLessons } from '../../lib/getLessons';
import { StudyTabs } from '../../components/StudyTabs';
import { loadLearnerState } from '../../lib/server/study-state';
import blueprint from '../../config/blueprint.json';
import { buildThompsonArms, scheduleNextLo, computeRetentionBudget } from '../../lib/study-engine';
import { computeStudyDashboards } from '../../lib/study-insights';

const DEFAULT_LEARNER_ID = process.env.NEXT_PUBLIC_LEARNER_ID ?? 'demo-learner';

export default async function StudyPage() {
  const learnerId = DEFAULT_LEARNER_ID;
  const [items, analytics, lessons] = await Promise.all([
    loadStudyItems(),
    loadAnalyticsSummary(),
    loadLessons()
  ]);
  const learnerState = await loadLearnerState(learnerId);
  const now = Date.now();

  const arms = buildThompsonArms({
    learnerState,
    analytics: analytics ?? undefined,
    blueprint,
    items: items.map((item) => ({ id: item.id, los: item.los })),
    now
  });
  const nextLo = scheduleNextLo({ arms });

  const maxDaysOverdue = (() => {
    const diffs = Object.values(learnerState.items)
      .map((item) => (item.lastAttemptTs ? (now - item.lastAttemptTs) / (1000 * 60 * 60 * 24) : 0))
      .filter((value) => Number.isFinite(value));
    if (!diffs.length) return 0;
    return Math.max(...diffs);
  })();
  const retention = computeRetentionBudget({ maxDaysOverdue, sessionMinutes: 50 });
  const dashboards = computeStudyDashboards(learnerState, analytics, now);

  return (
    <StudyTabs
      items={items}
      lessons={lessons}
      analytics={analytics}
      learnerId={learnerId}
      initialLearnerState={learnerState}
      schedulerArms={arms}
      recommendedLoId={nextLo?.loId ?? null}
      retentionInfo={{ minutes: retention.minutes, fraction: retention.fraction, maxDaysOverdue }}
      dashboards={dashboards}
    />
  );
}

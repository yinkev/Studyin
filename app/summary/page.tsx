import { promises as fs } from 'fs';
import path from 'path';
import { loadAnalyticsSummary } from '../../lib/getAnalytics';
// ECharts cards removed - using Canvas/D3 alternatives
// import { TTMCard } from '../../components/okc/charts/TTMCard';
// import { SpeedAccuracyCard } from '../../components/okc/charts/SpeedAccuracyCard';
// import { ConfusionBarCard } from '../../components/okc/charts/ConfusionBarCard';
import { ConfusionForce } from '../../components/charts/ConfusionForce';
import { BlueprintDriftChart } from '../../components/charts/BlueprintDriftChart';
import { TTMBarCanvas } from '../../components/canvas/TTMBarCanvas';
import { Card } from '@mantine/core';
import { ConfusionGraph } from '../../components/graphs/ConfusionGraph';
import { BlueprintFlow } from '../../components/graphs/BlueprintFlow';
import { SessionFlow } from '../../components/graphs/SessionFlow';
import { getSupabaseAdmin } from '../../lib/server/supabase';
import { computeStudyDashboards } from '../../lib/study-insights';
import { loadLearnerState } from '../../lib/server/study-state';
import { SummaryDashboards } from '../../components/SummaryDashboards';
import { InsightsView } from '../../components/InsightsView';

type AttemptRow = {
  session_id: string | null;
  item_id: string | null;
  correct: boolean | null;
  ts_submit: number | string | null;
};

async function readJsonIfExists<T = any>(p: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function loadRecentAttempts(limit = 25) {
  const client = await getSupabaseAdmin();
  if (!client) return [];
  const { data } = await client
    .from('attempts')
    .select('session_id,item_id,correct,ts_submit')
    .order('ts_submit', { ascending: false })
    .limit(limit);
  const rows: AttemptRow[] = Array.isArray(data) ? (data as AttemptRow[]) : [];
  return rows.map((row) => ({
    session_id: row.session_id ?? '',
    item_id: row.item_id ?? '',
    correct: Boolean(row.correct),
    ts_submit: Number(row.ts_submit ?? 0)
  }));
}

export default async function SummaryPage() {
  const analytics = await loadAnalyticsSummary();
  const learnerState = await loadLearnerState('demo-learner');
  const dashboards = computeStudyDashboards(learnerState, analytics);
  const root = process.cwd();
  const blueprintPath = path.join(root, 'config', 'blueprint.json');
  const rubricPath = path.join(root, 'public', 'analytics', 'rubric-score.json');
  const blueprint = await readJsonIfExists<{ weights: Record<string, number> }>(blueprintPath);
  const rubric = await readJsonIfExists<{ overall_score: number; overall_pass: boolean; critical_ok: boolean; threshold: number }>(rubricPath);
  const attempts = await loadRecentAttempts();
  const masteryScores = analytics?.mastery_per_lo
    ? Object.entries(analytics.mastery_per_lo).map(([lo_id, score]) => ({ lo_id, score }))
    : [];
  return (
      <section className="space-y-8 text-text-high min-h-screen px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-med">Operational analytics</p>
          <h1 className="text-3xl font-semibold text-text-high">Summary</h1>
        </div>
        {rubric && (
          <div className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide ${rubric.overall_pass ? 'border-semantic-success/40 text-semantic-success' : 'border-semantic-warning/40 text-semantic-warning'}`}>
            Rubric {rubric.overall_score.toFixed(1)} / {rubric.threshold}
          </div>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-clinical-card h-full">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Release readiness</div>
          <div className="space-y-4 text-sm">
            {rubric ? (
              <div className="flex items-center justify-between">
                <span>Rubric score</span>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold uppercase tracking-wide ${rubric.overall_pass ? 'bg-semantic-success/20 text-semantic-success' : 'bg-semantic-warning/20 text-semantic-warning'}`}>
                  {rubric.overall_score.toFixed(1)} / {rubric.threshold}
                </span>
              </div>
            ) : (
              <p className="text-text-med">
                Run <code className="text-text-high/90">npm run score:rubric</code> to generate a score snapshot.
              </p>
            )}
            <p className="text-xs text-text-med">Critical gates must stay green — rerun rubric scoring before every release.</p>
          </div>
        </div>
        <div className="glass-clinical-card">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Retention throughput</div>
          <div className="space-y-2 text-sm">
            {analytics?.retention_summary ? (
              <>
                <div className="flex items-center justify-between">
                  <span>Total reviews</span>
                  <span>{analytics.retention_summary.total_reviews}</span>
                </div>
                <div className="flex items-center justify-between text-semantic-success">
                  <span>Correct</span>
                  <span>{analytics.retention_summary.correct}</span>
                </div>
                <div className="flex items-center justify-between text-semantic-danger">
                  <span>Incorrect</span>
                  <span>{analytics.retention_summary.incorrect}</span>
                </div>
                <div className="flex items-center justify-between text-text-med">
                  <span>Success rate</span>
                  <span>{(analytics.retention_summary.success_rate * 100).toFixed(0)}%</span>
                </div>
              </>
            ) : (
              <p className="text-text-med">
                No retention reviews logged yet. Run the study flow with FSRS queue to populate analytics.
              </p>
            )}
          </div>
        </div>
        <div className="glass-clinical-card h-full">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Blueprint drift</div>
          <div>
            <BlueprintDriftChart analytics={analytics} weights={blueprint?.weights ?? {}} />
          </div>
        </div>
        <div className="glass-clinical-card">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Mastery · TTM (Canvas)</div>
          <div>
            <TTMBarCanvas analytics={analytics} height={320} />
          </div>
        </div>
        {/* ECharts charts removed - TODO: Replace with D3/Recharts alternatives */}
        {/* <Card padding="lg">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Speed vs accuracy</div>
          <div>Speed/Accuracy chart placeholder</div>
        </Card>
        <Card padding="lg">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Confusion hotspots</div>
          <div>Confusion chart placeholder</div>
        </Card> */}
        <div className="glass-clinical-card">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Evidence efficacy</div>
          <div>
            <ConfusionForce analytics={analytics} />
          </div>
        </div>
        <div className="glass-clinical-card">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">TTM canvas</div>
          <div>
            <TTMBarCanvas analytics={analytics} />
          </div>
        </div>
        <div className="glass-clinical-card col-span-full">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Adaptive dashboards</div>
          <div>
            <SummaryDashboards dashboards={dashboards} />
          </div>
        </div>
        <div className="glass-clinical-card col-span-full">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Mastery insights</div>
          <div>
            <InsightsView masteryScores={masteryScores} />
          </div>
        </div>
        <div className="glass-clinical-card col-span-full">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Confusion graph</div>
          <div>
            <ConfusionGraph analytics={analytics} />
          </div>
        </div>
        <div className="glass-clinical-card col-span-full">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Blueprint flow</div>
          <div>
            <BlueprintFlow analytics={analytics} weights={blueprint?.weights ?? {}} />
          </div>
        </div>
        <div className="glass-clinical-card col-span-full">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Recent session traces</div>
          <div>
            <SessionFlow attempts={attempts} />
          </div>
        </div>
      </div>
    </section>
  );
}

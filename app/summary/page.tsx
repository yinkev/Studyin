import { promises as fs } from 'fs';
import path from 'path';
import { loadAnalyticsSummary } from '../../lib/getAnalytics';
import { TTMCard } from '../../components/okc/charts/TTMCard';
import { SpeedAccuracyCard } from '../../components/okc/charts/SpeedAccuracyCard';
import { ConfusionBarCard } from '../../components/okc/charts/ConfusionBarCard';
import { ConfusionForce } from '../../components/charts/ConfusionForce';
import { BlueprintDriftChart } from '../../components/charts/BlueprintDriftChart';
import { TTMBarCanvas } from '../../components/canvas/TTMBarCanvas';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { ConfusionGraph } from '../../components/graphs/ConfusionGraph';
import { BlueprintFlow } from '../../components/graphs/BlueprintFlow';
import { SessionFlow } from '../../components/graphs/SessionFlow';
import { getSupabaseAdmin } from '../../lib/server/supabase';
import { computeStudyDashboards } from '../../lib/study-insights';
import { loadLearnerState } from '../../lib/server/study-state';
import { SummaryDashboards } from '../../components/SummaryDashboards';

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
  return (
    <section className="space-y-8 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Operational analytics</p>
          <h1 className="text-3xl font-semibold text-white">Summary</h1>
        </div>
        {rubric && (
          <div className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide ${rubric.overall_pass ? 'border-emerald-400/40 text-emerald-200' : 'border-amber-400/40 text-amber-200'}`}>
            Rubric {rubric.overall_score.toFixed(1)} / {rubric.threshold}
          </div>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader>Release readiness</CardHeader>
          <CardContent className="space-y-4 text-sm">
            {rubric ? (
              <div className="flex items-center justify-between">
                <span>Rubric score</span>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold uppercase tracking-wide ${rubric.overall_pass ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'}`}>
                  {rubric.overall_score.toFixed(1)} / {rubric.threshold}
                </span>
              </div>
            ) : (
              <p className="text-slate-300">
                Run <code className="text-white/90">npm run score:rubric</code> to generate a score snapshot.
              </p>
            )}
            <p className="text-xs text-slate-400">Critical gates must stay green — rerun rubric scoring before every release.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Retention throughput</CardHeader>
          <CardContent className="space-y-2 text-sm">
            {analytics?.retention_summary ? (
              <>
                <div className="flex items-center justify-between">
                  <span>Total reviews</span>
                  <span>{analytics.retention_summary.total_reviews}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-200">
                  <span>Correct</span>
                  <span>{analytics.retention_summary.correct}</span>
                </div>
                <div className="flex items-center justify-between text-rose-200">
                  <span>Incorrect</span>
                  <span>{analytics.retention_summary.incorrect}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Success rate</span>
                  <span>{(analytics.retention_summary.success_rate * 100).toFixed(0)}%</span>
                </div>
              </>
            ) : (
              <p className="text-slate-400">
                No retention reviews logged yet. Run the study flow with FSRS queue to populate analytics.
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader>Blueprint drift</CardHeader>
          <CardContent>
            <BlueprintDriftChart analytics={analytics} weights={blueprint?.weights ?? {}} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Mastery · TTM</CardHeader>
          <CardContent>
            <TTMCard analytics={analytics} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Speed vs accuracy</CardHeader>
          <CardContent>
            <SpeedAccuracyCard analytics={analytics} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Confusion hotspots</CardHeader>
          <CardContent>
            <ConfusionBarCard analytics={analytics} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Evidence efficacy</CardHeader>
          <CardContent>
            <ConfusionForce analytics={analytics} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>TTM canvas</CardHeader>
          <CardContent>
            <TTMBarCanvas analytics={analytics} />
          </CardContent>
        </Card>
        <Card className="col-span-full">
          <CardHeader>Adaptive dashboards</CardHeader>
          <CardContent>
            <SummaryDashboards dashboards={dashboards} />
          </CardContent>
        </Card>
        <Card className="col-span-full">
          <CardHeader>Confusion graph</CardHeader>
          <CardContent>
            <ConfusionGraph analytics={analytics} />
          </CardContent>
        </Card>
        <Card className="col-span-full">
          <CardHeader>Blueprint flow</CardHeader>
          <CardContent>
            <BlueprintFlow analytics={analytics} weights={blueprint?.weights ?? {}} />
          </CardContent>
        </Card>
        <Card className="col-span-full">
          <CardHeader>Recent session traces</CardHeader>
          <CardContent>
            <SessionFlow attempts={attempts} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

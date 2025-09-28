import { promises as fs } from 'fs';
import path from 'path';
import { loadAnalyticsSummary } from '../../lib/getAnalytics';
import { TTMBarChart } from '../../components/charts/TTMBarChart';
import { SpeedAccuracyChart } from '../../components/charts/SpeedAccuracyChart';
import { ConfusionBar } from '../../components/charts/ConfusionBar';
import { ConfusionForce } from '../../components/charts/ConfusionForce';
import { BlueprintDriftChart } from '../../components/charts/BlueprintDriftChart';
import { TTMBarCanvas } from '../../components/canvas/TTMBarCanvas';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { ConfusionGraph } from '../../components/graphs/ConfusionGraph';
import { BlueprintFlow } from '../../components/graphs/BlueprintFlow';
import { SessionFlow } from '../../components/graphs/SessionFlow';
import { getSupabaseAdmin } from '../../lib/server/supabase';

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
  return (
    data?.map((row) => ({
      session_id: row.session_id,
      item_id: row.item_id,
      correct: Boolean(row.correct),
      ts_submit: Number(row.ts_submit ?? 0)
    })) ?? []
  );
}

export default async function SummaryPage() {
  const analytics = await loadAnalyticsSummary();
  const root = process.cwd();
  const blueprintPath = path.join(root, 'config', 'blueprint.json');
  const rubricPath = path.join(root, 'public', 'analytics', 'rubric-score.json');
  const blueprint = await readJsonIfExists<{ weights: Record<string, number> }>(blueprintPath);
  const rubric = await readJsonIfExists<{ overall_score: number; overall_pass: boolean; critical_ok: boolean; threshold: number }>(rubricPath);
  const attempts = await loadRecentAttempts();
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Summary</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader className="text-sm font-semibold text-slate-900">Release readiness</CardHeader>
          <CardContent className="space-y-4 text-sm">
            {rubric ? (
              <div className="flex items-center justify-between">
                <span>Rubric score</span>
                <span className={`rounded px-3 py-1 text-sm font-semibold ${rubric.overall_pass ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {rubric.overall_score.toFixed(1)} / {rubric.threshold}
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground">Run <code>npm run score:rubric</code> to generate a score.</p>
            )}
            <p className="text-xs text-muted-foreground">Critical gates must stay green — rerun rubric scoring before each release.</p>
          </CardContent>
        </Card>
        <BlueprintDriftChart analytics={analytics} weights={blueprint?.weights ?? {}} />
        <TTMBarChart analytics={analytics} />
        <SpeedAccuracyChart analytics={analytics} />
        <ConfusionBar analytics={analytics} />
        <ConfusionForce analytics={analytics} />
        <TTMBarCanvas analytics={analytics} />
        <Card className="col-span-full">
          <CardHeader className="text-sm font-semibold text-slate-900">Confusion graph</CardHeader>
          <CardContent>
            <ConfusionGraph analytics={analytics} />
          </CardContent>
        </Card>
        <Card className="col-span-full">
          <CardHeader className="text-sm font-semibold text-slate-900">Blueprint flow</CardHeader>
          <CardContent>
            <BlueprintFlow analytics={analytics} weights={blueprint?.weights ?? {}} />
          </CardContent>
        </Card>
        <Card className="col-span-full">
          <CardHeader className="text-sm font-semibold text-slate-900">Recent session traces</CardHeader>
          <CardContent>
            <SessionFlow attempts={attempts} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

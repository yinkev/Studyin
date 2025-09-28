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

async function readJsonIfExists<T = any>(p: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default async function SummaryPage() {
  const analytics = await loadAnalyticsSummary();
  const root = process.cwd();
  const blueprintPath = path.join(root, 'config', 'blueprint.json');
  const rubricPath = path.join(root, 'public', 'analytics', 'rubric-score.json');
  const blueprint = await readJsonIfExists<{ weights: Record<string, number> }>(blueprintPath);
  const rubric = await readJsonIfExists<{ overall_score: number; overall_pass: boolean; critical_ok: boolean; threshold: number }>(rubricPath);
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Summary</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="text-sm font-medium">Release readiness</CardHeader>
          <CardContent className="space-y-2 text-sm">
            {rubric ? (
              <div className="flex items-center justify-between">
                <span>Rubric score</span>
                <span className={`rounded px-2 py-1 font-semibold ${rubric.overall_pass ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {rubric.overall_score.toFixed(1)} / {rubric.threshold}
                </span>
              </div>
            ) : (
              <p className="text-slate-500">Run <code>npm run score:rubric</code> to generate a score.</p>
            )}
          </CardContent>
        </Card>
        <TTMBarChart analytics={analytics} />
        <SpeedAccuracyChart analytics={analytics} />
        <ConfusionBar analytics={analytics} />
        <ConfusionForce analytics={analytics} />
        <BlueprintDriftChart analytics={analytics} weights={blueprint?.weights ?? {}} />
        <TTMBarCanvas analytics={analytics} />
      </div>
    </section>
  );
}

/**
 * Summary Page - Material Design 3 Edition
 * Analytics dashboard using official MD3 design tokens
 */

import { promises as fs } from 'fs';
import path from 'path';
import { loadAnalyticsSummary } from '../../lib/getAnalytics';
import { ConfusionForce } from '../../components/charts/ConfusionForce';
import { BlueprintDriftChart } from '../../components/charts/BlueprintDriftChart';
import { TTMBarCanvas } from '../../components/canvas/TTMBarCanvas';
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
    <section style={{
      minHeight: '100vh',
      padding: '2rem 1.5rem',
      backgroundColor: 'var(--md-sys-color-surface)',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div>
          <p className="md3-label-small" style={{
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--md-sys-color-on-surface-variant)',
            marginBottom: '0.5rem'
          }}>
            Operational analytics
          </p>
          <h1 className="md3-display-small" style={{
            color: 'var(--md-sys-color-on-surface)',
            fontWeight: 600
          }}>
            Summary
          </h1>
        </div>
        {rubric && (
          <div style={{
            borderRadius: 'var(--md-sys-shape-corner-full)',
            border: `2px solid ${rubric.overall_pass ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-error)'}`,
            padding: '0.5rem 1rem',
            color: rubric.overall_pass ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-error)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.75rem'
          }}>
            Rubric {rubric.overall_score.toFixed(1)} / {rubric.threshold}
          </div>
        )}
      </div>

      {/* Analytics Grid */}
      <div style={{
        display: 'grid',
        gap: '1.5rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
      }} className="lg:grid-cols-2">
        {/* Release Readiness Card */}
        <div className="md3-surface-container md3-elevation-1 md3-shape-large md3-card" style={{ padding: '1.5rem', height: '100%' }}>
          <div className="md3-label-large" style={{
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
            marginBottom: '1rem',
            fontWeight: 600,
            color: 'var(--md-sys-color-on-surface)'
          }}>
            Release readiness
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="md3-body-medium">
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
        <div className="md3-surface-container md3-elevation-1 md3-shape-large md3-card">
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
        <div className="md3-surface-container md3-elevation-1 md3-shape-large md3-card h-full">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Blueprint drift</div>
          <div>
            <BlueprintDriftChart analytics={analytics} weights={blueprint?.weights ?? {}} />
          </div>
        </div>
        <div className="md3-surface-container md3-elevation-1 md3-shape-large md3-card">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Mastery · TTM (Canvas)</div>
          <div>
            <TTMBarCanvas analytics={analytics} height={320} />
          </div>
        </div>
        {/* Legacy ECharts cards removed; consider D3/Recharts replacements in a follow-up */}
        <div className="md3-surface-container md3-elevation-1 md3-shape-large md3-card">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Evidence efficacy</div>
          <div>
            <ConfusionForce analytics={analytics} />
          </div>
        </div>
        <div className="md3-surface-container md3-elevation-1 md3-shape-large md3-card">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">TTM canvas</div>
          <div>
            <TTMBarCanvas analytics={analytics} />
          </div>
        </div>
        <div className="md3-surface-container md3-elevation-1 md3-shape-large md3-card col-span-full">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Adaptive dashboards</div>
          <div>
            <SummaryDashboards dashboards={dashboards} />
          </div>
        </div>
        <div className="md3-surface-container md3-elevation-1 md3-shape-large md3-card col-span-full">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Mastery insights</div>
          <div>
            <InsightsView masteryScores={masteryScores} />
          </div>
        </div>
        <div className="md3-surface-container md3-elevation-1 md3-shape-large md3-card col-span-full">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Confusion graph</div>
          <div>
            <ConfusionGraph analytics={analytics} />
          </div>
        </div>
        <div className="md3-surface-container md3-elevation-1 md3-shape-large md3-card col-span-full">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Blueprint flow</div>
          <div>
            <BlueprintFlow analytics={analytics} weights={blueprint?.weights ?? {}} />
          </div>
        </div>
        <div className="md3-surface-container md3-elevation-1 md3-shape-large md3-card col-span-full">
          <div className="pb-4 border-b border-border-subtle mb-4 text-sm font-semibold text-text-high">Recent session traces</div>
          <div>
            <SessionFlow attempts={attempts} />
          </div>
        </div>
      </div>
    </section>
  );
}

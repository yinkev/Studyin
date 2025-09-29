'use client';

import type { AnalyticsSummary } from '../../../lib/getAnalytics';
import { EChartsTTM } from '../charts/EChartsTTM';
import { EChartsSpeedAccuracy } from '../charts/EChartsSpeedAccuracy';
import { EChartsConfusionBar } from '../charts/EChartsConfusionBar';

export function OKCAnalytics({
  analytics,
  rubric
}: {
  analytics: AnalyticsSummary | null;
  rubric: { overall_score: number; overall_pass: boolean; threshold: number } | null;
}) {
  return (
    <section className="okc-section px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="okc-pill-ghost">Operational analytics</p>
            <h1 className="mt-2 text-3xl font-extrabold text-gray-900">Summary</h1>
          </div>
          {rubric && (
            <div className={`okc-pill ${rubric.overall_pass ? 'border-emerald-300' : 'border-amber-300'}`}>
              Rubric {rubric.overall_score.toFixed(1)} / {rubric.threshold}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="duo-card okc-shadow p-4">
            <h3 className="text-lg font-bold mb-2">Mastery · TTM</h3>
            <EChartsTTM analytics={analytics} height={240} />
          </div>
          <div className="duo-card okc-shadow p-4">
            <h3 className="text-lg font-bold mb-2">Speed vs accuracy</h3>
            <EChartsSpeedAccuracy analytics={analytics} height={240} />
          </div>
          <div className="duo-card okc-shadow p-4">
            <h3 className="text-lg font-bold mb-2">Confusion hotspots</h3>
            <EChartsConfusionBar analytics={analytics} height={240} />
          </div>
        </div>

        <div className="duo-card okc-shadow p-6">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="okc-pill">Attempts: {analytics?.totals.attempts ?? 0}</span>
            <span className="okc-pill-ghost">Learners: {analytics?.totals.learners ?? 0}</span>
            <span className="okc-pill-ghost">NFD items: {(analytics?.nfd_summary ?? []).length}</span>
          </div>
          <p className="mt-3" style={{ color: '#4B4B4B' }}>
            Charts above derive from deterministic analytics in <code>public/analytics/latest.json</code>. No runtime AI.
          </p>
        </div>
      </div>
    </section>
  );
}


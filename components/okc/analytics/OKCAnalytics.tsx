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
  const reliability = analytics?.reliability;
  const topLowPb = reliability?.item_point_biserial
    ?.filter((entry) => typeof entry.point_biserial === 'number')
    .sort((a, b) => (a.point_biserial ?? 0) - (b.point_biserial ?? 0))
    .slice(0, 5);

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

        <div className="duo-card okc-shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Reliability snapshot</h3>
            <span className="okc-pill-ghost">
              KR-20: {reliability?.kr20 != null ? reliability.kr20.toFixed(3) : 'n/a'}
            </span>
          </div>
          {topLowPb && topLowPb.length ? (
            <ul className="space-y-2 text-sm text-gray-700">
              {topLowPb.map((entry) => (
                <li key={entry.item_id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{entry.item_id}</span>
                    <span className="text-xs text-gray-500">Attempts {entry.attempts}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Point biserial {entry.point_biserial?.toFixed(3) ?? 'n/a'} · p-value {entry.p_value.toFixed(3)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">Collect more attempts to compute point-biserial diagnostics.</p>
          )}
        </div>
      </div>
    </section>
  );
}

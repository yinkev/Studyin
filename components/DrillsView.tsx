'use client';
import type { AnalyticsSummary } from '../lib/getAnalytics';

export function DrillsView({ analytics }: { analytics: AnalyticsSummary | null }) {
  if (!analytics || analytics.elg_per_min.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-200/90">
        No personalized drills yet. Capture more practice attempts.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {analytics.elg_per_min.map((rec) => (
        <div key={rec.item_id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white">{rec.item_id}</h3>
            <span className="text-xs text-slate-300/90">{rec.reason}</span>
          </div>
          <p className="mt-1 text-sm text-slate-200/90">LOs: {rec.lo_ids.join(', ')}</p>
          <p className="text-xs text-slate-400">Δ mastery {rec.projected_mastery_gain.toFixed(2)} in {rec.estimated_minutes.toFixed(2)} min</p>
        </div>
      ))}
    </div>
  );
}

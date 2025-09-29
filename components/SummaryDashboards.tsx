import type { StudyDashboards } from '../lib/study-insights';

interface SummaryDashboardsProps {
  dashboards: StudyDashboards;
}

export function SummaryDashboards({ dashboards }: SummaryDashboardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 text-xs text-slate-200">
      <section className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <header className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-blue-200">Priority LOs</h3>
          <span className="text-slate-400">Top {dashboards.priorityLos.length}</span>
        </header>
        <ul className="space-y-2">
          {dashboards.priorityLos.map((entry) => (
            <li key={entry.loId} className="rounded-lg border border-blue-500/25 bg-white/5 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-200">{entry.loId}</span>
                <span>{entry.projectedMinutes.toFixed(1)} min</span>
              </div>
              <div className="text-slate-400">Attempts {entry.attempts} · {entry.overdue ? 'Overdue' : 'On track'}</div>
            </li>
          ))}
          {dashboards.priorityLos.length === 0 && <li className="text-blue-200">No mastery deficits detected.</li>}
        </ul>
      </section>
      <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <header className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-amber-200">Stalled LOs</h3>
          <span className="text-slate-400">{dashboards.stalledLos.length}</span>
        </header>
        <ul className="space-y-2">
          {dashboards.stalledLos.map((entry) => (
            <li key={entry.loId} className="rounded-lg border border-amber-500/25 bg-white/5 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-200">{entry.loId}</span>
                <span>{(entry.accuracy * 100).toFixed(0)}% accuracy</span>
              </div>
              <div className="text-slate-400">Attempts {entry.attempts}</div>
            </li>
          ))}
          {dashboards.stalledLos.length === 0 && <li className="text-amber-200">No stalled LOs.</li>}
        </ul>
      </section>
      <section className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 md:col-span-2">
        <header className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-rose-200">Overexposed items</h3>
          <span className="text-slate-400">{dashboards.overexposedItems.length}</span>
        </header>
        <ul className="grid gap-2 sm:grid-cols-2">
          {dashboards.overexposedItems.map((entry) => (
            <li key={entry.itemId} className="rounded-lg border border-rose-500/25 bg-white/5 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-rose-200">{entry.itemId}</span>
                <span>{entry.attempts7d} / 7d</span>
              </div>
              <div className="text-slate-400">24h {entry.attempts24h} · last {entry.lastAttemptHoursAgo}h ago</div>
            </li>
          ))}
          {dashboards.overexposedItems.length === 0 && <li className="text-rose-200">No overexposed items.</li>}
        </ul>
      </section>
    </div>
  );
}

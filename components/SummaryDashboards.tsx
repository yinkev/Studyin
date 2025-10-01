import { memo, useMemo } from 'react';
import type { StudyDashboards } from '../lib/study-insights';

interface SummaryDashboardsProps {
  dashboards: StudyDashboards;
}

function PriorityList({ dashboards }: SummaryDashboardsProps) {
  const entries = useMemo(() => dashboards.priorityLos, [dashboards.priorityLos]);
  return (
    <section className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
      <header className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-blue-200">Priority LOs</h3>
        <span className="text-slate-400">Top {entries.length}</span>
      </header>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.loId} className="rounded-lg border border-blue-500/25 bg-white/5 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-200">{entry.loId}</span>
              <span>{entry.projectedMinutes.toFixed(1)} min</span>
            </div>
            <div className="text-slate-400">Attempts {entry.attempts} · {entry.overdue ? 'Overdue' : 'On track'}</div>
          </li>
        ))}
        {entries.length === 0 && <li className="text-blue-200">No mastery deficits detected.</li>}
      </ul>
    </section>
  );
}

function StalledList({ dashboards }: SummaryDashboardsProps) {
  const entries = useMemo(() => dashboards.stalledLos, [dashboards.stalledLos]);
  return (
    <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <header className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-amber-200">Stalled LOs</h3>
        <span className="text-slate-400">{entries.length}</span>
      </header>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.loId} className="rounded-lg border border-amber-500/25 bg-white/5 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-200">{entry.loId}</span>
              <span>{(entry.accuracy * 100).toFixed(0)}% accuracy</span>
            </div>
            <div className="text-slate-400">Attempts {entry.attempts}</div>
          </li>
        ))}
        {entries.length === 0 && <li className="text-amber-200">No stalled LOs.</li>}
      </ul>
    </section>
  );
}

function OverexposedList({ dashboards }: SummaryDashboardsProps) {
  const entries = useMemo(() => dashboards.overexposedItems, [dashboards.overexposedItems]);
  return (
    <section className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 md:col-span-2">
      <header className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-rose-200">Overexposed items</h3>
        <span className="text-slate-400">{entries.length}</span>
      </header>
      <ul className="grid gap-2 sm:grid-cols-2">
        {entries.map((entry) => (
          <li key={entry.itemId} className="rounded-lg border border-rose-500/25 bg-white/5 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-rose-200">{entry.itemId}</span>
              <span>{entry.attempts7d} / 7d</span>
            </div>
            <div className="text-slate-400">24h {entry.attempts24h} · last {entry.lastAttemptHoursAgo}h ago</div>
          </li>
        ))}
        {entries.length === 0 && <li className="text-rose-200">No overexposed items.</li>}
      </ul>
    </section>
  );
}

function SummaryDashboardsComponent({ dashboards }: SummaryDashboardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 text-xs text-slate-200">
      <PriorityList dashboards={dashboards} />
      <StalledList dashboards={dashboards} />
      <OverexposedList dashboards={dashboards} />
    </div>
  );
}

export const SummaryDashboards = memo(SummaryDashboardsComponent);

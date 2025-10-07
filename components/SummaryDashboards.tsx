import { memo, useMemo } from 'react';
import type { StudyDashboards } from '../lib/study-insights';

interface SummaryDashboardsProps {
  dashboards: StudyDashboards;
}

function PriorityList({ dashboards }: SummaryDashboardsProps) {
  const entries = useMemo(() => dashboards.priorityLos, [dashboards.priorityLos]);
  return (
    <section className="rounded-xl border border-semantic-info/20 bg-semantic-info/10 p-4">
      <header className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-semantic-info">Priority LOs</h3>
        <span className="text-text-med">Top {entries.length}</span>
      </header>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.loId} className="rounded-lg border border-semantic-info/25 bg-surface-bg0/60 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-semantic-info">{entry.loId}</span>
              <span>{entry.projectedMinutes.toFixed(1)} min</span>
            </div>
            <div className="text-text-med">Attempts {entry.attempts} · {entry.overdue ? 'Overdue' : 'On track'}</div>
          </li>
        ))}
        {entries.length === 0 && <li className="text-semantic-info">No mastery deficits detected.</li>}
      </ul>
    </section>
  );
}

function StalledList({ dashboards }: SummaryDashboardsProps) {
  const entries = useMemo(() => dashboards.stalledLos, [dashboards.stalledLos]);
  return (
    <section className="rounded-xl border border-semantic-warning/20 bg-semantic-warning/10 p-4">
      <header className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-semantic-warning">Stalled LOs</h3>
        <span className="text-text-med">{entries.length}</span>
      </header>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.loId} className="rounded-lg border border-semantic-warning/25 bg-surface-bg0/60 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-semantic-warning">{entry.loId}</span>
              <span>{(entry.accuracy * 100).toFixed(0)}% accuracy</span>
            </div>
            <div className="text-text-med">Attempts {entry.attempts}</div>
          </li>
        ))}
        {entries.length === 0 && <li className="text-semantic-warning">No stalled LOs.</li>}
      </ul>
    </section>
  );
}

function OverexposedList({ dashboards }: SummaryDashboardsProps) {
  const entries = useMemo(() => dashboards.overexposedItems, [dashboards.overexposedItems]);
  return (
    <section className="rounded-xl border border-semantic-danger/20 bg-semantic-danger/10 p-4 md:col-span-2">
      <header className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-semantic-danger">Overexposed items</h3>
        <span className="text-text-med">{entries.length}</span>
      </header>
      <ul className="grid gap-2 sm:grid-cols-2">
        {entries.map((entry) => (
          <li key={entry.itemId} className="rounded-lg border border-semantic-danger/25 bg-surface-bg0/60 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-semantic-danger">{entry.itemId}</span>
              <span>{entry.attempts7d} / 7d</span>
            </div>
            <div className="text-text-med">24h {entry.attempts24h} · last {entry.lastAttemptHoursAgo}h ago</div>
          </li>
        ))}
        {entries.length === 0 && <li className="text-semantic-danger">No overexposed items.</li>}
      </ul>
    </section>
  );
}

function SummaryDashboardsComponent({ dashboards }: SummaryDashboardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 text-xs text-text-high">
      <PriorityList dashboards={dashboards} />
      <StalledList dashboards={dashboards} />
      <OverexposedList dashboards={dashboards} />
    </div>
  );
}

export const SummaryDashboards = memo(SummaryDashboardsComponent);

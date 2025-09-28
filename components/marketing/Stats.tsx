import type { AnalyticsSummary } from '../../lib/getAnalytics';

export function Stats({ analytics }: { analytics: AnalyticsSummary | null }) {
  const attempts = analytics?.totals.attempts ?? 0;
  const learners = analytics?.totals.learners ?? 0;
  const recs = analytics?.elg_per_min.length ?? 0;
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-5 text-center">
        <p className="text-3xl font-bold text-slate-900">{attempts}</p>
        <p className="text-xs uppercase tracking-wide text-slate-500">Attempts</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 text-center">
        <p className="text-3xl font-bold text-slate-900">{learners}</p>
        <p className="text-xs uppercase tracking-wide text-slate-500">Learners</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 text-center">
        <p className="text-3xl font-bold text-slate-900">{recs}</p>
        <p className="text-xs uppercase tracking-wide text-slate-500">ELG/min Recs</p>
      </div>
    </section>
  );
}


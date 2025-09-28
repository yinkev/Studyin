import type { AnalyticsSummary } from '../../lib/getAnalytics';

export function Stats({ analytics }: { analytics: AnalyticsSummary | null }) {
  const attempts = analytics?.totals.attempts ?? 0;
  const learners = analytics?.totals.learners ?? 0;
  const recs = analytics?.elg_per_min.length ?? 0;
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {[
        { label: 'Attempts', value: attempts, sub: 'Captured in NDJSON or Supabase' },
        { label: 'Learners', value: learners, sub: 'Pseudonymous, schema_version 1.0.0' },
        { label: 'ELG/min recs', value: recs, sub: 'Deterministic recommendations ready' }
      ].map((stat) => (
        <div
          key={stat.label}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-left shadow-xl"
        >
          <div className="absolute inset-0 bg-[radial-gradient(80%_120%_at_0%_0%,rgba(148,163,255,0.25),transparent)]" />
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">{stat.label}</p>
            <p className="mt-3 text-4xl font-semibold text-white">{stat.value}</p>
            <p className="mt-2 text-xs text-slate-300">{stat.sub}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

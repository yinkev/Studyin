import Link from 'next/link';
import { loadAnalyticsSummary } from '../lib/getAnalytics';

export default async function HomePage() {
  const analytics = await loadAnalyticsSummary();

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-500">Studyin</p>
        <h1 className="text-3xl font-semibold text-slate-900">OMS-1 Upper Limb Module</h1>
        <p className="text-slate-600">
          Evidence-first practice with deterministic blueprint, mastery, and analytics. This shell shows live analytics output as we build the Study view next.
        </p>
      </header>

      {!analytics && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800">
          <h2 className="font-semibold">No analytics yet</h2>
          <p className="text-sm">Run <code>npm run analyze</code> to generate <code>public/analytics/latest.json</code>.</p>
        </div>
      )}

      {analytics && (
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Snapshot</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Schema</dt>
                <dd className="font-medium text-slate-800">{analytics.schema_version}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Generated</dt>
                <dd className="font-medium text-slate-800">{new Date(analytics.generated_at).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Attempts</dt>
                <dd className="font-medium text-slate-800">{analytics.totals.attempts}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Learners</dt>
                <dd className="font-medium text-slate-800">{analytics.totals.learners}</dd>
              </div>
            </dl>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Top Recommendations</h2>
            {analytics.elg_per_min.length === 0 ? (
              <p className="text-sm text-slate-500">No personalized drills yet. Capture more attempts to populate ELG/min.</p>
            ) : (
              <ol className="mt-3 space-y-2 text-sm text-slate-700">
                {analytics.elg_per_min.map((item) => (
                  <li key={item.item_id} className="rounded border border-slate-100 bg-slate-50 p-3">
                    <div className="flex justify-between font-medium text-slate-900">
                      <span>{item.item_id}</span>
                      <span>{item.reason}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-slate-500">
                      <span>LOs: {item.lo_ids.join(', ')}</span>
                      <span>Δ mastery {item.projected_mastery_gain.toFixed(2)} in {item.estimated_minutes.toFixed(2)} min</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </article>
        </div>
      )}

      <footer className="text-sm text-slate-500">
        Need roles & SOPs? See <Link href="/docs">AGENTS.md</Link> in the repo. Upcoming work: Study view UI, keyboard flows, evidence viewer.
      </footer>
    </section>
  );
}

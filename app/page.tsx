import { loadAnalyticsSummary } from '../lib/getAnalytics';
import { loadStudyItems } from '../lib/getItems';
import { StudyView } from '../components/StudyView';

export default async function Page() {
  const [items, analytics] = await Promise.all([loadStudyItems(), loadAnalyticsSummary()]);

  return (
    <div className="space-y-8">
      <StudyView items={items} analytics={analytics} />
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Analytics snapshot</h2>
        {analytics ? (
          <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-slate-500">Generated</p>
              <p className="font-medium text-slate-800">{new Date(analytics.generated_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Attempts</p>
              <p className="font-medium text-slate-800">{analytics.totals.attempts}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Learners</p>
              <p className="font-medium text-slate-800">{analytics.totals.learners}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Run <code>npm run analyze</code> to populate analytics.</p>
        )}
      </section>
    </div>
  );
}

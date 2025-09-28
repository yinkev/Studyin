import { loadAnalyticsSummary } from '../../lib/getAnalytics';
import { DrillsView } from '../../components/DrillsView';

export default async function DrillsPage() {
  const analytics = await loadAnalyticsSummary();
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Drills</h1>
      <DrillsView analytics={analytics} />
    </section>
  );
}


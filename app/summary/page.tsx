import { loadAnalyticsSummary } from '../../lib/getAnalytics';
import { TTMBarChart } from '../../components/charts/TTMBarChart';
import { SpeedAccuracyChart } from '../../components/charts/SpeedAccuracyChart';
import { ConfusionBar } from '../../components/charts/ConfusionBar';
import { BlueprintDriftChart } from '../../components/charts/BlueprintDriftChart';

export default async function SummaryPage() {
  const analytics = await loadAnalyticsSummary();
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Summary</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <TTMBarChart analytics={analytics} />
        <SpeedAccuracyChart analytics={analytics} />
        <ConfusionBar analytics={analytics} />
        <BlueprintDriftChart analytics={analytics} />
      </div>
    </section>
  );
}

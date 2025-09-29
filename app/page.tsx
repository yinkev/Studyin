import { loadAnalyticsSummary } from '../lib/getAnalytics';
import { HomeShell } from '../components/okc/HomeShell';

export default async function Page() {
  const analytics = await loadAnalyticsSummary();
  const adapted = analytics ? {
    accuracy_overall: (analytics as any).overall_accuracy ?? (analytics as any).accuracy_overall ?? undefined,
    study_time_hours: (analytics as any).study_time_hours ?? undefined,
    progress_overall: (analytics as any).progress_overall ?? ((analytics as any).progress?.overall ?? undefined)
  } : null;
  return <HomeShell analytics={adapted as any} />;
}

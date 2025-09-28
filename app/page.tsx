import { loadAnalyticsSummary } from '../lib/getAnalytics';
import { Hero } from '../components/marketing/Hero';
import { Features } from '../components/marketing/Features';
import { Stats } from '../components/marketing/Stats';

export default async function Page() {
  const analytics = await loadAnalyticsSummary();
  return (
    <div className="space-y-10">
      <Hero />
      <Stats analytics={analytics} />
      <Features />
    </div>
  );
}

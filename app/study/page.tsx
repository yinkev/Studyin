import { loadAnalyticsSummary } from '../../lib/getAnalytics';
import { loadStudyItems } from '../../lib/getItems';
import { StudyView } from '../../components/StudyView';

export default async function StudyPage() {
  const [items, analytics] = await Promise.all([
    loadStudyItems({ statuses: ['review', 'published'] }),
    loadAnalyticsSummary()
  ]);
  return <StudyView items={items} analytics={analytics} />;
}


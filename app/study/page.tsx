import { loadAnalyticsSummary } from '../../lib/getAnalytics';
import { loadStudyItems } from '../../lib/getItems';
import { loadLessons } from '../../lib/getLessons';
import { StudyTabs } from '../../components/StudyTabs';

export default async function StudyPage() {
  const [items, analytics, lessons] = await Promise.all([
    loadStudyItems(),
    loadAnalyticsSummary(),
    loadLessons()
  ]);
  return <StudyTabs items={items} lessons={lessons} analytics={analytics} />;
}

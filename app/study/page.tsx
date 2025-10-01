import { loadAnalyticsSummary } from '../../lib/getAnalytics';
import { loadStudyItems } from '../../lib/getItems';
import { loadLessons } from '../../lib/getLessons';
import { StudyTabs } from '../../components/StudyTabs';
import { JsonLearnerStateRepository } from '../../services/state/jsonRepository';

const DEFAULT_LEARNER_ID = process.env.NEXT_PUBLIC_LEARNER_ID ?? 'demo-learner';

export default async function StudyPage() {
  const repository = new JsonLearnerStateRepository();
  const learnerId = DEFAULT_LEARNER_ID;

  const [items, analytics, lessons, learnerState] = await Promise.all([
    loadStudyItems(),
    loadAnalyticsSummary(),
    loadLessons(),
    repository.load(learnerId)
  ]);

  return (
    <StudyTabs
      items={items}
      lessons={lessons}
      analytics={analytics}
      learnerId={learnerId}
      initialLearnerState={learnerState}
    />
  );
}

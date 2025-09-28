import { loadStudyItems } from '../../lib/getItems';
import { ExamView } from '../../components/ExamView';

export default async function ExamPage() {
  const items = await loadStudyItems({ statuses: ['review', 'published'] });
  return <ExamView items={items} length={20} />;
}


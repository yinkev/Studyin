import { loadBlueprint } from '../../lib/getBlueprint';
import { loadStudyItems } from '../../lib/getItems';
import { ExamView } from '../../components/ExamView';

export default async function ExamPage() {
  const [items, blueprint] = await Promise.all([loadStudyItems(), loadBlueprint()]);
  return <ExamView items={items} length={20} blueprint={blueprint} />;
}


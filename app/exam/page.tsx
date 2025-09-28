import { buildExamForm } from '../../lib/server/forms';
import { ExamView } from '../../components/ExamView';

export default async function ExamPage() {
  const form = await buildExamForm({ length: 20, seed: 1, publishedOnly: false });
  return <ExamView items={form.items} length={form.length} blueprintId={form.blueprint_id} />;
}

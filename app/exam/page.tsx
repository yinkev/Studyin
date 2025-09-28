import { loadExamForm } from '../../lib/getExamForm';
import { ExamView } from '../../components/ExamView';

export default async function ExamPage() {
  const form = await loadExamForm({ length: 20 });
  return (
    <ExamView
      items={form.items}
      blueprintId={form.blueprintId}
      targetLength={form.targetLength}
      coverage={form.coverage}
      warnings={form.warnings}
    />
  );
}


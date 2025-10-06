import { buildExamForm } from '../../lib/server/forms';
import { ExamView } from '../../components/ExamView';

// Avoid static prerender failures in CI when no items exist.
// This page should always render dynamically at request time.
export const dynamic = "force-dynamic";

export default async function ExamPage() {
  try {
    const form = await buildExamForm({ length: 20, seed: 1, publishedOnly: false });
    return <ExamView items={form.items} length={form.length} blueprintId={form.blueprint_id} />;
  } catch (err: any) {
    // Graceful fallback for CI/preview environments without an item bank
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <h1 className="text-2xl font-semibold">Exam unavailable</h1>
        <p className="mt-2 text-muted-foreground">
          No items are available to generate a form. Add items locally or use the
          API route at <code className="px-1">/api/forms</code> with <code className="px-1">publishedOnly=false</code>.
        </p>
      </div>
    );
  }
}

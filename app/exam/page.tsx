import { buildExamForm } from '../../lib/server/forms';
import { ExamView } from '../../components/ExamView';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';

// Avoid static prerender failures in CI when no items exist.
// This page should always render dynamically at request time.
export const dynamic = "force-dynamic";

export default async function ExamPage() {
  try {
    const form = await buildExamForm({ length: 20, seed: 1, publishedOnly: false });
    return (
      <>
        <div className="mx-auto w-full max-w-6xl px-6 pt-6">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Exam' }]} />
        </div>
        <ExamView items={form.items} length={form.length} blueprintId={form.blueprint_id} />
      </>
    );
  } catch (err: any) {
    // Graceful fallback for CI/preview environments without an item bank
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-text-low/20 bg-surface-bg0/70 p-8 text-center text-text-high">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Exam' }]} />
        <div className="mt-6">
        <h1 className="text-2xl font-semibold">Exam unavailable</h1>
        <p className="mt-2 text-text-med">
          No items are available to generate a form. Add items locally or use the
          API route at <code className="px-1 font-mono text-text-high">/api/forms</code> with <code className="px-1 font-mono text-text-high">publishedOnly=false</code>.
        </p>
        </div>
      </div>
    );
  }
}

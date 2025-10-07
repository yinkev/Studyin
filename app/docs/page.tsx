import { Breadcrumbs } from '../../components/layout/Breadcrumbs';

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Docs' }]} />
      <section className="prose prose-slate max-w-none">
        <h1>Docs & SOPs</h1>
        <p>Developer and authoring guides live in the repository:</p>
        <ul>
          <li><code>AGENTS.md</code> — roles, SOPs, quality gates</li>
          <li><code>README.md</code> — quick start, scripts, structure</li>
          <li><code>config/</code> — blueprint, LOs, rubric</li>
        </ul>
        <p>
          For prompts, see <code>scripts/codex/</code>. For analytics, see <code>public/analytics</code>.
        </p>
      </section>
    </div>
  );
}

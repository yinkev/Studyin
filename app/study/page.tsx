import { promises as fs } from 'fs';
import path from 'path';
import InteractiveLessonViewer from '../../components/InteractiveLessonViewer';
import { interactiveLessonSchema, type InteractiveLesson } from '../../lib/types/lesson';
import GlowCard from '../../components/atoms/GlowCard';
import { loadAnalyticsSummary } from '../../lib/getAnalytics';
import { DrillsView } from '../../components/DrillsView';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';

async function loadLatestLesson(): Promise<InteractiveLesson | null> {
  const customDir = process.env.LESSON_STORAGE_DIR ?? path.join(process.cwd(), 'data', 'lessons');
  const fallbackDir = path.join(process.cwd(), 'content', 'lessons');
  const wristHandDir = path.join(process.cwd(), 'content', 'lessons', 'wrist-hand');
  const dirs = [customDir, fallbackDir, wristHandDir];

  for (const dir of dirs) {
    try {
      const files = await fs.readdir(dir);
      const jsonFiles = files.filter((file) => file.endsWith('.lesson.json'));
      if (!jsonFiles.length) continue;
      jsonFiles.sort((a, b) => b.localeCompare(a));
      const raw = await fs.readFile(path.join(dir, jsonFiles[0]), 'utf8');
      const parsed = interactiveLessonSchema.parse(JSON.parse(raw));
      if (!parsed.content.length && parsed.high_yield.length) {
        parsed.content = [
          {
            type: 'multiple_choice_question',
            id: `${parsed.id}-mcq`,
            learningObjective: parsed.lo_id,
            stem: parsed.high_yield[0] ?? parsed.summary,
            choices: parsed.high_yield.slice(0, 4).map((text, index) => ({ id: String.fromCharCode(65 + index), text })),
            correctChoice: 'A'
          }
        ];
      }
      return parsed;
    } catch (error) {
      console.warn(`study/page.tsx: unable to load lesson from ${dir}`, error);
    }
  }
  return null;
}

export default async function StudyPage() {
  const [lesson, analytics] = await Promise.all([loadLatestLesson(), loadAnalyticsSummary()]);

  if (!lesson) {
    const crumbs = [
      { label: 'Home', href: '/' },
      { label: 'Study' },
    ];
    return (
      <div className="min-h-screen px-6 py-24 text-text-high">
        <div className="mx-auto max-w-4xl">
          <Breadcrumbs items={crumbs} />
          <div className="mt-12">
            <div className="glass-clinical-card p-12 md:p-16 text-center">
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 rounded-2xl shadow-clinical-lg flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
              </div>

              <h1 className="text-4xl font-bold text-text-high mb-4">No Lessons Available</h1>
              <p className="text-lg text-text-med mb-8 max-w-2xl mx-auto">
                Upload a document to generate your first interactive lesson. Our AI will create personalized MCQs, evidence cards, and adaptive drills.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/upload" className="clinical-button inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold shadow-clinical-md hover:shadow-clinical-lg transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 15l7.5-7.5L18 15m-7.5-7.5V21"/>
                  </svg>
                  Upload Document
                </a>
                <a href="/dashboard" className="clinical-button-secondary inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  View Dashboard
                </a>
              </div>

              {/* Info */}
              <div className="mt-10 pt-8 border-t border-border-default">
                <p className="text-sm text-text-low">
                  Supported formats: PDF, PPT, DOCX, Markdown • Processing typically takes 2-5 minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen px-6 py-16 text-text-high">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Study', href: '/study' },
            { label: lesson.title },
          ]}
        />
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-light">Adaptive Session</p>
          <h1 className="text-5xl font-bold text-text-high">{lesson.title}</h1>
          <p className="max-w-3xl text-lg text-text-med">{lesson.summary}</p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="flex flex-col gap-6">
            <InteractiveLessonViewer lesson={lesson} learnerId="demo-learner" />
          </div>
          <aside className="space-y-6">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-text-high">Personalized drills</h2>
              <DrillsView analytics={analytics} />
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

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
  const dirs = [customDir, fallbackDir];

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
        <div className="min-h-screen bg-surface-bg1 px-6 py-24 text-text-high">
        <div className="mx-auto max-w-4xl text-center">
          <Breadcrumbs items={crumbs} />
          <div className="mt-6">
            <GlowCard className="border border-[rgba(148,163,184,0.2)] bg-surface-bg2/70 p-16 text-text-high">
              <h1 className="text-4xl font-bold text-text-high">No lessons yet</h1>
              <p className="mt-3 text-text-med">
                Upload a source file to generate your first adaptive lesson. Once the worker finishes, it will appear here automatically.
              </p>
            </GlowCard>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-surface-bg1 px-6 py-16 text-text-high">
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

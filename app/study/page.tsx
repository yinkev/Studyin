import { promises as fs } from 'fs';
import path from 'path';
import InteractiveLessonViewer from '../../components/InteractiveLessonViewer';
import { interactiveLessonSchema, type InteractiveLesson } from '../../lib/types/lesson';
import GlowCard from '../../components/atoms/GlowCard';

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
  const lesson = await loadLatestLesson();

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black px-6 py-24 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <GlowCard className="border border-white/10 bg-white/10 p-16 text-white">
            <h1 className="text-4xl font-bold">No lessons yet</h1>
            <p className="mt-3 text-slate-200">
              Upload a source file to generate your first adaptive lesson. Once the worker finishes, it will appear here automatically.
            </p>
          </GlowCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black px-6 py-16 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">Adaptive Session</p>
          <h1 className="text-5xl font-bold text-white">{lesson.title}</h1>
          <p className="max-w-3xl text-lg text-slate-200">{lesson.summary}</p>
        </header>

        <InteractiveLessonViewer lesson={lesson} learnerId="demo-learner" />
      </div>
    </div>
  );
}

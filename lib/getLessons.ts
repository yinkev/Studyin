import { promises as fs } from 'fs';
import path from 'path';

export interface LessonBeat {
  beat: number;
  duration_s?: number;
  narration?: string;
  visual?: string;
}

export interface TimelineEvent {
  type: 'text' | 'evidence';
  duration_ms: number;
  value: string | { file: string; page: number };
}

export interface LessonDoc {
  schema_version: string;
  id: string;
  los: string[];
  type: string;
  title: string;
  timeline: TimelineEvent[];
  animation_timeline?: LessonBeat[];
  lo_id: string; // for filtering
  module?: string;
}

const LESSONS_ROOT = path.join(process.cwd(), 'content', 'lessons');

async function walk(dir: string, out: string[]) {
  let entries: string[] = [];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const p = path.join(dir, name);
    const stat = await fs.stat(p);
    if (stat.isDirectory()) await walk(p, out);
    else if (stat.isFile() && name.endsWith('.lesson.json')) out.push(p);
  }
}

export async function loadLessons(loFilter?: string[]): Promise<LessonDoc[]> {
  const files: string[] = [];
  await walk(LESSONS_ROOT, files);
  files.sort((a, b) => a.localeCompare(b));
  const docs: LessonDoc[] = [];
  for (const file of files) {
    try {
      const raw = await fs.readFile(file, 'utf8');
      const json = JSON.parse(raw);
      json.lo_id = json.los?.[0] ?? ''; // for filtering
      const rel = path.relative(LESSONS_ROOT, file);
      const moduleId = rel.split(path.sep)[0] ?? undefined;
      json.module = moduleId;
      if (loFilter && loFilter.length && !loFilter.includes(json.lo_id)) continue;

      if (json.timeline) {
        json.animation_timeline = json.timeline.map((event: TimelineEvent, index: number) => {
          const narration = typeof event.value === 'string' ? event.value : `Evidence: ${event.value.file}, page ${event.value.page}`;
          return {
            beat: index + 1,
            duration_s: event.duration_ms / 1000,
            narration: narration,
            visual: typeof event.value === 'string' ? 'Text' : 'Evidence'
          };
        });
      }

      docs.push(json);
    } catch(e) {
      console.error(`Error processing lesson file: ${file}`, e)
      // ignore malformed files in early authoring
    }
  }
  return docs;
}

import { promises as fs } from 'fs';
import path from 'path';

export interface LessonBeat {
  beat: number;
  duration_s?: number;
  narration?: string;
  visual?: string;
}

export interface LessonDoc {
  schema_version: string;
  id: string;
  lo_id: string;
  title: string;
  summary?: string;
  high_yield?: string[];
  pitfalls?: string[];
  animation_timeline?: LessonBeat[];
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
      if (loFilter && loFilter.length && !loFilter.includes(json.lo_id)) continue;
      docs.push(json);
    } catch {
      // ignore malformed files in early authoring
    }
  }
  return docs;
}


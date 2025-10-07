import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  const customDir = process.env.LESSON_STORAGE_DIR ?? path.join(process.cwd(), 'data', 'lessons');
  const fallbackDir = path.join(process.cwd(), 'content', 'lessons');
  const dirs = [customDir, fallbackDir];

  const lessons = [];

  for (const dir of dirs) {
    try {
      const files = await fs.readdir(dir);
      const jsonFiles = files.filter((file) => file.endsWith('.lesson.json'));

      for (const file of jsonFiles) {
        try {
          const raw = await fs.readFile(path.join(dir, file), 'utf8');
          const lesson = JSON.parse(raw);

          lessons.push({
            id: lesson.id || file.replace('.lesson.json', ''),
            title: lesson.title || lesson.summary || 'Untitled Lesson',
            fileName: file,
            itemCount: lesson.content?.length || 0,
            difficulty: lesson.difficulty || 'medium'
          });
        } catch (parseError) {
          console.warn(`Failed to parse lesson ${file}:`, parseError);
        }
      }
    } catch (error) {
      console.warn(`Unable to read lessons from ${dir}`);
    }
  }

  lessons.sort((a, b) => b.id.localeCompare(a.id));

  return NextResponse.json({ lessons });
}

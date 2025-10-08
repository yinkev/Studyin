import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

async function findLessonFiles(dir: string): Promise<string[]> {
  const lessonFiles: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recurse into subdirectories
        const subFiles = await findLessonFiles(fullPath);
        lessonFiles.push(...subFiles);
      } else if (entry.name.endsWith('.lesson.json')) {
        lessonFiles.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
  }

  return lessonFiles;
}

export async function GET() {
  const customDir = process.env.LESSON_STORAGE_DIR ?? path.join(process.cwd(), 'data', 'lessons');
  const fallbackDir = path.join(process.cwd(), 'content', 'lessons');
  const dirs = [customDir, fallbackDir];

  const lessons = [];

  for (const dir of dirs) {
    const lessonFiles = await findLessonFiles(dir);

    for (const filePath of lessonFiles) {
      try {
        const raw = await fs.readFile(filePath, 'utf8');
        const lesson = JSON.parse(raw);
        const fileName = path.basename(filePath);

        lessons.push({
          id: lesson.id || fileName.replace('.lesson.json', ''),
          title: lesson.title || lesson.summary || 'Untitled Lesson',
          fileName,
          itemCount: lesson.content?.length || 0,
          difficulty: lesson.difficulty || 'medium'
        });
      } catch (parseError) {
        console.warn(`Failed to parse lesson ${filePath}:`, parseError);
      }
    }
  }

  lessons.sort((a, b) => b.id.localeCompare(a.id));

  return NextResponse.json({ lessons });
}

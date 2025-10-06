import { NextResponse } from 'next/server';
import { ensureLessonService } from '../../../../lib/services/runtime';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const service = ensureLessonService();
  const lesson = await service.loadLesson(params.id);
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }
  return NextResponse.json(lesson);
}

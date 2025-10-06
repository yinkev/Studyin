import { NextResponse, type NextRequest } from 'next/server';
import { ensureLessonService } from '../../../../lib/services/runtime';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const service = ensureLessonService();
  const lesson = await service.loadLesson(id);
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }
  return NextResponse.json(lesson);
}

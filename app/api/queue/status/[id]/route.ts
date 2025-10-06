import { NextResponse, type NextRequest } from 'next/server';
import { createDevQueueAdapter } from '../../../../../lib/queue';
import { ensureCoreServices } from '../../../../../lib/services/runtime';

const queue = createDevQueueAdapter<
  { fileName: string; fileSize: number; sourcePath?: string },
  { lessonId: string; outputPath: string }
>();

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  ensureCoreServices();
  const job = await queue.get(id);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  return NextResponse.json(job);
}

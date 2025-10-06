import { NextResponse } from 'next/server';
import { createDevQueueAdapter } from '../../../../../lib/queue';
import { ensureCoreServices } from '../../../../../lib/services/runtime';

const queue = createDevQueueAdapter<
  { fileName: string; fileSize: number; sourcePath?: string },
  { lessonId: string; outputPath: string }
>();

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  ensureCoreServices();
  const job = await queue.get(params.id);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  return NextResponse.json(job);
}

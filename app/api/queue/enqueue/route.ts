import { NextResponse } from 'next/server';
import { createDevQueueAdapter } from '../../../../lib/queue';
import { ensureCoreServices } from '../../../../lib/services/runtime';

export async function POST(request: Request) {
  const queue = createDevQueueAdapter<{ fileName: string; fileSize: number; sourcePath?: string }, { lessonId: string; outputPath: string }>();
  ensureCoreServices();
  const data = await request.json();
  if (!data?.fileName || typeof data.fileName !== 'string') {
    return NextResponse.json({ error: 'fileName required' }, { status: 400 });
  }
  const payload = {
    fileName: data.fileName as string,
    fileSize: Number(data.fileSize ?? 0),
    sourcePath: typeof data.sourcePath === 'string' ? data.sourcePath : undefined
  };
  const seed = typeof data.seed === 'number' ? data.seed : Date.now() % 1_000_000;
  const job = await queue.enqueue(payload, seed);
  return NextResponse.json({ jobId: job.id });
}

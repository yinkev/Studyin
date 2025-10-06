import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

let dir: string;

describe('DevQueueAdapter', () => {
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'queue-test-'));
    process.env.DEV_QUEUE_PATH = path.join(dir, 'jobs.json');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    delete process.env.DEV_QUEUE_PATH;
  });

  it('enqueues and completes jobs', async () => {
    const { createDevQueueAdapter } = await import('../queue');
    const queue = createDevQueueAdapter<{ fileName: string }, { lessonId: string }>();
    const job = await queue.enqueue({ fileName: 'demo.pdf' }, 42);
    expect(job.status).toBe('queued');
    await queue.markProcessing(job.id);
    await queue.complete(job.id, { lessonId: 'lesson-1' });
    const jobs = await queue.list();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].status).toBe('completed');
    expect(jobs[0].result?.lessonId).toBe('lesson-1');
  });
});

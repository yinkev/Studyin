import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { QueueAdapter, QueueJob } from '../types';

const QUEUE_PATH = process.env.DEV_QUEUE_PATH ?? path.join(process.cwd(), 'data', 'queue', 'jobs.json');

async function ensureQueueDir(): Promise<void> {
  await fs.mkdir(path.dirname(QUEUE_PATH), { recursive: true });
}

async function readQueue<TPayload, TResult>(): Promise<Array<QueueJob<TPayload, TResult>>> {
  try {
    const raw = await fs.readFile(QUEUE_PATH, 'utf8');
    return JSON.parse(raw) as Array<QueueJob<TPayload, TResult>>;
  } catch (error: any) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeQueue<TPayload, TResult>(jobs: Array<QueueJob<TPayload, TResult>>): Promise<void> {
  await ensureQueueDir();
  await fs.writeFile(QUEUE_PATH, JSON.stringify(jobs, null, 2) + '\n', 'utf8');
}

export class DevQueueAdapter<TPayload = Record<string, unknown>, TResult = Record<string, unknown>>
  implements QueueAdapter<TPayload, TResult>
{
  async enqueue(payload: TPayload, seed: number): Promise<QueueJob<TPayload, TResult>> {
    const jobs = await readQueue<TPayload, TResult>();
    const now = new Date().toISOString();
    const job: QueueJob<TPayload, TResult> = {
      id: randomUUID(),
      status: 'queued',
      payload,
      createdAt: now,
      updatedAt: now,
      attempts: 0,
      seed
    };
    jobs.push(job);
    await writeQueue(jobs);
    return job;
  }

  async peek(): Promise<QueueJob<TPayload, TResult> | null> {
    const jobs = await readQueue<TPayload, TResult>();
    const next = jobs.find((job) => job.status === 'queued');
    return next ?? null;
  }

  async markProcessing(id: string): Promise<void> {
    const jobs = await readQueue<TPayload, TResult>();
    const match = jobs.find((job) => job.id === id);
    if (!match) return;
    match.status = 'processing';
    match.attempts += 1;
    match.updatedAt = new Date().toISOString();
    await writeQueue(jobs);
  }

  async complete(id: string, result: TResult): Promise<void> {
    const jobs = await readQueue<TPayload, TResult>();
    const match = jobs.find((job) => job.id === id);
    if (!match) return;
    match.status = 'completed';
    match.result = result;
    match.updatedAt = new Date().toISOString();
    match.error = undefined;
    await writeQueue(jobs);
  }

  async fail(id: string, error: string): Promise<void> {
    const jobs = await readQueue<TPayload, TResult>();
    const match = jobs.find((job) => job.id === id);
    if (!match) return;
    match.status = 'failed';
    match.error = error;
    match.updatedAt = new Date().toISOString();
    await writeQueue(jobs);
  }

  async list(): Promise<Array<QueueJob<TPayload, TResult>>> {
    return readQueue<TPayload, TResult>();
  }

  async get(id: string): Promise<QueueJob<TPayload, TResult> | null> {
    const jobs = await readQueue<TPayload, TResult>();
    return jobs.find((job) => job.id === id) ?? null;
  }
}

export function createDevQueueAdapter<TPayload, TResult>() {
  return new DevQueueAdapter<TPayload, TResult>();
}

export { QUEUE_PATH };

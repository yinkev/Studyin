export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface QueueJob<TPayload = Record<string, unknown>, TResult = Record<string, unknown>> {
  id: string;
  status: JobStatus;
  payload: TPayload;
  result?: TResult;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  seed: number;
  error?: string;
}

export interface QueueAdapter<TPayload = Record<string, unknown>, TResult = Record<string, unknown>> {
  enqueue(payload: TPayload, seed: number): Promise<QueueJob<TPayload, TResult>>;
  peek(): Promise<QueueJob<TPayload, TResult> | null>;
  markProcessing(id: string): Promise<void>;
  complete(id: string, result: TResult): Promise<void>;
  fail(id: string, error: string): Promise<void>;
  list(): Promise<Array<QueueJob<TPayload, TResult>>>;
  get(id: string): Promise<QueueJob<TPayload, TResult> | null>;
}

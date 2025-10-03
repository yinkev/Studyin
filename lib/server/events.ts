import { promises as fs } from 'fs';
import path from 'path';
import { SCHEMA_VERSIONS, attemptEventSchema, sessionEventSchema, lessonEventSchema } from 'lib/core/schemas';

type AttemptEvent = ReturnType<typeof attemptEventSchema.parse>;
type SessionEvent = ReturnType<typeof sessionEventSchema.parse>;
type LessonEvent = ReturnType<typeof lessonEventSchema.parse>;

const DEFAULT_EVENTS_PATH = path.join(process.cwd(), 'data', 'events.ndjson');
const RATE_LIMIT_WINDOW_MS = Number.parseInt(process.env.INGEST_WINDOW_MS ?? '60000', 10);
const RATE_LIMIT_MAX_REQUESTS = Number.parseInt(process.env.INGEST_WINDOW_MAX ?? '60', 10);
const MAX_BODY_BYTES = Number.parseInt(process.env.INGEST_MAX_BYTES ?? '10240', 10);

const rateBucket = new Map<string, { count: number; resetAt: number }>();

function now(): number {
  return Date.now();
}

export function telemetryEnabled(): boolean {
  const flag = process.env.WRITE_TELEMETRY;
  if (flag === undefined) {
    return process.env.NODE_ENV !== 'production';
  }
  const normalized = flag.toLowerCase();
  return normalized !== '0' && normalized !== 'false';
}

export function requireAuthToken(authorization: string | null): { ok: true } | { ok: false; status: number; message: string } {
  const expected = process.env.INGEST_TOKEN;
  if (!expected) {
    return { ok: true };
  }
  if (!authorization) {
    return { ok: false, status: 401, message: 'Missing Authorization header' };
  }
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : authorization;
  if (token !== expected) {
    return { ok: false, status: 401, message: 'Invalid ingestion token' };
  }
  return { ok: true };
}

export function rateLimit(clientId: string): { ok: true } | { ok: false; status: number; message: string } {
  const key = clientId || 'unknown';
  const bucket = rateBucket.get(key);
  const current = now();
  if (!bucket || bucket.resetAt <= current) {
    rateBucket.set(key, { count: 1, resetAt: current + RATE_LIMIT_WINDOW_MS });
    return { ok: true };
  }
  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      ok: false,
      status: 429,
      message: 'Rate limit exceeded'
    };
  }
  bucket.count += 1;
  return { ok: true };
}

async function ensureEventsPath(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export function validateBodySize(raw: string): { ok: true } | { ok: false; status: number; message: string } {
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    return {
      ok: false,
      status: 413,
      message: 'Request body too large'
    };
  }
  return { ok: true };
}

export function parseAttemptEvent(payload: unknown): AttemptEvent {
  const data = attemptEventSchema.parse(payload);
  if (data.schema_version !== SCHEMA_VERSIONS.attemptEvent) {
    throw new Error(`schema_version mismatch: expected ${SCHEMA_VERSIONS.attemptEvent}`);
  }
  return data;
}

export function parseSessionEvent(payload: unknown): SessionEvent {
  const data = sessionEventSchema.parse(payload);
  if (data.schema_version !== SCHEMA_VERSIONS.sessionEvent) {
    throw new Error(`schema_version mismatch: expected ${SCHEMA_VERSIONS.sessionEvent}`);
  }
  return data;
}

export function parseLessonEvent(payload: unknown): LessonEvent {
  const data = lessonEventSchema.parse(payload);
  if (data.schema_version !== SCHEMA_VERSIONS.lessonEvent) {
    throw new Error(`schema_version mismatch: expected ${SCHEMA_VERSIONS.lessonEvent}`);
  }
  return data;
}

export async function appendAttempt(event: AttemptEvent, filePath = DEFAULT_EVENTS_PATH): Promise<void> {
  const useSupabase = process.env.USE_SUPABASE_INGEST === '1' || process.env.USE_SUPABASE_INGEST?.toLowerCase() === 'true';
  if (useSupabase) {
    const { getSupabaseAdmin, insertAttemptRow } = await import('./supabase');
    const client = await getSupabaseAdmin();
    if (!client) throw new Error('Supabase ingest enabled but client not available');
    await insertAttemptRow(client, event);
    return;
  }
  await ensureEventsPath(filePath);
  await fs.appendFile(filePath, JSON.stringify(event) + '\n', 'utf8');
}

export async function appendSession(event: SessionEvent, filePath = DEFAULT_EVENTS_PATH): Promise<void> {
  const useSupabase = process.env.USE_SUPABASE_INGEST === '1' || process.env.USE_SUPABASE_INGEST?.toLowerCase() === 'true';
  if (useSupabase) {
    const { getSupabaseAdmin, insertSessionRow } = await import('./supabase');
    const client = await getSupabaseAdmin();
    if (!client) throw new Error('Supabase ingest enabled but client not available');
    await insertSessionRow(client, event);
    return;
  }
  await ensureEventsPath(filePath);
  await fs.appendFile(filePath, JSON.stringify(event) + '\n', 'utf8');
}

export async function appendLesson(event: LessonEvent, filePath = DEFAULT_EVENTS_PATH): Promise<void> {
  const useSupabase = process.env.USE_SUPABASE_INGEST === '1' || process.env.USE_SUPABASE_INGEST?.toLowerCase() === 'true';
  if (useSupabase) {
    // For now, lesson events are stored only in NDJSON; add DB sink later.
  }
  await ensureEventsPath(filePath);
  await fs.appendFile(filePath, JSON.stringify(event) + '\n', 'utf8');
}

export function clientFingerprint(headers: Headers, fallback = 'unknown'): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;
  return fallback;
}

export const constants = Object.freeze({
  DEFAULT_EVENTS_PATH,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  MAX_BODY_BYTES
});

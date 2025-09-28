import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  appendSession,
  clientFingerprint,
  parseSessionEvent,
  rateLimit,
  requireAuthToken,
  telemetryEnabled,
  validateBodySize
} from '../../../lib/server/events';
import { SCHEMA_VERSIONS } from '../../../scripts/lib/schema.mjs';

export const runtime = 'nodejs';

async function readBody(req: Request): Promise<{ ok: true; value: unknown } | { ok: false; status: number; message: string }> {
  const text = await req.text();
  const sizeCheck = validateBodySize(text);
  if (!sizeCheck.ok) {
    return sizeCheck;
  }
  try {
    if (!text.trim()) {
      return { ok: false, status: 400, message: 'Empty request body' };
    }
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400, message: 'Invalid JSON payload' };
  }
}

export async function POST(req: Request) {
  if (!telemetryEnabled()) {
    return NextResponse.json({ ok: false, error: 'Telemetry ingestion disabled' }, { status: 503 });
  }

  const auth = requireAuthToken(req.headers.get('authorization'));
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  const clientId = clientFingerprint(req.headers, 'unknown');
  const rate = rateLimit(clientId);
  if (!rate.ok) {
    return NextResponse.json({ ok: false, error: rate.message }, { status: rate.status });
  }

  const body = await readBody(req);
  if (!body.ok) {
    return NextResponse.json({ ok: false, error: body.message }, { status: body.status });
  }

  let session;
  try {
    session = parseSessionEvent(body.value);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false, error: 'Validation failed', issues: error.issues }, { status: 422 });
    }
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }

  try {
    await appendSession(session);
  } catch (error) {
    console.error({ route: 'sessions', error });
    return NextResponse.json({ ok: false, error: 'Failed to persist session' }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      schema_version: SCHEMA_VERSIONS.sessionEvent,
      received_at: new Date().toISOString()
    },
    { status: 201 }
  );
}

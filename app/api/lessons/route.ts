import { NextRequest, NextResponse } from 'next/server';
import { appendLesson, clientFingerprint, parseLessonEvent, rateLimit, requireAuthToken, telemetryEnabled, validateBodySize } from '../../../lib/server/events';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!telemetryEnabled()) {
    return NextResponse.json({ ok: false, message: 'Telemetry disabled' }, { status: 403 });
  }
  const auth = requireAuthToken(req.headers.get('authorization'));
  if (!auth.ok) return NextResponse.json({ ok: false, message: auth.message }, { status: auth.status });

  const raw = await req.text();
  const size = validateBodySize(raw);
  if (!size.ok) return NextResponse.json({ ok: false, message: size.message }, { status: size.status });

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message ?? 'Invalid JSON' }, { status: 400 });
  }

  try {
    const event = parseLessonEvent(payload);
    const ip = clientFingerprint(req.headers, 'anon');
    const gate = rateLimit(ip);
    if (!gate.ok) return NextResponse.json({ ok: false, message: gate.message }, { status: gate.status });
    await appendLesson(event);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error?.message ?? 'Invalid payload' }, { status: 400 });
  }
}


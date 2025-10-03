import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { loadAttempts, summarizeAttempts } from 'lib/analytics/analyzerCore';

export const runtime = 'nodejs';

const EVENTS_PATH_DEFAULT = path.join(process.cwd(), process.env.EVENTS_PATH ?? 'data/events.ndjson');
const OUTPUT_PATH_DEFAULT = path.join(process.cwd(), process.env.ANALYTICS_OUT_PATH ?? 'public/analytics/latest.json');

function authorize(req: Request): { ok: true } | { ok: false; status: number; error: string } {
  const expected = process.env.ANALYTICS_REFRESH_TOKEN;
  if (!expected) {
    return { ok: true };
  }
  const header = req.headers.get('authorization');
  if (!header) {
    return { ok: false, status: 401, error: 'Missing Authorization header' };
  }
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  if (token !== expected) {
    return { ok: false, status: 401, error: 'Invalid refresh token' };
  }
  return { ok: true };
}

export async function POST(req: Request) {
  const auth = authorize(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const eventsPath = EVENTS_PATH_DEFAULT;
  const outputPath = OUTPUT_PATH_DEFAULT;

  try {
    let attempts;
    let readFromDb: boolean;
    if (process.env.READ_ANALYTICS_FROM_SUPABASE) {
      const flag = process.env.READ_ANALYTICS_FROM_SUPABASE.toLowerCase();
      readFromDb = flag === '1' || flag === 'true';
    } else {
      const ingestFlag = process.env.USE_SUPABASE_INGEST?.toLowerCase();
      readFromDb = ingestFlag === '1' || ingestFlag === 'true';
    }
    let supabaseClient = null;
    if (readFromDb) {
      const { getSupabaseAdmin, fetchAttempts } = await import('../../../../lib/server/supabase');
      supabaseClient = await getSupabaseAdmin();
      if (!supabaseClient) throw new Error('Supabase admin not available for analytics read');
      attempts = await fetchAttempts(supabaseClient);
    } else {
      attempts = await loadAttempts(eventsPath);
    }
    const summary = summarizeAttempts(attempts);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(summary, null, 2) + '\n');
    if (supabaseClient) {
      const { insertSnapshot } = await import('../../../../lib/server/supabase');
      await insertSnapshot(supabaseClient, summary);
    }
    return NextResponse.json({ ok: true, generated_at: summary.generated_at, totals: summary.totals });
  } catch (error) {
    console.error({ route: 'analytics-refresh', error });
    return NextResponse.json({ ok: false, error: 'Failed to refresh analytics' }, { status: 500 });
  }
}

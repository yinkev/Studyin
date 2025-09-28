import { NextResponse } from 'next/server';
import { telemetryEnabled } from '../../../lib/server/events';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  const supabaseIngest = process.env.USE_SUPABASE_INGEST === '1' || process.env.USE_SUPABASE_INGEST?.toLowerCase() === 'true';
  const analyticsFromDb = process.env.READ_ANALYTICS_FROM_SUPABASE === '1' || process.env.READ_ANALYTICS_FROM_SUPABASE?.toLowerCase() === 'true';
  const analyticsOut = path.join(process.cwd(), process.env.ANALYTICS_OUT_PATH ?? 'public/analytics/latest.json');
  let analyticsExists = false;
  let lastGeneratedAt: string | null = null;
  try {
    const stat = await fs.stat(analyticsOut);
    analyticsExists = true;
    const contents = await fs.readFile(analyticsOut, 'utf8');
    const json = JSON.parse(contents);
    if (json?.generated_at) lastGeneratedAt = json.generated_at;
  } catch {}

  if (!lastGeneratedAt && analyticsFromDb) {
    try {
      const { getSupabaseAdmin } = await import('../../../lib/server/supabase');
      const client = await getSupabaseAdmin();
      if (client) {
        const { data } = await client
          .from('analytics_snapshots')
          .select('generated_at')
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.generated_at) lastGeneratedAt = data.generated_at;
      }
    } catch (error) {
      console.error({ route: 'health', error });
    }
  }

  return NextResponse.json({
    ok: true,
    telemetry_enabled: telemetryEnabled(),
    supabase_ingest_enabled: supabaseIngest,
    analytics_read_from_db: analyticsFromDb,
    analytics_file_exists: analyticsExists,
    last_generated_at: lastGeneratedAt
  });
}

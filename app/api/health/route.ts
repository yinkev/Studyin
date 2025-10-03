import { NextResponse } from 'next/server';
import { telemetryEnabled } from '../../../lib/server/events';
import { promises as fs } from 'fs';
import path from 'path';
import { blueprintSchema, itemSchema } from 'lib/core/schemas';

export const runtime = 'nodejs';

export async function GET() {
  const supabaseIngest = process.env.USE_SUPABASE_INGEST === '1' || process.env.USE_SUPABASE_INGEST?.toLowerCase() === 'true';
  const analyticsFromDb = process.env.READ_ANALYTICS_FROM_SUPABASE === '1' || process.env.READ_ANALYTICS_FROM_SUPABASE?.toLowerCase() === 'true';
  const analyticsOut = path.join(process.cwd(), process.env.ANALYTICS_OUT_PATH ?? 'public/analytics/latest.json');
  let analyticsExists = false;
  let lastGeneratedAt: string | null = null;
  let blueprintOk = false;
  let itemCounts: { total: number; published: number } = { total: 0, published: 0 };

  // Blueprint readiness
  try {
    const blueprintPath = path.join(process.cwd(), process.env.BLUEPRINT_PATH ?? 'config/blueprint.json');
    const raw = await fs.readFile(blueprintPath, 'utf8');
    const parsed = blueprintSchema.parse(JSON.parse(raw));
    blueprintOk = Boolean(parsed && Object.keys(parsed.weights || {}).length > 0);
  } catch {
    blueprintOk = false;
  }
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

  // Item counts (quick scan of content/banks)
  try {
    const banksRoot = path.join(process.cwd(), 'content', 'banks');
    const queue: string[] = [banksRoot];
    while (queue.length) {
      const dir = queue.pop()!;
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) queue.push(p);
        else if (entry.isFile() && entry.name.endsWith('.item.json')) {
          try {
            const content = await fs.readFile(p, 'utf8');
            const json = JSON.parse(content);
            const item = itemSchema.parse(json);
            itemCounts.total += 1;
            if (item.status === 'published' && (item.rubric_score ?? 0) >= 2.7) {
              itemCounts.published += 1;
            }
          } catch {
            // ignore parse failures here; validator covers integrity in CI
          }
        }
      }
    }
  } catch {
    // ignore missing content directory
  }

  return NextResponse.json({
    ok: true,
    telemetry_enabled: telemetryEnabled(),
    supabase_ingest_enabled: supabaseIngest,
    analytics_read_from_db: analyticsFromDb,
    analytics_file_exists: analyticsExists,
    last_generated_at: lastGeneratedAt,
    engine: {
      blueprint_ok: blueprintOk,
      items_total: itemCounts.total,
      items_published_ok: itemCounts.published
    }
  });
}

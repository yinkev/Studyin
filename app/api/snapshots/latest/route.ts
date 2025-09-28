import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/server/supabase';

export const runtime = 'nodejs';

export async function GET() {
  const client = await getSupabaseAdmin();
  if (!client) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
  }
  const { data, error } = await client
    .from('analytics_snapshots')
    .select('generated_at,schema_version,payload')
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error({ route: 'snapshots-latest', error });
    return NextResponse.json({ ok: false, error: 'Failed to fetch snapshot' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: 'No snapshots found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, snapshot: data });
}


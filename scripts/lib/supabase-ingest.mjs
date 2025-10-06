import { createClient } from '@supabase/supabase-js';

function flagEnabled() {
  const flag = process.env.USE_SUPABASE_INGEST;
  if (!flag) return false;
  if (flag === '1') return true;
  return flag.toLowerCase() === 'true';
}

let cachedClient = null;

export function supabaseConfigured() {
  if (!flagEnabled()) return false;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[supabase] USE_SUPABASE_INGEST enabled but SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
    return false;
  }
  return true;
}

export async function getSupabaseAdmin() {
  if (!supabaseConfigured()) return null;
  if (cachedClient) return cachedClient;
  cachedClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    global: { headers: { 'x-studyin-ingest': '1' } }
  });
  return cachedClient;
}

export async function pushAnalyticsSnapshot(summary) {
  const client = await getSupabaseAdmin();
  if (!client) return false;
  const payload = {
    generated_at: summary.generated_at,
    schema_version: summary.schema_version,
    payload: summary
  };
  const { error } = await client.from('analytics_snapshots').insert(payload);
  if (error) {
    throw new Error(`Supabase insert snapshot failed: ${error.message}`);
  }
  return true;
}

export default { getSupabaseAdmin, pushAnalyticsSnapshot, supabaseConfigured };

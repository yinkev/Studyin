// Optional Supabase admin client for server-side ingestion.
// Loaded dynamically only when USE_SUPABASE_INGEST=1 to avoid bundling in non-Supabase builds.

export async function getSupabaseAdmin(): Promise<any | null> {
  if (process.env.USE_SUPABASE_INGEST !== '1' && process.env.USE_SUPABASE_INGEST?.toLowerCase() !== 'true') {
    return null;
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when USE_SUPABASE_INGEST is enabled');
  }
  // Dynamic import to keep optional
  const { createClient } = (await import('@supabase/supabase-js')) as any;
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { 'x-studyin-ingest': '1' } }
  });
}

export async function insertAttemptRow(client: any, attempt: any) {
  const { error } = await client.from('attempts').insert({
    schema_version: attempt.schema_version,
    app_version: attempt.app_version,
    session_id: attempt.session_id,
    user_id: attempt.user_id,
    item_id: attempt.item_id,
    lo_ids: attempt.lo_ids,
    ts_start: attempt.ts_start,
    ts_submit: attempt.ts_submit,
    duration_ms: attempt.duration_ms,
    mode: attempt.mode,
    choice: attempt.choice,
    correct: attempt.correct,
    confidence: attempt.confidence ?? null,
    opened_evidence: attempt.opened_evidence,
    flagged: attempt.flagged ?? null,
    rationale_opened: attempt.rationale_opened ?? null,
    keyboard_only: attempt.keyboard_only ?? null,
    device_class: attempt.device_class ?? null,
    net_state: attempt.net_state ?? null,
    paused_ms: attempt.paused_ms ?? null,
    hint_used: attempt.hint_used ?? null
  });
  if (error) throw new Error(`Supabase insert attempt failed: ${error.message}`);
}

export async function insertSessionRow(client: any, session: any) {
  const { error } = await client.from('sessions').insert({
    schema_version: session.schema_version,
    app_version: session.app_version,
    session_id: session.session_id,
    user_id: session.user_id,
    mode: session.mode,
    blueprint_id: session.blueprint_id ?? null,
    start_ts: session.start_ts,
    end_ts: session.end_ts ?? null,
    completed: session.completed ?? null,
    mastery_by_lo: session.mastery_by_lo ?? null
  });
  if (error) throw new Error(`Supabase insert session failed: ${error.message}`);
}

export async function fetchAttempts(client: any, limit = 100000) {
  const cols = `schema_version,app_version,session_id,user_id,item_id,lo_ids,ts_start,ts_submit,duration_ms,mode,choice,correct,confidence,opened_evidence,flagged,rationale_opened,keyboard_only,device_class,net_state,paused_ms,hint_used`;
  const { data, error } = await client
    .from('attempts')
    .select(cols)
    .order('ts_submit', { ascending: true })
    .limit(limit);
  if (error) throw new Error(`Supabase fetch attempts failed: ${error.message}`);
  return data ?? [];
}

export async function insertSnapshot(client: any, summary: any) {
  const payload = {
    generated_at: summary.generated_at,
    schema_version: summary.schema_version,
    payload: summary
  };
  const { error } = await client.from('analytics_snapshots').insert(payload);
  if (error) throw new Error(`Supabase insert snapshot failed: ${error.message}`);
}

export async function fetchEvidenceChunks(
  client: any,
  params: { loIds?: string[]; limit?: number } = {}
) {
  const { loIds = [], limit = 200 } = params;
  let query = client
    .from('evidence_chunks')
    .select('item_id,lo_ids,source_file,page,version,ts,text,embedding')
    .order('ts', { ascending: false })
    .limit(limit);
  if (loIds.length) {
    query = query.contains('lo_ids', loIds);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Supabase fetch evidence failed: ${error.message}`);
  return data ?? [];
}

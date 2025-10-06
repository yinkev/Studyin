import { NextResponse } from 'next/server';
import { getSupabaseAdmin, fetchEvidenceChunks } from '../../../lib/server/supabase';
import { generateDeterministicEmbedding, cosineSimilarity } from 'lib/rag/embedding';

export const runtime = 'nodejs';

interface EvidenceChunkRow {
  item_id: string;
  lo_ids: string[] | null;
  source_file: string | null;
  page: number | null;
  version: string | null;
  ts: number | null;
  text: string;
  embedding: number[] | string | null;
}


function parseArrayParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
}

function parseNumber(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const num = Number.parseInt(value, 10);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

function parseSince(value: string | null): number | null {
  if (!value) return null;
  const timestamp = Number.parseInt(value, 10);
  if (Number.isFinite(timestamp) && timestamp > 0) return timestamp;
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : date;
}

function temporalDecay(ts: number, now: number, halfLifeDays = 90) {
  if (!ts) return 1;
  const deltaDays = (now - ts) / (1000 * 60 * 60 * 24);
  const lambda = Math.log(2) / halfLifeDays;
  return Math.exp(-lambda * Math.max(0, deltaDays));
}

function sanitizeLoIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
}

function parseEmbedding(value: unknown): number[] {
  if (Array.isArray(value)) return value.map((num) => Number(num)).filter((num) => Number.isFinite(num));
  if (typeof value === 'string') {
    const trimmed = value.replace(/[()]/g, '');
    if (!trimmed) return [];
    return trimmed
      .split(',')
      .map((num) => Number(num))
      .filter((num) => Number.isFinite(num));
  }
  return [];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  if (!query) {
    return NextResponse.json({ ok: false, error: 'Missing query parameter q' }, { status: 400 });
  }
  const loIds = parseArrayParam(url.searchParams.get('lo'));
  const since = parseSince(url.searchParams.get('since'));
  const k = parseNumber(url.searchParams.get('k'), 5);

  const client = await getSupabaseAdmin();
  if (!client) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const rawChunks = (await fetchEvidenceChunks(client, { loIds, limit: 500 })) as EvidenceChunkRow[];
    const queryEmbedding = generateDeterministicEmbedding(query);
    const now = Date.now();
    const scored = rawChunks
      .map((chunk) => {
        const chunkLoIds = sanitizeLoIds(chunk.lo_ids);
        const embedding = parseEmbedding(chunk.embedding);
        const similarity = cosineSimilarity(queryEmbedding, embedding);
        const decay = temporalDecay(chunk.ts ?? now, since ?? now);
        const loMatchBoost = loIds.length ? chunkLoIds.filter((lo) => loIds.includes(lo)).length : 0;
        const score = similarity * decay + loMatchBoost * 0.05;
        return {
          item_id: chunk.item_id,
          lo_ids: chunkLoIds,
          source_file: chunk.source_file,
          page: chunk.page,
          version: chunk.version,
          ts: chunk.ts,
          text: chunk.text,
          similarity,
          decay,
          score
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
    return NextResponse.json({ ok: true, results: scored });
  } catch (error) {
    console.error({ route: 'search', error });
    return NextResponse.json({ ok: false, error: 'Search failed' }, { status: 500 });
  }
}

#!/usr/bin/env node
import process from 'process';
import { createClient } from '@supabase/supabase-js';
import { generateDeterministicEmbedding, cosineSimilarity } from '../../lib/rag/embedding.mjs';

const FIXTURES = [
  {
    query: 'ulnar nerve claw hand sensory loss',
    expectItem: 'item.ulnar.claw-hand'
  },
  {
    query: 'anterior shoulder dislocation vascular compromise',
    expectItem: 'item.shoulder.anterior-dislocation'
  }
];

async function fetchChunks(client) {
  const { data, error } = await client
    .from('evidence_chunks')
    .select('item_id,text,ts,lo_ids,source_file,embedding')
    .limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
}

function parseEmbedding(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.replace(/[()]/g, '');
    if (!trimmed) return [];
    return trimmed.split(',').map((num) => Number(num));
  }
  return [];
}

function rankChunks(chunks, query) {
  const queryEmbedding = generateDeterministicEmbedding(query);
  return chunks
    .map((chunk) => {
      const embedding = parseEmbedding(chunk.embedding);
      const score = cosineSimilarity(queryEmbedding, embedding);
      return { ...chunk, score };
    })
    .sort((a, b) => b.score - a.score);
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const client = createClient(url, key, { auth: { persistSession: false } });
  const chunks = await fetchChunks(client);
  if (!chunks.length) {
    console.error('No evidence chunks found. Run scripts/rag/build-index.mjs first.');
    process.exit(1);
  }
  let passed = 0;
  for (const fixture of FIXTURES) {
    const ranked = rankChunks(chunks, fixture.query);
    const top = ranked[0];
    const success = top?.item_id === fixture.expectItem;
    if (success) passed += 1;
    console.log(`${fixture.query} -> ${top?.item_id ?? 'none'} (score=${top?.score?.toFixed(3) ?? 'n/a'})`);
  }
  if (passed === FIXTURES.length) {
    console.log('RAG verify: PASS');
  } else {
    console.error('RAG verify: FAIL');
    process.exit(1);
  }
}

await main();

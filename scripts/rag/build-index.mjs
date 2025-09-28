#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { createClient } from '@supabase/supabase-js';
import { generateDeterministicEmbedding, EMBEDDING_DIMENSIONS } from '../../lib/rag/embedding.mjs';

const ROOT = process.cwd();
const BANK_DIR = path.join(ROOT, 'content', 'banks', 'upper-limb-oms1');

async function loadItems() {
  const files = (await fs.readdir(BANK_DIR)).filter((file) => file.endsWith('.item.json')).sort();
  const items = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(BANK_DIR, file), 'utf8');
    items.push(JSON.parse(raw));
  }
  return items;
}

function createChunkFromItem(item) {
  const evidence = item.evidence ?? {};
  const text = `${item.stem}\nRationale: ${item.rationale_correct}`;
  const ts = evidence.ts ?? Date.now();
  return {
    item_id: item.id,
    lo_ids: item.los,
    source_file: evidence.file ?? 'unknown-source',
    page: evidence.page ?? null,
    version: evidence.citation ?? 'v1',
    ts,
    text,
    embedding: generateDeterministicEmbedding(`${item.id}:${text}`)
  };
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const items = await loadItems();
  const chunks = items.map(createChunkFromItem);
  for (const chunk of chunks) {
    const payload = {
      item_id: chunk.item_id,
      lo_ids: chunk.lo_ids,
      source_file: chunk.source_file,
      page: chunk.page,
      version: chunk.version,
      ts: Math.floor(chunk.ts),
      text: chunk.text,
      embedding: `(${chunk.embedding.join(',')})`
    };
    const { error } = await supabase
      .from('evidence_chunks')
      .upsert(payload, { onConflict: 'item_id' });
    if (error) {
      console.error('Failed to upsert chunk', chunk.item_id, error.message);
      process.exit(1);
    }
  }
  console.log(`Indexed ${chunks.length} evidence chunks (dim=${EMBEDDING_DIMENSIONS}).`);
}

await main();

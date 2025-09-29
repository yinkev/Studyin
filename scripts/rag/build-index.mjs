#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { createClient } from '@supabase/supabase-js';
import { generateDeterministicEmbedding, EMBEDDING_DIMENSIONS } from '../../lib/rag/embedding.mjs';

const ROOT = process.cwd();
const DEFAULT_BANK_ROOT = path.join(ROOT, 'content', 'banks');

function resolveFromRoot(targetPath) {
  if (!targetPath) return null;
  return path.isAbsolute(targetPath) ? targetPath : path.join(ROOT, targetPath);
}

const scopeInput = process.env.BANK_DIRS ?? process.env.SCOPE_DIRS ?? '';
const BANK_SCOPES = scopeInput
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => resolveFromRoot(entry))
  .filter(Boolean);

const ITEM_SCOPES = BANK_SCOPES.length ? BANK_SCOPES : [DEFAULT_BANK_ROOT];

async function walkForItems(basePath, output) {
  try {
    const stat = await fs.stat(basePath);
    if (stat.isFile()) {
      if (basePath.endsWith('.item.json')) {
        output.push(basePath);
      }
      return;
    }
    if (!stat.isDirectory()) return;
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }

  const entries = await fs.readdir(basePath, { withFileTypes: true });
  for (const entry of entries) {
    const nextPath = path.join(basePath, entry.name);
    if (entry.isDirectory()) {
      await walkForItems(nextPath, output);
    } else if (entry.isFile() && entry.name.endsWith('.item.json')) {
      output.push(nextPath);
    }
  }
}

async function loadItems() {
  const files = [];
  for (const scope of ITEM_SCOPES) {
    await walkForItems(scope, files);
  }
  files.sort((a, b) => a.localeCompare(b));
  const items = [];
  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf8');
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
  if (!items.length) {
    console.error('No items found. Checked scopes:', ITEM_SCOPES.map((scope) => path.relative(ROOT, scope)).join(', '));
    process.exit(1);
  }
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
  console.log('Scopes:', ITEM_SCOPES.map((scope) => path.relative(ROOT, scope)).join(', '));
}

await main();

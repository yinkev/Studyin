#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';

const BANK_DIR = path.join(process.cwd(), 'content', 'banks', 'upper-limb-oms1');

function parseArgs(argv) {
  const args = { publish: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--id') args.id = argv[++i];
    else if (a === '--path') args.cropPath = argv[++i];
    else if (a === '--review') args.review = true;
    else if (a === '--publish') args.publish = true;
  }
  return args;
}

async function main() {
  const { id, cropPath, review, publish } = parseArgs(process.argv);
  if (!id || !cropPath) {
    console.error('Usage: node scripts/tools/link-evidence.mjs --id item.id --path content/evidence/.../file.png [--review|--publish]');
    process.exit(1);
  }
  const files = (await fs.readdir(BANK_DIR)).filter((f) => f.endsWith('.item.json'));
  let hits = 0;
  for (const fname of files) {
    const fpath = path.join(BANK_DIR, fname);
    const json = JSON.parse(await fs.readFile(fpath, 'utf8'));
    if (json.id !== id) continue;
    json.evidence = json.evidence || {};
    json.evidence.cropPath = cropPath;
    if (review) json.status = 'review';
    if (publish) json.status = 'published';
    await fs.writeFile(fpath, JSON.stringify(json, null, 2) + '\n');
    console.log(`✓ updated ${fname}`);
    hits++;
  }
  if (!hits) {
    console.error(`No item found with id '${id}'`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('link-evidence error:', err?.message || err);
  process.exit(1);
});


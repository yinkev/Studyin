#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') args.url = argv[++i];
    else if (a === '--out') args.out = argv[++i];
  }
  return args;
}

async function main() {
  const { url, out } = parseArgs(process.argv);
  if (!url || !out) {
    console.error('Usage: node scripts/tools/fetch-evidence.mjs --url https://... --out content/evidence/.../file.png');
    process.exit(1);
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, buf);
  console.log(`✓ downloaded ${url} -> ${out}`);
}

main().catch((err) => {
  console.error('fetch-evidence error:', err?.message || err);
  process.exit(1);
});


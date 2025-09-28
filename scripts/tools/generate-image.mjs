#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import OpenAI from 'openai';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--prompt') args.prompt = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--size') args.size = argv[++i];
    else if (a === '--model') args.model = argv[++i];
  }
  return args;
}

async function main() {
  const { prompt, out, size = '1024x1024', model = 'gpt-image-1' } = parseArgs(process.argv);
  if (!prompt || !out) {
    console.error('Usage: node scripts/tools/generate-image.mjs --prompt "..." --out path.png [--size 1024x1024] [--model gpt-image-1]');
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is required in environment');
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await openai.images.generate({ model, prompt, size });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image data returned');
  const buf = Buffer.from(b64, 'base64');
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, buf);
  console.log(`✓ wrote ${out}`);
}

main().catch((err) => {
  console.error('generate-image error:', err?.message || err);
  process.exit(1);
});


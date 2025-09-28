#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { loadAttempts, summarizeAttempts } from './lib/analyzer-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, process.env.EVENTS_PATH ?? 'data/events.ndjson');
const OUTPUT_PATH = path.join(ROOT, process.env.ANALYTICS_OUT_PATH ?? 'public/analytics/latest.json');

async function main() {
  try {
    const attempts = await loadAttempts(DATA_PATH);
    const summary = summarizeAttempts(attempts);
    await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(summary, null, 2) + '\n');
    console.log(`✓ analytics written to ${path.relative(ROOT, OUTPUT_PATH)}`);
  } catch (error) {
    console.error('Analyze script error:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

await main();

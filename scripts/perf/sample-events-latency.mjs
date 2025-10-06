#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { parseNdjsonLine, attemptEventSchema } from '../lib/schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EVENTS_PATH = path.join(ROOT, process.env.EVENTS_PATH ?? 'data/events.ndjson');

function percentile(values, pct) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((pct / 100) * (sorted.length - 1)));
  return sorted[index];
}

async function loadDurations() {
  try {
    const raw = await fs.readFile(EVENTS_PATH, 'utf8');
    const durations = [];
    for (const line of raw.split('\n')) {
      const event = parseNdjsonLine(line, attemptEventSchema);
      if (event && typeof event.duration_ms === 'number') {
        durations.push(event.duration_ms);
      }
    }
    return durations;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      console.error(`No events file found at ${path.relative(process.cwd(), EVENTS_PATH)}.`);
      return [];
    }
    throw error;
  }
}

async function main() {
  const durations = await loadDurations();
  if (!durations.length) {
    console.log('No attempt durations available.');
    return;
  }
  const sum = durations.reduce((total, value) => total + value, 0);
  const avg = sum / durations.length;
  const p50 = percentile(durations, 50);
  const p95 = percentile(durations, 95);
  console.log('Attempt duration stats (ms)');
  console.log(`count=${durations.length}`);
  console.log(`avg=${avg.toFixed(2)}`);
  console.log(`p50=${p50.toFixed(2)}`);
  console.log(`p95=${p95.toFixed(2)}`);
}

main().catch((error) => {
  console.error('Failed to sample events latency:', error.message ?? error);
  process.exitCode = 1;
});

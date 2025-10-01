#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath, pathToFileURL } from 'url';
import { summarizeAttempts } from '../lib/analyzer-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

async function loadJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function walkBanks(dir, out) {
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    return;
  }
  for (const entry of entries) {
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkBanks(next, out);
    } else if (entry.isFile() && entry.name.endsWith('.item.json')) {
      out.push(next);
    }
  }
}

async function loadItems(bankDir) {
  const files = [];
  await walkBanks(bankDir, files);
  files.sort((a, b) => a.localeCompare(b));
  const items = await Promise.all(files.map(loadJson));
  return items;
}

async function loadEvents(eventsPath) {
  try {
    const raw = await fs.readFile(eventsPath, 'utf8');
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function computeHalfLifeHours(attempts) {
  const defaultHalfLife = 12;
  if (!attempts || attempts.length === 0) return defaultHalfLife;
  const corr = attempts.filter((event) => event.correct).length;
  const ratio = corr / attempts.length;
  return Number(Math.max(6, defaultHalfLife * (0.5 + ratio)).toFixed(2));
}

export async function runRefit({
  bankDir,
  eventsPath,
  outputDir,
  now = Date.now()
}) {
  const items = await loadItems(bankDir);
  const events = await loadEvents(eventsPath);
  const summary = summarizeAttempts(events);

  const perItemAttempts = new Map();
  for (const event of events) {
    const list = perItemAttempts.get(event.item_id) ?? [];
    list.push(event);
    perItemAttempts.set(event.item_id, list);
  }

  const refit = [];
  for (const item of items) {
    const attempts = perItemAttempts.get(item.id) ?? [];
    const total = attempts.length;
    const correct = attempts.filter((event) => event.correct).length;
    const pValue = total ? correct / total : 0.5;
    const halfLifeHours = computeHalfLifeHours(attempts);
    refit.push({
      itemId: item.id,
      total,
      pValue: Number(pValue.toFixed(3)),
      halfLifeHours
    });
  }

  await fs.mkdir(outputDir, { recursive: true });
  const fileName = `refit-summary-${new Date(now).toISOString().slice(0, 10)}.json`;
  const filePath = path.join(outputDir, fileName);
  await fs.writeFile(filePath, JSON.stringify({ summary, refit }, null, 2) + '\n');
  return filePath;
}

async function main() {
  const bankDir = process.env.REFIT_BANK_DIR
    ? path.resolve(ROOT, process.env.REFIT_BANK_DIR)
    : path.join(ROOT, 'content', 'banks');
  const eventsPath = process.env.REFIT_EVENTS_PATH
    ? path.resolve(ROOT, process.env.REFIT_EVENTS_PATH)
    : path.join(ROOT, 'data', 'events.ndjson');
  const outputDir = process.env.REFIT_OUTPUT_DIR
    ? path.resolve(ROOT, process.env.REFIT_OUTPUT_DIR)
    : path.join(ROOT, 'data', 'refit-summaries');

  const filePath = await runRefit({ bankDir, eventsPath, outputDir });
  console.log(`✓ weekly refit summary written to ${path.relative(ROOT, filePath)}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (invokedPath && import.meta.url === invokedPath) {
  main().catch((error) => {
    console.error('refit job failed', error);
    process.exitCode = 1;
  });
}

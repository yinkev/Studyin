#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RUBRIC_PATH = path.join(ROOT, 'config', 'rubric.json');
const INPUT_PATH = path.join(ROOT, 'data', 'rubric-input.json');
const OUTPUT_PATH = path.join(ROOT, 'public', 'analytics', 'rubric-score.json');

async function readJson(filePath) {
  const data = await fs.readFile(filePath, 'utf8');
  return JSON.parse(data);
}

async function ensureTemplate(rubric) {
  const template = {
    schema_version: rubric.schema_version,
    note: 'Populate level (0-3, can be fractional) for each category before rerunning `npm run score:rubric`.',
    categories: Object.fromEntries(rubric.categories.map((category) => [category.id, null]))
  };
  await fs.mkdir(path.dirname(INPUT_PATH), { recursive: true });
  await fs.writeFile(INPUT_PATH, JSON.stringify(template, null, 2) + '\n');
}

function computeScore(rubric, inputs) {
  const results = [];
  let total = 0;
  let weightSum = 0;
  let criticalOk = true;

  for (const category of rubric.categories) {
    const valueRaw = inputs.categories?.[category.id];
    if (typeof valueRaw !== 'number') {
      throw new Error(`Missing numeric level for category '${category.id}'.`);
    }
    const level = Math.min(3, Math.max(0, valueRaw));
    const weighted = category.weight * (level / 3);
    total += weighted;
    weightSum += category.weight;
    if (category.critical && level < rubric.critical_threshold) {
      criticalOk = false;
    }
    results.push({
      id: category.id,
      label: category.label,
      level: Number(level.toFixed(2)),
      weight: category.weight,
      critical: Boolean(category.critical),
      weighted_score: Number(weighted.toFixed(2))
    });
  }

  const normalizedTotal = weightSum === 0 ? 0 : Number(total.toFixed(2));
  return { total: normalizedTotal, criticalOk, categories: results };
}

async function main() {
  try {
    const rubric = await readJson(RUBRIC_PATH);

    let inputs;
    try {
      inputs = await readJson(INPUT_PATH);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await ensureTemplate(rubric);
        console.error(
          `Created rubric input template at ${path.relative(ROOT, INPUT_PATH)}. Populate levels and rerun.`
        );
        process.exitCode = 1;
        return;
      }
      throw error;
    }

    const { total, criticalOk, categories } = computeScore(rubric, inputs);
    const overallPass = total >= rubric.overall_threshold && criticalOk;

    const payload = {
      schema_version: rubric.schema_version,
      generated_at: new Date().toISOString(),
      overall_score: total,
      threshold: rubric.overall_threshold,
      critical_threshold: rubric.critical_threshold,
      critical_ok: criticalOk,
      overall_pass: overallPass,
      categories
    };

    await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2) + '\n');

    console.log(
      `Rubric score ${total.toFixed(2)} (threshold ${rubric.overall_threshold}). Critical OK: ${criticalOk}. Output saved to ${path.relative(
        ROOT,
        OUTPUT_PATH
      )}`
    );
    if (!overallPass) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('score-rubric error:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

await main();

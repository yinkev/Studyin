#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import {
  itemSchema,
  blueprintSchema,
  learningObjectivesDocumentSchema,
  SCHEMA_VERSIONS
} from './lib/schema.mjs';
import { isBlueprintFeasible, deriveLoTargets } from './lib/blueprint.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DEFAULT_BANK_ROOT = path.join(ROOT, 'content', 'banks');

function resolveFromRoot(targetPath, fallback) {
  if (!targetPath) return fallback;
  return path.isAbsolute(targetPath) ? targetPath : path.join(ROOT, targetPath);
}

const SCOPE_DIRS = (process.env.SCOPE_DIRS ?? '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => resolveFromRoot(entry, entry));

const BANK_SCOPES = SCOPE_DIRS.length ? SCOPE_DIRS : [DEFAULT_BANK_ROOT];

const BLUEPRINT_PATH = resolveFromRoot(process.env.BLUEPRINT_PATH, path.join(ROOT, 'config', 'blueprint.json'));
const LOS_PATH = resolveFromRoot(process.env.LOS_PATH, path.join(ROOT, 'config', 'los.json'));
const TARGET_FORM_LENGTH = Number.parseInt(process.env.VALIDATION_FORM_LENGTH ?? '30', 10);
const REQUIRE_EVIDENCE_CROP = process.env.REQUIRE_EVIDENCE_CROP !== '0';

async function readJson(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

function ensureAllLetterRationales(item) {
  const missing = [];
  for (const letter of ['A', 'B', 'C', 'D', 'E']) {
    if (letter === item.key) continue;
    if (!item.rationale_distractors[letter]) {
      missing.push(letter);
    }
  }
  return missing;
}

function ensureChoicesUnique(item) {
  const values = Object.entries(item.choices);
  const duplicates = [];
  for (let i = 0; i < values.length; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      if (values[i][1].trim() === values[j][1].trim()) {
        duplicates.push([values[i][0], values[j][0]]);
      }
    }
  }
  return duplicates;
}

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

async function main() {
  try {
    const blueprintRaw = await readJson(BLUEPRINT_PATH);
    const blueprint = blueprintSchema.parse(blueprintRaw);

    const loDocRaw = await readJson(LOS_PATH);
    const loDoc = learningObjectivesDocumentSchema.parse(loDocRaw);
    const loSet = new Set(loDoc.learning_objectives.map((lo) => lo.id));

    const collectedFiles = [];
    for (const scope of BANK_SCOPES) {
      await walkForItems(scope, collectedFiles);
    }
    const itemFiles = collectedFiles.sort((a, b) => a.localeCompare(b));
    if (!itemFiles.length) {
      const scopeSummary = BANK_SCOPES.map((scope) => path.relative(ROOT, scope)).join(', ');
      console.error('No item files found. Checked scopes:', scopeSummary || '(none)');
      process.exitCode = 1;
      return;
    }

    const errors = [];
    const summaries = [];
    const parsedItems = [];

    for (const filePath of itemFiles) {
      const raw = await readJson(filePath);
      const parsed = itemSchema.parse(raw);

      const itemErrors = [];

      if (parsed.schema_version !== SCHEMA_VERSIONS.item) {
        itemErrors.push(`schema_version mismatch (expected ${SCHEMA_VERSIONS.item})`);
      }

      const missingLos = parsed.los.filter((lo) => !loSet.has(lo));
      if (missingLos.length) {
        itemErrors.push(`unknown learning objectives: ${missingLos.join(', ')}`);
      }

      const missingRationales = ensureAllLetterRationales(parsed);
      if (missingRationales.length) {
        itemErrors.push(`missing distractor rationales for: ${missingRationales.join(', ')}`);
      }

      const duplicates = ensureChoicesUnique(parsed);
      if (duplicates.length) {
        itemErrors.push(
          `duplicate choice text detected for pairs: ${duplicates
            .map((pair) => pair.join('/'))
            .join(', ')}`
        );
      }

      if (parsed.status === 'published' && (!parsed.rubric_score || parsed.rubric_score < 2.7)) {
        itemErrors.push('published item must have rubric_score ≥ 2.7');
      }

      if (REQUIRE_EVIDENCE_CROP) {
        if (!parsed.evidence.bbox && !parsed.evidence.cropPath) {
          itemErrors.push('evidence requires bbox or cropPath (set REQUIRE_EVIDENCE_CROP=0 to relax)');
        }
      } else {
        if (!parsed.evidence.citation && !parsed.evidence.source_url) {
          itemErrors.push('evidence requires at least a citation or source_url when REQUIRE_EVIDENCE_CROP=0');
        }
      }

      if (itemErrors.length) {
        errors.push({ file: path.relative(ROOT, filePath), messages: itemErrors });
      }

      parsedItems.push(parsed);
      summaries.push({
        id: parsed.id,
        los: parsed.los,
        difficulty: parsed.difficulty,
        status: parsed.status
      });
    }

    const publishedItems = parsedItems.filter((item) => item.status === 'published');
    const examPool = publishedItems.length ? publishedItems : parsedItems;
    const blueprintFeasible =
      Number.isInteger(TARGET_FORM_LENGTH) &&
      TARGET_FORM_LENGTH > 0 &&
      isBlueprintFeasible(blueprint, examPool, TARGET_FORM_LENGTH);

    if (!blueprintFeasible) {
      if (!Number.isInteger(TARGET_FORM_LENGTH) || TARGET_FORM_LENGTH <= 0) {
        errors.push({
          file: 'blueprint-preflight',
          messages: [
            `Invalid TARGET_FORM_LENGTH (${TARGET_FORM_LENGTH}). Set env VALIDATION_FORM_LENGTH to positive integer.`
          ]
        });
      } else {
        const targets = deriveLoTargets(blueprint, TARGET_FORM_LENGTH);
        const supply = new Map();
        examPool.forEach((item) => {
          item.los.forEach((lo) => {
            supply.set(lo, (supply.get(lo) ?? 0) + 1);
          });
        });

        const deficits = [];
        for (const [loId, required] of targets.entries()) {
          const have = supply.get(loId) ?? 0;
          if (have < required) {
            deficits.push(`${loId}: need ${required}, have ${have}`);
          }
        }

        if (!deficits.length && examPool.length < TARGET_FORM_LENGTH) {
          deficits.push(
            `total items available ${examPool.length} < target form length ${TARGET_FORM_LENGTH}`
          );
        }

        errors.push({
          file: 'blueprint-preflight',
          messages: [
            `Blueprint infeasible for form length ${TARGET_FORM_LENGTH} using ${publishedItems.length ? 'published' : 'all'} items`,
            'Deficits:',
            ...deficits
          ]
        });
      }
    }

    if (!errors.length) {
      console.log(`✓ ${itemFiles.length} items validated`);
      console.log('Scopes:', BANK_SCOPES.map((scope) => path.relative(ROOT, scope)).join(', '));
      console.log(
        `Blueprint '${blueprint.id}' weights tracked (${Object.keys(blueprint.weights).length} LOs)`
      );
      const statusCounts = summaries.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1;
        return acc;
      }, {});
      console.log('Statuses:', statusCounts);
    } else {
      console.error('Validation failed:');
      for (const failure of errors) {
        console.error(`- ${failure.file}`);
        failure.messages.forEach((message) => console.error(`  • ${message}`));
      }
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Validator error:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

await main();

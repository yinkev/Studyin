import { promises as fs } from 'fs';
import path from 'path';
import { buildFormGreedy, deriveLoTargets, isBlueprintFeasible } from '../../scripts/lib/blueprint.mjs';

type Choice = 'A' | 'B' | 'C' | 'D' | 'E';

const ROOT = process.cwd();
const BANK_DIR = path.join(ROOT, 'content', 'banks');
const BLUEPRINT_PATH = path.join(ROOT, 'config', 'blueprint.json');

interface BankItem {
  schema_version: string;
  id: string;
  stem: string;
  choices: Record<Choice, string>;
  key: Choice;
  los: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'draft' | 'review' | 'published';
}

interface Blueprint {
  schema_version: string;
  id: string;
  weights: Record<string, number>;
}

export interface ExamItem {
  id: string;
  stem: string;
  choices: Record<Choice, string>;
  key: Choice;
  los: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface BuildExamFormOptions {
  length: number;
  seed?: number;
  publishedOnly?: boolean;
}

export interface ExamForm {
  id: string;
  blueprint_id: string;
  length: number;
  seed: number;
  items: ExamItem[];
}

export class BlueprintDeficitError extends Error {
  blueprintId: string;
  deficits: string[];

  constructor(blueprintId: string, deficits: string[]) {
    super(`Blueprint infeasible for form with length ${deficits.length ? deficits.join(', ') : 'unknown deficits'}`);
    this.blueprintId = blueprintId;
    this.deficits = deficits;
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

async function loadBlueprint(): Promise<Blueprint> {
  return readJson<Blueprint>(BLUEPRINT_PATH);
}

async function walkForItems(dir: string, out: string[]): Promise<void> {
  let entries: (string | undefined)[] = [];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (!name) continue;
    const p = path.join(dir, name);
    try {
      const stat = await fs.stat(p);
      if (stat.isDirectory()) await walkForItems(p, out);
      else if (stat.isFile() && name.endsWith('.item.json')) out.push(p);
    } catch {
      // ignore
    }
  }
}

async function loadBankItems(): Promise<BankItem[]> {
  const files: string[] = [];
  await walkForItems(BANK_DIR, files);
  files.sort();
  const items: BankItem[] = [];
  for (const file of files) {
    const json = await readJson<BankItem & Record<string, unknown>>(file);
    items.push(json as BankItem);
  }
  return items;
}

function computeDeficits(blueprint: Blueprint, items: BankItem[], formLength: number): string[] {
  const targets = deriveLoTargets(blueprint, formLength);
  const supply = new Map<string, number>();
  for (const item of items) {
    item.los.forEach((lo) => {
      supply.set(lo, (supply.get(lo) ?? 0) + 1);
    });
  }
  const deficits: string[] = [];
  for (const [loId, required] of targets.entries()) {
    const have = supply.get(loId) ?? 0;
    if (have < required) {
      deficits.push(`${loId}: need ${required}, have ${have}`);
    }
  }
  if (!deficits.length && items.length < formLength) {
    deficits.push(`total items available ${items.length} < target form length ${formLength}`);
  }
  return deficits;
}

function sanitizeItem(item: BankItem): ExamItem {
  return {
    id: item.id,
    stem: item.stem,
    choices: item.choices,
    key: item.key,
    los: item.los,
    difficulty: item.difficulty
  };
}

export async function buildExamForm({ length, seed = 1, publishedOnly = false }: BuildExamFormOptions): Promise<ExamForm> {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error('length must be a positive integer');
  }

  const [blueprint, items] = await Promise.all([loadBlueprint(), loadBankItems()]);
  const pool = publishedOnly ? items.filter((item) => item.status === 'published') : items;

  if (!pool.length) {
    throw new BlueprintDeficitError(blueprint.id, ['No items available matching publishedOnly filter']);
  }

  // Guard: even if per-LO supply is feasible, total distinct items must meet requested length
  if (pool.length < length) {
    const deficits = computeDeficits(blueprint, pool, length);
    throw new BlueprintDeficitError(blueprint.id, deficits);
  }

  if (!isBlueprintFeasible(blueprint, pool, length)) {
    const deficits = computeDeficits(blueprint, pool, length);
    throw new BlueprintDeficitError(blueprint.id, deficits);
  }

  const selected = buildFormGreedy({ blueprint, items: pool, formLength: length, seed }) as BankItem[];
  const sanitized = selected.map((item) => sanitizeItem(item));
  const formId = `form-${blueprint.id}-${seed}-${length}`;

  return {
    id: formId,
    blueprint_id: blueprint.id,
    length,
    seed,
    items: sanitized
  };
}

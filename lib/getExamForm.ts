import { promises as fs } from 'fs';
import path from 'path';
import { loadStudyItems, type StudyItem, type ItemStatus } from './getItems';

interface BlueprintConfig {
  id: string;
  weights: Record<string, number>;
}

export interface BlueprintCoverageEntry {
  lo_id: string;
  required: number;
  delivered: number;
  available: number;
}

export interface LoadExamFormOptions {
  length?: number;
  seed?: number;
  preferPublished?: boolean;
}

export interface ExamFormResult {
  blueprintId: string;
  targetLength: number;
  items: StudyItem[];
  coverage: BlueprintCoverageEntry[];
  warnings: string[];
  usedPoolStatus: ItemStatus[];
}

const BLUEPRINT_PATH = path.join(process.cwd(), 'config', 'blueprint.json');

async function loadBlueprint(): Promise<BlueprintConfig> {
  const raw = await fs.readFile(BLUEPRINT_PATH, 'utf8');
  const parsed = JSON.parse(raw) as BlueprintConfig;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid blueprint configuration');
  }
  if (!parsed.weights || Object.keys(parsed.weights).length === 0) {
    throw new Error('Blueprint weights are required to build an exam form');
  }
  return parsed;
}

function deriveTargets(weights: Record<string, number>, formLength: number): Map<string, number> {
  if (!Number.isInteger(formLength) || formLength <= 0) {
    throw new Error('Exam form length must be a positive integer');
  }

  const entries = Object.entries(weights);
  if (!entries.length) {
    throw new Error('Blueprint weights cannot be empty');
  }

  const interim = entries.map(([loId, weight]) => {
    const raw = weight * formLength;
    const base = Math.floor(raw);
    return { loId, base, remainder: raw - base };
  });

  let assigned = interim.reduce((sum, item) => sum + item.base, 0);
  const targets = new Map(interim.map(({ loId, base }) => [loId, base]));

  const sortedRemainders = [...interim].sort((a, b) => b.remainder - a.remainder);
  let idx = 0;
  while (assigned < formLength) {
    const current = sortedRemainders[idx % sortedRemainders.length];
    targets.set(current.loId, (targets.get(current.loId) ?? 0) + 1);
    assigned += 1;
    idx += 1;
  }

  return targets;
}

function countByLo(items: StudyItem[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    for (const lo of item.los) {
      map.set(lo, (map.get(lo) ?? 0) + 1);
    }
  }
  return map;
}

function isFeasible(weights: Record<string, number>, items: StudyItem[], formLength: number): boolean {
  const targets = deriveTargets(weights, formLength);
  const supply = countByLo(items);
  for (const [loId, required] of targets.entries()) {
    if ((supply.get(loId) ?? 0) < required) {
      return false;
    }
  }
  return items.length >= formLength;
}

const MULTIPLIER = 48271;
const MODULUS = 0x7fffffff;

function createPrng(seed = 1): () => number {
  let state = (seed & 0x7fffffff) || 1;
  return () => {
    state = (state * MULTIPLIER) % MODULUS;
    return state / MODULUS;
  };
}

function buildFormGreedy(
  weights: Record<string, number>,
  pool: StudyItem[],
  formLength: number,
  seed: number
): StudyItem[] {
  const targets = deriveTargets(weights, formLength);
  const rng = createPrng(seed);
  const selected: StudyItem[] = [];
  const used = new Set<string>();

  const poolById = new Map(pool.map((item) => [item.id, item]));

  while (selected.length < formLength) {
    const currentCounts = countByLo(selected);
    const deficits = Array.from(targets.entries())
      .map(([loId, required]) => ({ loId, deficit: required - (currentCounts.get(loId) ?? 0) }))
      .filter(({ deficit }) => deficit > 0)
      .sort((a, b) => b.deficit - a.deficit);

    let chosen: StudyItem | null = null;

    for (const deficit of deficits) {
      const candidates = pool.filter((item) => !used.has(item.id) && item.los.includes(deficit.loId));
      if (candidates.length) {
        const pickIndex = Math.floor(rng() * candidates.length);
        chosen = candidates[pickIndex];
        break;
      }
    }

    if (!chosen) {
      const remaining = pool.filter((item) => !used.has(item.id));
      if (!remaining.length) {
        break;
      }
      const pickIndex = Math.floor(rng() * remaining.length);
      chosen = remaining[pickIndex];
    }

    if (!chosen) {
      break;
    }

    if (!poolById.has(chosen.id)) {
      continue;
    }

    selected.push(chosen);
    used.add(chosen.id);
  }

  return selected;
}

function describeDeficits(
  targets: Map<string, number>,
  supply: Map<string, number>,
  delivered: Map<string, number>
): string[] {
  const issues: string[] = [];
  for (const [loId, required] of targets.entries()) {
    const available = supply.get(loId) ?? 0;
    const deliveredCount = delivered.get(loId) ?? 0;
    if (available < required) {
      issues.push(`${loId}: need ${required}, have ${available}`);
    } else if (deliveredCount < required) {
      issues.push(`${loId}: delivered ${deliveredCount} of ${required}`);
    }
  }
  return issues;
}

export async function loadExamForm({
  length = 20,
  seed = 1,
  preferPublished = true
}: LoadExamFormOptions = {}): Promise<ExamFormResult> {
  const targetLength = Math.max(1, Math.floor(length));
  const [items, blueprint] = await Promise.all([loadStudyItems(), loadBlueprint()]);

  const published = items.filter((item) => item.status === 'published');
  const pool = preferPublished && published.length >= targetLength ? published : items;
  const usedPoolStatus = pool.map((item) => item.status);

  const targets = deriveTargets(blueprint.weights, targetLength);
  const poolSupply = countByLo(pool);
  const feasible = isFeasible(blueprint.weights, pool, targetLength);

  const warnings: string[] = [];
  if (preferPublished && published.length < targetLength) {
    warnings.push('Not enough published items; including review/draft items in exam form.');
  }

  let selected: StudyItem[];
  if (feasible) {
    selected = buildFormGreedy(blueprint.weights, pool, targetLength, seed);
  } else {
    warnings.push('Blueprint infeasible with current pool; using best-effort fallback.');
    selected = pool.slice(0, Math.min(pool.length, targetLength));
  }

  if (selected.length < targetLength) {
    warnings.push(`Selected ${selected.length} of requested ${targetLength} items due to limited pool size.`);
  }

  const delivered = countByLo(selected);
  warnings.push(...describeDeficits(targets, poolSupply, delivered));

  const coverage: BlueprintCoverageEntry[] = Array.from(targets.entries())
    .map(([loId, required]) => ({
      lo_id: loId,
      required,
      delivered: delivered.get(loId) ?? 0,
      available: poolSupply.get(loId) ?? 0
    }))
    .sort((a, b) => b.required - a.required);

  return {
    blueprintId: blueprint.id,
    targetLength,
    items: selected,
    coverage,
    warnings: warnings.filter((message, index, self) => message && self.indexOf(message) === index),
    usedPoolStatus
  };
}


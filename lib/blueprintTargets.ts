import { z } from 'zod';

const weightsSchema = z.record(z.number().nonnegative());

export interface BlueprintTarget {
  loId: string;
  target: number;
  weight: number;
}

export function computeBlueprintTargets(weights: Record<string, number>, formLength: number): BlueprintTarget[] {
  weightsSchema.parse(weights);
  if (!Number.isInteger(formLength) || formLength <= 0) {
    throw new Error('formLength must be a positive integer');
  }

  const entries = Object.entries(weights);
  if (!entries.length) {
    throw new Error('Blueprint has no LO weights');
  }

  const interim = entries.map(([loId, weight]) => {
    const raw = weight * formLength;
    const base = Math.floor(raw);
    return { loId, base, remainder: raw - base, weight };
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

  return interim.map(({ loId, weight }) => ({
    loId,
    weight,
    target: targets.get(loId) ?? 0
  }));
}

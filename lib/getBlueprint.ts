import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const blueprintSchema = z.object({
  schema_version: z.string().min(1),
  id: z.string().min(1),
  weights: z.record(z.number().nonnegative())
});

export type Blueprint = z.infer<typeof blueprintSchema>;

export async function loadBlueprint(): Promise<Blueprint> {
  const blueprintPath = path.join(process.cwd(), 'config', 'blueprint.json');
  const raw = await fs.readFile(blueprintPath, 'utf8');
  const json = JSON.parse(raw);
  return blueprintSchema.parse(json);
}

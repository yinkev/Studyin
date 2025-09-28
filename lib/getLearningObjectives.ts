import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const learningObjectiveSchema = z.object({
  schema_version: z.string().optional(),
  id: z.string().min(1),
  label: z.string().min(1),
  parent: z.string().optional()
});

const losSchema = z.object({
  schema_version: z.string().optional(),
  learning_objectives: z.array(learningObjectiveSchema)
});

export type LearningObjective = z.infer<typeof learningObjectiveSchema>;

export async function loadLearningObjectives(): Promise<LearningObjective[]> {
  const losPath = path.join(process.cwd(), 'config', 'los.json');
  const raw = await fs.readFile(losPath, 'utf8');
  const json = JSON.parse(raw);
  const parsed = losSchema.parse(json);
  return parsed.learning_objectives;
}

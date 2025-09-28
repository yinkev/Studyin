import { promises as fs } from 'fs';
import path from 'path';

export interface BlueprintConfig {
  schema_version: string;
  id: string;
  weights: Record<string, number>;
}

const BLUEPRINT_PATH = path.join(process.cwd(), 'config', 'blueprint.json');

export async function loadBlueprint(): Promise<BlueprintConfig | null> {
  try {
    const raw = await fs.readFile(BLUEPRINT_PATH, 'utf8');
    return JSON.parse(raw) as BlueprintConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

import { promises as fs } from 'fs';
import path from 'path';

export interface BlueprintConfig {
  schema_version: string;
  id: string;
  weights: Record<string, number>;
}

const BLUEPRINT_PATH = path.join(process.cwd(), 'config', 'blueprint.json');

export async function loadBlueprint(): Promise<BlueprintConfig> {
  const raw = await fs.readFile(BLUEPRINT_PATH, 'utf8');
  const blueprint = JSON.parse(raw) as BlueprintConfig;
  if (!blueprint || typeof blueprint !== 'object') {
    throw new Error('Invalid blueprint configuration');
  }
  if (!blueprint.schema_version) {
    throw new Error('Blueprint missing schema_version');
  }
  if (!blueprint.id) {
    throw new Error('Blueprint missing id');
  }
  if (!blueprint.weights || typeof blueprint.weights !== 'object' || !Object.keys(blueprint.weights).length) {
    throw new Error('Blueprint missing LO weights');
  }
  return blueprint;
}

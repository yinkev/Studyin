declare module '*.mjs';

declare module '../../scripts/lib/schema.mjs' {
  export const SCHEMA_VERSIONS: any;
  export const schemaVersionSchema: any;
  export const evidenceRefSchema: any;
  export const itemSchema: any;
  export const blueprintSchema: any;
  export const learningObjectiveSchema: any;
  export const errorTaxonomySchema: any;
  export const engineMetadataSchema: any;
  export const attemptEventSchema: any;
  export const sessionEventSchema: any;
  export const lessonEventSchema: any;
  export function parseNdjsonLine(line: string, schema: any): any;
}

declare module '../../scripts/lib/analyzer-core.mjs' {
  export function loadAttempts(path: string, limit?: number): Promise<any[]>;
  export function summarizeAttempts(attempts: any[]): any;
}

declare module '../../scripts/lib/blueprint.mjs' {
  export function buildFormGreedy(...args: any[]): any;
  export function deriveLoTargets(...args: any[]): any;
  export function isBlueprintFeasible(...args: any[]): boolean;
}

declare module '../../scripts/jobs/refit-weekly.mjs' {
  export function runRefit(...args: any[]): Promise<void>;
}

declare module '../../../scripts/lib/exposure.mjs' {
  export function exposureMultiplier(exposure?: any): number;
  export function clampOverfamiliar(params: any): number;
}

declare module '../../../scripts/lib/fsrs.mjs' {
  export function retentionBudget(params: any): number;
  export function updateHalfLife(params: any): { halfLifeHours: number };
  export function scheduleNextReview(params: any): { nextReviewMs: number; intervalMs: number };
}

declare module '../../../scripts/lib/gpcm.mjs' {
  export function gpcmPmf(theta: number, difficulty: number, thresholds: number[] | undefined, categories: number): number[];
}

declare module '../../../scripts/lib/rasch.mjs' {
  export function eapUpdate(params: any): { thetaHat: number; se: number };
  export function masteryProbability(thetaHat: number, se: number): number;
  export function info(params: any): number;
  export function pCorrect(params: any): number;
}

declare module '../../../scripts/lib/scheduler.mjs' {
  export function thompsonSchedule(arms: any[], seed?: number): any;
}

declare module '../../../scripts/lib/selector.mjs' {
  export function utility(params: any): number;
  export function pickRandomesque(items: any[], k: number, seed?: number): { id: string; u: number } | null;
}

declare module './embedding.mjs' {
  export function generateDeterministicEmbedding(text: string): number[];
  export function cosineSimilarity(a: number[], b: number[]): number;
}

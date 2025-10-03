// Ambient module declarations for ESM .mjs modules consumed by TypeScript files.
// These are temporary shims to allow `tsc --noEmit` without converting the .mjs modules.

declare module "../../scripts/lib/schema.mjs" {
  export const SCHEMA_VERSIONS: any;
  export const schemaVersionSchema: any;
  export const evidenceRefSchema: any;
  export const itemSchema: any;
  export const blueprintSchema: any;
  export const learningObjectiveSchema: any;
  export const errorTaxonomySchema: any;
  export const attemptEventSchema: any;
  export const sessionEventSchema: any;
  export const lessonEventSchema: any;
  export const parseNdjsonLine: any;
}

declare module "../../../scripts/lib/schema.mjs" {
  export * from "../../scripts/lib/schema.mjs";
}

declare module "../../scripts/lib/analyzer-core.mjs" {
  export const loadAttempts: any;
  export const summarizeAttempts: any;
}

declare module "../../../../scripts/lib/analyzer-core.mjs" {
  export const loadAttempts: any;
  export const summarizeAttempts: any;
}

declare module "../../scripts/jobs/refit-weekly.mjs" {
  export const runRefit: any;
}

// Engine shim import targets under lib/engine/shims/** (TS files) referencing '../../../scripts/lib/*.mjs'
declare module "../../../scripts/lib/rasch.mjs" {
  export const eapUpdate: any;
  export const masteryProbability: any;
  export const info: any;
  export const pCorrect: any;
}

declare module "../../../scripts/lib/gpcm.mjs" {
  export const gpcmPmf: any;
}

declare module "../../../scripts/lib/selector.mjs" {
  export const utility: any;
  export const pickRandomesque: any;
}

declare module "../../../scripts/lib/scheduler.mjs" {
  export const thompsonSchedule: any;
}

declare module "../../../scripts/lib/exposure.mjs" {
  export const exposureMultiplier: any;
  export const clampOverfamiliar: any;
}

declare module "../../../scripts/lib/fsrs.mjs" {
  export const retentionBudget: any;
  export const updateHalfLife: any;
  export const scheduleNextReview: any;
}

// Components importing rasch directly
declare module "../scripts/lib/rasch.mjs" {
  export const masteryProbability: any;
}

// Wildcard catch-all for scripts/lib modules at any relative depth.
// Provide a superset of named exports used across the repo so TS7016 resolves.
declare module "*scripts/lib/*.mjs" {
  // schema
  export const SCHEMA_VERSIONS: any;
  export const schemaVersionSchema: any;
  export const evidenceRefSchema: any;
  export const itemSchema: any;
  export const blueprintSchema: any;
  export const learningObjectiveSchema: any;
  export const errorTaxonomySchema: any;
  export const attemptEventSchema: any;
  export const sessionEventSchema: any;
  export const lessonEventSchema: any;
  export const parseNdjsonLine: any;
  // analyzer core
  export const loadAttempts: any;
  export const summarizeAttempts: any;
  // rasch
  export const eapUpdate: any;
  export const masteryProbability: any;
  export const info: any;
  export const pCorrect: any;
  // gpcm
  export const gpcmPmf: any;
  // selector
  export const utility: any;
  export const pickRandomesque: any;
  // scheduler
  export const thompsonSchedule: any;
  // exposure
  export const exposureMultiplier: any;
  export const clampOverfamiliar: any;
  // fsrs
  export const retentionBudget: any;
  export const updateHalfLife: any;
  export const scheduleNextReview: any;
  // blueprint
  export const buildFormGreedy: any;
  export const deriveLoTargets: any;
  export const isBlueprintFeasible: any;
}

// Wildcards for other ESM utilities referenced from TS
declare module "*lib/rag/*" {
  export const generateDeterministicEmbedding: any;
  export const cosineSimilarity: any;
}

declare module "*scripts/jobs/*" {
  export const runRefit: any;
}

// Exact specifiers still unresolved under bundler resolution
// Prefer colocated .d.ts next to the .mjs files for relative specifiers. See:
//   - lib/rag/embedding.mjs.d.ts
//   - scripts/jobs/refit-weekly.mjs.d.ts
// Kept here: none

// Shims used by TS files that re-export relative .mjs modules
// lib/rag/embedding.ts → './embedding.mjs'
declare module "./embedding.mjs" {
  export const EMBEDDING_DIMENSIONS: number;
  export function generateDeterministicEmbedding(text: string, dimensions?: number): number[];
  export function cosineSimilarity(a: number[], b: number[]): number;
}

// Additional relative specifiers observed in TS/TSX
declare module "../../scripts/lib/blueprint.mjs" {
  export const buildFormGreedy: any;
  export const deriveLoTargets: any;
  export const isBlueprintFeasible: any;
}

declare module "../../scripts/lib/fsrs.mjs" {
  export const updateHalfLife: any;
  export const scheduleNextReview: any;
  export const retentionBudget: any;
}

declare module "../scripts/lib/exposure.mjs" {
  export const exposureMultiplier: any;
  export const clampOverfamiliar: any;
}

declare module "../scripts/lib/fsrs.mjs" {
  export const updateHalfLife: any;
  export const scheduleNextReview: any;
}

declare module "../scripts/lib/gpcm.mjs" { export const gpcmPmf: any; }
declare module "../scripts/lib/rasch.mjs" {
  export const eapUpdate: any;
  export const masteryProbability: any;
  export const info: any;
  export const pCorrect: any;
}
declare module "../scripts/lib/scheduler.mjs" { export const thompsonSchedule: any; }
declare module "../scripts/lib/selector.mjs" {
  export const utility: any;
  export const pickRandomesque: any;
}

// Non-scripts: lib rag embedding used by API search (for TS7016 only)
// Handled by lib/rag/embedding.mjs.d.ts.

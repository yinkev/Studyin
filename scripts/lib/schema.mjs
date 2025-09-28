import { z, ZodError } from 'zod';

/**
 * Shared schema versions for cross-script compatibility.
 */
export const SCHEMA_VERSIONS = Object.freeze({
  item: '1.0.0',
  blueprint: '1.0.0',
  learningObjective: '1.0.0',
  errorTaxonomy: '1.0.0',
  attemptEvent: '1.0.0',
  sessionEvent: '1.0.0'
});

const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[\w.-]+)?$/;

export const schemaVersionSchema = z.string().regex(semver, 'schema_version must be semver');

export const evidenceRefSchema = z.object({
  file: z.string().min(1),
  page: z.number().int().positive(),
  figure: z.string().min(1).optional(),
  bbox: z
    .tuple([
      z.number().min(0),
      z.number().min(0),
      z.number().min(0),
      z.number().min(0)
    ])
    .refine(([x0, y0, x1, y1]) => x1 > x0 && y1 > y0, {
      message: 'bbox must be [x0,y0,x1,y1] with x1>x0 and y1>y0'
    })
    .optional(),
  cropPath: z.string().min(1).optional(),
  citation: z.string().min(1).optional(),
  source_url: z.string().url().optional(),
  dpi: z.number().positive().optional(),
  rotation: z.enum(['0', '90', '180', '270']).transform(Number).optional()
});

export const choicesSchema = z.object({
  A: z.string().min(1),
  B: z.string().min(1),
  C: z.string().min(1),
  D: z.string().min(1),
  E: z.string().min(1)
});

export const itemSchema = z.object({
  schema_version: schemaVersionSchema.default(SCHEMA_VERSIONS.item),
  id: z.string().min(1),
  stem: z.string().min(1),
  choices: choicesSchema,
  key: z.enum(['A', 'B', 'C', 'D', 'E']),
  rationale_correct: z.string().min(1),
  rationale_distractors: z.record(z.enum(['A', 'B', 'C', 'D', 'E']), z.string().min(1)),
  los: z.array(z.string().min(1)).nonempty(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  bloom: z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate']),
  evidence: evidenceRefSchema,
  tags: z.array(z.string().min(1)).optional(),
  status: z.enum(['draft', 'review', 'published']),
  rubric_score: z.number().min(0).max(3).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  source_sha256: z.string().length(64).optional(),
  evidence_sha256: z.string().length(64).optional(),
  author_ids: z.array(z.string().min(1)).optional(),
  reviewer_ids: z.array(z.string().min(1)).optional()
});

export const blueprintSchema = z.object({
  schema_version: schemaVersionSchema.default(SCHEMA_VERSIONS.blueprint),
  id: z.string().min(1),
  weights: z.record(z.number().nonnegative())
});

export const learningObjectiveSchema = z.object({
  schema_version: schemaVersionSchema.default(SCHEMA_VERSIONS.learningObjective),
  id: z.string().min(1),
  label: z.string().min(1),
  parent: z.string().min(1).optional()
});

export const learningObjectivesDocumentSchema = z.object({
  schema_version: schemaVersionSchema,
  learning_objectives: z.array(learningObjectiveSchema.omit({ schema_version: true })).nonempty()
});

export const errorTaxonomySchema = z.object({
  schema_version: schemaVersionSchema.default(SCHEMA_VERSIONS.errorTaxonomy),
  categories: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      description: z.string().min(1).optional(),
      related_choices: z.array(z.string().min(1)).optional()
    })
  )
});

export const attemptEventSchema = z.object({
  schema_version: schemaVersionSchema.default(SCHEMA_VERSIONS.attemptEvent),
  app_version: z.string().min(1),
  session_id: z.string().min(1),
  user_id: z.string().min(1),
  item_id: z.string().min(1),
  lo_ids: z.array(z.string().min(1)).nonempty(),
  ts_start: z.number().int().nonnegative(),
  ts_submit: z.number().int().nonnegative(),
  duration_ms: z.number().nonnegative(),
  mode: z.enum(['learn', 'exam', 'drill', 'spotter']),
  choice: z.enum(['A', 'B', 'C', 'D', 'E']),
  correct: z.boolean(),
  confidence: z.enum(['1', '2', '3']).transform(Number).optional(),
  opened_evidence: z.boolean(),
  flagged: z.boolean().optional(),
  rationale_opened: z.boolean().optional(),
  keyboard_only: z.boolean().optional(),
  device_class: z.enum(['mobile', 'tablet', 'desktop']).optional(),
  net_state: z.enum(['online', 'offline']).optional(),
  paused_ms: z.number().nonnegative().optional(),
  hint_used: z.boolean().optional()
});

export const sessionEventSchema = z.object({
  schema_version: schemaVersionSchema.default(SCHEMA_VERSIONS.sessionEvent),
  app_version: z.string().min(1),
  session_id: z.string().min(1),
  user_id: z.string().min(1),
  mode: attemptEventSchema.shape.mode,
  blueprint_id: z.string().min(1).optional(),
  start_ts: z.number().int().nonnegative(),
  end_ts: z.number().int().nonnegative().optional(),
  completed: z.boolean().optional(),
  mastery_by_lo: z.record(z.number()).optional()
});

/**
 * Helper to parse NDJSON safely.
 */
export function parseNdjsonLine(line, schema) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    return schema.parse(parsed);
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof ZodError) {
      if (process.env.DEBUG_NDJSON === '1') {
        console.warn('Skipping invalid NDJSON line', trimmed, error);
      }
      return null;
    }
    throw error;
  }
}

/**
 * Convenience type exports for JSDoc consumers.
 * @typedef {import('zod').infer<typeof itemSchema>} Item
 * @typedef {import('zod').infer<typeof blueprintSchema>} Blueprint
 * @typedef {import('zod').infer<typeof learningObjectiveSchema>} LearningObjective
 * @typedef {import('zod').infer<typeof learningObjectivesDocumentSchema>} LearningObjectivesDocument
 * @typedef {import('zod').infer<typeof errorTaxonomySchema>} ErrorTaxonomy
 * @typedef {import('zod').infer<typeof attemptEventSchema>} AttemptEvent
 * @typedef {import('zod').infer<typeof sessionEventSchema>} SessionEvent
 */

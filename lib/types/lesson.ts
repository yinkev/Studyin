import { z } from 'zod';

export const lessonDifficultySchema = z.enum(['easy', 'medium', 'hard']);

export const lessonHeadingBlockSchema = z.object({
  type: z.literal('heading'),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  text: z.string().min(1)
});

export const lessonTextBlockSchema = z.object({
  type: z.literal('text_block'),
  text: z.string().min(1)
});

const lessonChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1)
});

export const lessonRationaleSchema = z.object({
  correct: z.string().min(1).optional(),
  distractors: z.record(z.string().min(1)).optional()
});

export const lessonMultipleChoiceBlockSchema = z.object({
  type: z.literal('multiple_choice_question'),
  id: z.string().min(1),
  learningObjective: z.string().min(1),
  stem: z.string().min(1),
  choices: z.array(lessonChoiceSchema).min(1),
  correctChoice: z.string().min(1),
  rationale: lessonRationaleSchema.optional()
});

export const lessonFigureBlockSchema = z.object({
  type: z.literal('figure'),
  caption: z.string().min(1),
  asset: z.object({
    path: z.string().min(1),
    alt: z.string().min(1)
  }),
  attribution: z.string().optional()
});

export const lessonCalloutBlockSchema = z.object({
  type: z.literal('callout'),
  tone: z.enum(['default', 'success', 'warning', 'danger']).default('default'),
  title: z.string().optional(),
  body: z.string().min(1)
});

export const lessonContentBlockSchema = z.discriminatedUnion('type', [
  lessonHeadingBlockSchema,
  lessonTextBlockSchema,
  lessonMultipleChoiceBlockSchema,
  lessonFigureBlockSchema,
  lessonCalloutBlockSchema
]);

export const lessonAnimationBeatSchema = z.object({
  beat: z.number().int().nonnegative(),
  duration_s: z.number().positive(),
  narration: z.string().min(1),
  visual: z.string().min(1)
});

export const interactiveLessonSchema = z
  .object({
    schema_version: z.string().min(1).default('1.0.0'),
    id: z.string().min(1),
    lo_id: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    tags: z.array(z.string().min(1)).default([]),
    source_file: z.string().min(1).optional(),
    sourceFile: z.string().min(1).optional(),
    high_yield: z.array(z.string().min(1)).default([]),
    pitfalls: z.array(z.string().min(1)).default([]),
    animation_timeline: z.array(lessonAnimationBeatSchema).default([]),
    content: z.array(lessonContentBlockSchema).default([]),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    metadata: z.record(z.unknown()).optional()
  })
  .passthrough()
  .superRefine((value, ctx) => {
    if (value.content.length) {
      const hasMcq = value.content.some((block) => block.type === 'multiple_choice_question');
      if (!hasMcq) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'InteractiveLesson.content must include at least one multiple choice question to support assessment loops.'
        });
      }
    }
  });

export type LessonAnimationBeat = z.infer<typeof lessonAnimationBeatSchema>;
export type LessonContentBlock = z.infer<typeof lessonContentBlockSchema>;
export type LessonHeadingBlock = z.infer<typeof lessonHeadingBlockSchema>;
export type LessonTextBlock = z.infer<typeof lessonTextBlockSchema>;
export type LessonMultipleChoiceBlock = z.infer<typeof lessonMultipleChoiceBlockSchema>;
export type LessonFigureBlock = z.infer<typeof lessonFigureBlockSchema>;
export type LessonCalloutBlock = z.infer<typeof lessonCalloutBlockSchema>;
export type InteractiveLesson = z.infer<typeof interactiveLessonSchema>;

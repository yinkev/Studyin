import { z } from 'zod';
import {
  engineMetadataSchema,
  lessonEventSchema,
  attemptEventSchema,
  sessionEventSchema
} from '../../lib/core/schemas';
import type { LearnerState } from '../../lib/server/study-state';
import { interactiveLessonSchema } from '../../lib/types/lesson';

const eventMetaShape = {
  id: z.string().uuid().optional(),
  ts: z
    .number()
    .int()
    .nonnegative()
    .default(() => Date.now())
} as const;

export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);
export const ChoiceSchema = z.enum(['A', 'B', 'C', 'D', 'E']);

export const StudyAttemptInputSchema = z.object({
  learnerId: z.string(),
  sessionId: z.string().optional(),
  appVersion: z.string().optional(),
  itemId: z.string(),
  loIds: z.array(z.string()).nonempty(),
  difficulty: DifficultySchema,
  choice: ChoiceSchema,
  correct: z.boolean(),
  durationMs: z.number().nonnegative().optional(),
  openedEvidence: z.boolean().optional(),
  engine: engineMetadataSchema.optional()
});
export type StudyAttemptInput = z.infer<typeof StudyAttemptInputSchema>;

export const RetentionReviewInputSchema = z.object({
  learnerId: z.string(),
  sessionId: z.string().optional(),
  appVersion: z.string().optional(),
  itemId: z.string(),
  loIds: z.array(z.string()),
  correct: z.boolean(),
  engine: engineMetadataSchema.optional()
});
export type RetentionReviewInput = z.infer<typeof RetentionReviewInputSchema>;

export type EngineMetadata = z.infer<typeof engineMetadataSchema>;

export interface StudyAttemptResult {
  learnerState: LearnerState;
}

export interface RetentionReviewResult {
  learnerState: LearnerState;
}

export const answerSubmittedEventSchema = StudyAttemptInputSchema.extend({
  ...eventMetaShape,
  type: z.literal('ANSWER_SUBMITTED')
});

export const saveLessonRequestedEventSchema = z.object({
  ...eventMetaShape,
  type: z.literal('SAVE_LESSON_REQUESTED'),
  lesson: interactiveLessonSchema,
  source: z.enum(['upload', 'worker', 'external']).default('upload'),
  requestId: z.string().uuid().optional()
});

export const lessonCreatedEventSchema = z.object({
  ...eventMetaShape,
  type: z.literal('LESSON_CREATED'),
  lesson: interactiveLessonSchema,
  jobId: z.string().optional(),
  durationMs: z.number().nonnegative().optional()
});

export const stateUpdatedEventSchema = z.object({
  ...eventMetaShape,
  type: z.literal('STATE_UPDATED'),
  learnerId: z.string(),
  state: z.custom<LearnerState>((value) => typeof value === 'object' && value !== null, {
    message: 'state must be a learner state object'
  }),
  reason: z.enum(['attempt', 'review', 'migration', 'external']).default('attempt')
});

export const uploadEnqueuedEventSchema = z.object({
  ...eventMetaShape,
  type: z.literal('UPLOAD_ENQUEUED'),
  fileName: z.string(),
  fileSize: z.number().int().nonnegative(),
  jobId: z.string(),
  profile: z.enum(['lesson', 'evidence']).default('lesson')
});

export const jobCompletedEventSchema = z.object({
  ...eventMetaShape,
  type: z.literal('JOB_COMPLETED'),
  jobId: z.string(),
  result: z.enum(['success', 'failure']),
  error: z.string().optional()
});

export const engineDecisionEventSchema = z.object({
  ...eventMetaShape,
  type: z.literal('ENGINE_DECISION'),
  learnerId: z.string(),
  sessionId: z.string(),
  itemId: z.string().optional(),
  loIds: z.array(z.string()).default([]),
  rationale: z.record(z.unknown()).optional(),
  selector: z.record(z.unknown()).optional()
});

export const stopRuleTriggeredEventSchema = z.object({
  ...eventMetaShape,
  type: z.literal('STOP_RULE_TRIGGERED'),
  learnerId: z.string(),
  loId: z.string(),
  rule: z.string(),
  thetaHat: z.number(),
  se: z.number()
});

export const appEventSchema = z.discriminatedUnion('type', [
  answerSubmittedEventSchema,
  saveLessonRequestedEventSchema,
  lessonCreatedEventSchema,
  stateUpdatedEventSchema,
  uploadEnqueuedEventSchema,
  jobCompletedEventSchema,
  engineDecisionEventSchema,
  stopRuleTriggeredEventSchema
]);

export type AppEvent = z.infer<typeof appEventSchema>;
export type AnswerSubmittedEvent = z.infer<typeof answerSubmittedEventSchema>;
export type SaveLessonRequestedEvent = z.infer<typeof saveLessonRequestedEventSchema>;
export type LessonCreatedEvent = z.infer<typeof lessonCreatedEventSchema>;
export type StateUpdatedEvent = z.infer<typeof stateUpdatedEventSchema>;
export type UploadEnqueuedEvent = z.infer<typeof uploadEnqueuedEventSchema>;
export type JobCompletedEvent = z.infer<typeof jobCompletedEventSchema>;
export type EngineDecisionEvent = z.infer<typeof engineDecisionEventSchema>;
export type StopRuleTriggeredEvent = z.infer<typeof stopRuleTriggeredEventSchema>;

export { lessonEventSchema, attemptEventSchema, sessionEventSchema };

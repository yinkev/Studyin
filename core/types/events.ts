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

export interface EngineSelectorSignals {
  item_id?: string;
  lo_ids?: string[];
  info?: number;
  blueprint_multiplier?: number;
  exposure_multiplier?: number;
  fatigue_scalar?: number;
  median_seconds?: number;
  theta_hat?: number;
  se?: number;
  mastery_probability?: number;
  reason?: string;
}

export interface EngineSchedulerSignals {
  lo_id?: string;
  sample?: number;
  score?: number;
  blueprint_multiplier?: number;
  urgency?: number;
  reason?: string;
}

export interface EngineRetentionSignals {
  minutes?: number;
  fraction?: number;
  max_days_overdue?: number;
  reason?: string;
}

export interface EngineMetadata {
  selector?: EngineSelectorSignals;
  scheduler?: EngineSchedulerSignals;
  retention?: EngineRetentionSignals;
  notes?: string;
}

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

export interface StudyAttemptInput {
  learnerId: string;
  sessionId?: string;
  appVersion?: string;
  itemId: string;
  loIds: [string, ...string[]];
  difficulty: z.infer<typeof DifficultySchema>;
  choice: z.infer<typeof ChoiceSchema>;
  correct: boolean;
  durationMs?: number;
  openedEvidence?: boolean;
  engine?: EngineMetadata;
}

export const RetentionReviewInputSchema = z.object({
  learnerId: z.string(),
  sessionId: z.string().optional(),
  appVersion: z.string().optional(),
  itemId: z.string(),
  loIds: z.array(z.string()),
  correct: z.boolean(),
  engine: engineMetadataSchema.optional()
});

export interface RetentionReviewInput {
  learnerId: string;
  sessionId?: string;
  appVersion?: string;
  itemId: string;
  loIds: string[];
  correct: boolean;
  engine?: EngineMetadata;
}

export interface StudyAttemptResult {
  learnerState: LearnerState;
}

export interface RetentionReviewResult {
  learnerState: LearnerState;
}

export interface AttemptEvent {
  schema_version: string;
  app_version: string;
  session_id: string;
  user_id: string;
  item_id: string;
  lo_ids: string[];
  ts_start: number;
  ts_submit: number;
  duration_ms: number;
  mode: 'learn' | 'exam' | 'drill' | 'spotter';
  choice: 'A' | 'B' | 'C' | 'D' | 'E';
  correct: boolean;
  confidence?: number;
  opened_evidence: boolean;
  flagged?: boolean;
  rationale_opened?: boolean;
  keyboard_only?: boolean;
  device_class?: 'mobile' | 'tablet' | 'desktop';
  net_state?: 'online' | 'offline';
  paused_ms?: number;
  hint_used?: boolean;
  engine?: EngineMetadata;
}

export interface SessionEvent {
  schema_version: string;
  app_version: string;
  session_id: string;
  user_id: string;
  mode: 'learn' | 'exam' | 'drill' | 'spotter';
  blueprint_id?: string;
  start_ts: number;
  end_ts?: number;
  completed?: boolean;
  mastery_by_lo?: Record<string, number>;
  engine?: EngineMetadata;
}

export const answerSubmittedEventSchema = StudyAttemptInputSchema.extend({
  ...eventMetaShape,
  type: z.literal('ANSWER_SUBMITTED')
});

export interface AnswerSubmittedEvent extends StudyAttemptInput {
  type: 'ANSWER_SUBMITTED';
  id?: string;
  ts: number;
}

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

export interface StateUpdatedEvent {
  type: 'STATE_UPDATED';
  id?: string;
  ts: number;
  learnerId: string;
  state: LearnerState;
  reason: 'attempt' | 'review' | 'migration' | 'external';
}

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
export type SaveLessonRequestedEvent = z.infer<typeof saveLessonRequestedEventSchema>;
export type LessonCreatedEvent = z.infer<typeof lessonCreatedEventSchema>;
export type UploadEnqueuedEvent = z.infer<typeof uploadEnqueuedEventSchema>;
export type JobCompletedEvent = z.infer<typeof jobCompletedEventSchema>;
export type EngineDecisionEvent = z.infer<typeof engineDecisionEventSchema>;
export type StopRuleTriggeredEvent = z.infer<typeof stopRuleTriggeredEventSchema>;

export { lessonEventSchema, attemptEventSchema, sessionEventSchema };

import { z } from 'zod';
import { LearnerState } from '../../lib/server/study-state';

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
  openedEvidence: z.boolean().optional()
});
export type StudyAttemptInput = z.infer<typeof StudyAttemptInputSchema>;

export const RetentionReviewInputSchema = z.object({
  learnerId: z.string(),
  sessionId: z.string().optional(),
  appVersion: z.string().optional(),
  itemId: z.string(),
  loIds: z.array(z.string()),
  correct: z.boolean()
});
export type RetentionReviewInput = z.infer<typeof RetentionReviewInputSchema>;

export interface StudyAttemptResult {
  learnerState: LearnerState;
}

export interface RetentionReviewResult {
  learnerState: LearnerState;
}

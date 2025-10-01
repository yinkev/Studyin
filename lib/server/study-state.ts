import { z } from 'zod';

export interface LearnerLoState {
  attempts: number;
  correct: number;
  recentSes?: number[];
  consecutiveCorrect?: number;
  scheduledAt?: string;
}

export interface LearnerItemState {
  attempts: number;
  correct: number;
  lastAttemptTs?: number;
  recentAttempts?: number[];
}

export interface RetentionCardState {
  stability: number;
  dueAt?: string;
  intervalMinutes?: number;
  lastReviewedAt?: string;
}

export interface LearnerState {
  learnerId: string;
  updatedAt: string;
  los: Record<string, LearnerLoState>;
  items: Record<string, LearnerItemState>;
  retention: Record<string, RetentionCardState>;
}

export const learnerLoStateSchema = z.object({
  attempts: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(),
  recentSes: z.array(z.number().int()).optional(),
  consecutiveCorrect: z.number().int().nonnegative().optional(),
  scheduledAt: z.string().optional()
});

export const learnerItemStateSchema = z.object({
  attempts: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(),
  lastAttemptTs: z.number().int().optional(),
  recentAttempts: z.array(z.number().int()).optional()
});

export const retentionCardStateSchema = z.object({
  stability: z.number(),
  dueAt: z.string().optional(),
  intervalMinutes: z.number().optional(),
  lastReviewedAt: z.string().optional()
});

export const learnerStateSchema = z.object({
  learnerId: z.string(),
  updatedAt: z.string(),
  los: z.record(learnerLoStateSchema),
  items: z.record(learnerItemStateSchema),
  retention: z.record(retentionCardStateSchema)
});

export function createEmptyLearnerState(learnerId: string): LearnerState {
  const now = new Date().toISOString();
  return {
    learnerId,
    updatedAt: now,
    los: {},
    items: {},
    retention: {}
  };
}

export function normaliseLearnerState(partial: Partial<LearnerState>, learnerId: string): LearnerState {
  const base = createEmptyLearnerState(learnerId);
  return {
    learnerId,
    updatedAt: partial.updatedAt ?? base.updatedAt,
    los: partial.los ?? base.los,
    items: partial.items ?? base.items,
    retention: partial.retention ?? base.retention
  };
}

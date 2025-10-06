'use server';

import { z } from 'zod';
import { StudyAttemptInput, lessonEventSchema } from '../../core/types/events';
import { ExecuteStudyAttempt } from '../../core/use-cases/executeStudyAttempt';
import { ExecuteRetentionReview } from '../../core/use-cases/executeRetentionReview';
import { JsonLearnerStateRepository } from '../../services/state/jsonRepository';
import { LocalTelemetryService } from '../../services/telemetry/localTelemetry';
import { appendLesson } from '../../lib/server/events';

const learnerStateRepository = new JsonLearnerStateRepository();
const telemetryService = new LocalTelemetryService();

const executeStudyAttempt = new ExecuteStudyAttempt({
  repository: learnerStateRepository,
  telemetry: telemetryService
});

const executeRetentionReview = new ExecuteRetentionReview({
  repository: learnerStateRepository,
  telemetry: telemetryService
});

export async function submitStudyAttempt(payload: StudyAttemptInput) {
  return executeStudyAttempt.execute(payload);
}

export async function submitRetentionReview(payload: {
  learnerId: string;
  sessionId?: string;
  appVersion?: string;
  itemId: string;
  loIds: string[];
  correct: boolean;
}) {
  return executeRetentionReview.execute(payload);
}

export async function submitLessonEvent(payload: z.infer<typeof lessonEventSchema>) {
  const parsed = lessonEventSchema.parse(payload);
  return appendLesson(parsed);
}

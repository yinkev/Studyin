import { attemptEventSchema, sessionEventSchema } from 'lib/core/schemas';
import {
  STOP_RULES,
  scoreCandidates,
  selectNextItem,
  scheduleNextLo,
  shouldStopLo,
  computeRetentionBudget,
  buildWhyThisNext,
  runEapUpdate,
  type CandidateItem,
  type CandidateScore,
  type SelectionResult,
  type ThompsonArm,
  type ThompsonResult,
  type LoState,
  type LearnerLoState,
  rasch
} from '../../lib/study-engine';
import {
  loadLearnerState,
  saveLearnerState,
  updateLearnerLoState,
  recordItemExposure,
  type LearnerState
} from '../../lib/server/study-state';

async function writeAttemptDefault(event: AttemptEvent) {
  const { appendAttempt } = await import('../../lib/server/events');
  await appendAttempt(event);
}

async function writeSessionDefault(event: SessionEvent) {
  const { appendSession } = await import('../../lib/server/events');
  await appendSession(event);
}

type AttemptEvent = ReturnType<typeof attemptEventSchema.parse>;
type SessionEvent = ReturnType<typeof sessionEventSchema.parse>;

export interface EngineTelemetry {
  writeAttempt(event: AttemptEvent): Promise<void>;
  writeSession(event: SessionEvent): Promise<void>;
}

const defaultTelemetry: EngineTelemetry = {
  writeAttempt: writeAttemptDefault,
  writeSession: writeSessionDefault
};

export async function logAttemptEvent(event: AttemptEvent, telemetry: EngineTelemetry = defaultTelemetry) {
  const parsed = attemptEventSchema.parse(event);
  await telemetry.writeAttempt(parsed);
}

export async function logSessionEvent(event: SessionEvent, telemetry: EngineTelemetry = defaultTelemetry) {
  const parsed = sessionEventSchema.parse(event);
  await telemetry.writeSession(parsed);
}

export {
  STOP_RULES,
  scoreCandidates,
  selectNextItem,
  scheduleNextLo,
  shouldStopLo,
  computeRetentionBudget,
  buildWhyThisNext,
  runEapUpdate,
  rasch,
  loadLearnerState,
  saveLearnerState,
  updateLearnerLoState,
  recordItemExposure
};

export type {
  CandidateItem,
  CandidateScore,
  SelectionResult,
  ThompsonArm,
  ThompsonResult,
  LoState,
  LearnerLoState,
  LearnerState
};

export const telemetry = defaultTelemetry;

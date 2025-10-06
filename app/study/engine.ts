import {
  attemptEventSchema,
  sessionEventSchema,
  SCHEMA_VERSIONS,
  type AttemptEvent,
  type SessionEvent
} from '../../lib/core/schemas';
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
import type { EngineMetadata } from '../../core/types/events';
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

export interface EngineTelemetry {
  writeAttempt(event: AttemptEvent): Promise<void>;
  writeSession(event: SessionEvent): Promise<void>;
}

const defaultTelemetry: EngineTelemetry = {
  writeAttempt: writeAttemptDefault,
  writeSession: writeSessionDefault
};

interface LogAttemptParams {
  event: Omit<AttemptEvent, 'schema_version' | 'app_version' | 'engine'>;
  engine?: EngineMetadata;
  appVersion?: string;
  telemetry?: EngineTelemetry;
}

export async function logAttemptEvent({
  event,
  engine,
  appVersion = '0.1.0-dev',
  telemetry = defaultTelemetry
}: LogAttemptParams) {
  const payload: AttemptEvent = {
    ...event,
    schema_version: SCHEMA_VERSIONS.attemptEvent,
    app_version: appVersion,
    engine
  };
  const parsed = attemptEventSchema.parse(payload);
  await telemetry.writeAttempt(parsed);
}

export async function logSessionEvent({
  event,
  engine,
  appVersion = '0.1.0-dev',
  telemetry = defaultTelemetry
}: {
  event: Omit<SessionEvent, 'schema_version' | 'app_version' | 'engine'>;
  engine?: EngineMetadata;
  appVersion?: string;
  telemetry?: EngineTelemetry;
}) {
  const payload: SessionEvent = { ...event, schema_version: SCHEMA_VERSIONS.sessionEvent, app_version: appVersion, engine };
  const parsed = sessionEventSchema.parse(payload);
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

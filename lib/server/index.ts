// Barrel exports for server-side utilities. Explicit lists, type-safe, no side effects.

// events.ts
export {
  telemetryEnabled,
  requireAuthToken,
  rateLimit,
  validateBodySize,
  parseAttemptEvent,
  parseSessionEvent,
  parseLessonEvent,
  appendAttempt,
  appendSession,
  appendLesson,
  clientFingerprint,
  constants
} from "./events";

// forms.ts
export { BlueprintDeficitError, buildExamForm } from "./forms";
export type { ExamItem, BuildExamFormOptions, ExamForm } from "./forms";

// study-state.ts
export {
  createDefaultLoState,
  loadLearnerState,
  saveLearnerState,
  updateLearnerLoState,
  recordItemExposure,
  getLearnerStatePath
} from "./study-state";
export type { RetentionCard, LearnerState } from "./study-state";

// supabase.ts (optional; only active when env flags enable it)
export {
  getSupabaseAdmin,
  insertAttemptRow,
  insertSessionRow,
  fetchAttempts,
  insertSnapshot,
  fetchEvidenceChunks
} from "./supabase";


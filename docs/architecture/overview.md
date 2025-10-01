# Studyin Architecture Overview (Proposed Modular Refactor)

## Goals
- **Deterministic adaptive engine** with clear separation between domain logic (Rasch/FSRS/TS), orchestration, and persistence.
- **Composable services** so storage/telemetry can change (JSON → Supabase) without touching domain logic.
- **Predictable UI** that calls typed use-cases; server/client responsibilities are explicit and testable.
- **Auditability & operations**: refit jobs, analytics, and dashboards rely on shared contracts and emit structured logs.

## Layering Strategy

```
/core
  /domain          # Pure business logic (math, scheduling, retention)
  /types           # Zod schemas + TypeScript types for all contracts
  /use-cases       # Stateless orchestrators (study attempt, retention review, scheduler) consuming domain + services

/services
  /state           # Persistence adapters (JSON, Supabase)
  /telemetry       # Attempt/session logging
  /analytics       # Scripts (analyze.mjs, refit) reusing core/domain functions

/ui
  /app             # Next.js routes/components/hooks (Study, Summary, Drill, Exam)
  /components
  /hooks

/scripts          # CLI jobs reusing /core and /services
/tests            # Unit + integration tests organized by layer
```

## Use-Case Contracts (examples)

```ts
// core/types/useCase.ts
export interface UseCase<Input, Output> {
  execute(input: Input): Promise<Output>;
}

// core/types/events.ts (Zod)
export const StudyAttemptInputSchema = z.object({
  learnerId: z.string(),
  sessionId: z.string(),
  itemId: z.string(),
  loIds: z.array(z.string()),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  \u2026
});
export type StudyAttemptInput = z.infer<typeof StudyAttemptInputSchema>;
export interface StudyAttemptResult { learnerState: LearnerState; signals: StudySignals; }
```

### Example: `ExecuteStudyAttempt`
- Validate input via schema.
- Load learner state using injected persistence adapter.
- Run Rasch update via domain functions.
- Apply FSRS/retention hand-off rules.
- Persist new state + log telemetry.
- Return state + signals for UI.

## Storage/Persistence Interfaces

```ts
export interface LearnerStateRepository {
  load(learnerId: string): Promise<LearnerState>;
  save(state: LearnerState): Promise<void>;
}

export interface TelemetryService {
  recordAttempt(event: AttemptEvent): Promise<void>;
  recordSession?(event: SessionEvent): Promise<void>;
}
```

Adapters implement these using JSON (current) or Supabase (future). Use-cases receive adapters via constructor injection to keep tests pure.

## Analytics & Jobs
- `analyze.mjs` becomes a composition of `loadEvents` (services), `summarizeAttempts` (core/domain), and `writeSummary` (services/analytics).
- `refit-weekly.mjs` uses core/domain functions to compute summary and writes to storage via adapters.

## UI Integration
- Components call use-cases via Next.js actions or API routes, receiving typed results. Example: the Study view dispatches `executeStudyAttempt` and `executeRetentionReview`.
- React Query/SWR can wrap these actions for caching and optimistic updates.

## Testing Strategy
- Unit tests target domain functions (+ use-cases with mock adapters).
- Service tests ensure adapters handle file/DB operations.
- Integration tests ensure Next.js actions wire adapters correctly.
- Snapshot tests for analytics outputs & dashboards.

## Migration Plan
1. Implement `core/types` (`LearnerState`, `StudyAttemptInput`, `RetentionReviewInput`), minimal use-case interface, JSON repository adapter.
2. Refactor `submitStudyAttempt` & `submitRetentionReview` to use new use-cases. Keep existing directories until all actions migrate.
3. Move Rasch/FSRS helpers into `/core/domain/adaptive` with tests.
4. Update scripts to import from `/core` and `/services` instead of `/lib` (with barrel files for compatibility).
5. Gradually adopt new structure for other flows (Drill, Exam, analytics).

## Observability & Ops
- All use-cases emit structured logs (level, learnerId, useCase, duration).
- `@acme/logger` (or pino) configured once in services; silent in tests.
- Weekly GitHub Action triggers refit use-case, uploads artifact. Optional: n8n workflow hitting `/api/jobs/refit` endpoint.

## Future Enhancements
- Supabase adapter implementing `LearnerStateRepository`.
- Event sourcing pipeline (append-only events + derived state).
- Domain-driven analytics (retention trends, blueprint drift) via core/domain functions.
- Gating features (multi-tenant modules, real-time notifications) once persistent store is shared.


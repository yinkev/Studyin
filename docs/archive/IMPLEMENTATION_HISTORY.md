> ## Archived Implementation Plan (Superseded by Phase 1 MVP)
> 
> *The following content is preserved for historical context. The official implementation plan for the current development cycle is detailed in the blueprint above.*
> 
> # Personal Adaptive Study Engine — Implementation Plan
> 
> Consensus Deltas (2025-10-06)
> - Confirm server action integration: keep `app/study/actions.ts` as the single entry for attempts/reviews; no new route needed beyond `/api/attempts` and `/api/search`.
> - Add optional `engine` metadata to attempt/session events (schema v1.1.0) and propagate through `services/telemetry/*` and `lib/server/events.ts` without breaking analyzer.
> - Keep shims (`lib/engine/shims/**`) as the only runtime import surface for `scripts/lib/*.mjs`.
> - Add dynamic module picker in Study UI to detect banks under `content/banks/**` and scope dashboards/scheduler/retention to the selected module. Merge base blueprint with optional `config/blueprint-dev.json` in dev to include new LOs.
> - `/upload` dev-only flow: gated by `NEXT_PUBLIC_DEV_UPLOAD=1`; sanitize filenames; Automator handler accepts only `studyin-cli://process?file=<name>` and builds the CLI command locally. Generated content must pass validator before inclusion.

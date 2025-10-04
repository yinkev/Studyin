# Modularization Plan — Studyin Module Arcade

Date: 2025-10-03
Owners: Implementation Strategist, AnalyticsEngineer, UIBuilder, ProjectManager

This plan applies MCP Context7 best practices to harden module boundaries, make dependencies explicit and enforceable, and keep the system deterministic (no runtime LLM/API calls) while improving maintainability and performance.

## Principles (Source of Truth)
- Determinism: No runtime LLM/API calls; seeded RNG only (AGENTS.md:127–132).
- Architecture boundaries: Core → Engine → Server → UI; Analytics CLI is separate; UI must not import `scripts/lib/*.mjs` (README.md:46–72).
- Path aliases as contracts: `@core`, `@engine`, `@server`, `@analytics`, `@ui` (tsconfig.json:33–42).
- CI order remains deterministic: validate → test → analyze → build (README.md:115–119).
- Performance budgets: TTI <2 s, item render <100 ms, evidence <250 ms, CLS <0.1 (AGENTS.md:11–12, 111–119).

## 1) Current Architecture Map (with citations)

| Layer | Responsibilities | Key Entrypoints (file:lines) |
| --- | --- | --- |
| Core | Shared schemas/types and pure helpers; imports stdlib only (README.md:48–52). | core/types/events.ts:1–37 (bridge re‑exports live at lib/core/schemas.ts:1–13 for legacy imports) |
| Engine | Deterministic logic via TS facade + shims. | lib/study-engine.ts:1–19, 271–279; lib/engine/index.ts:4–17; lib/engine/why.ts:1–17; lib/engine/constants/stop-rules.ts:1–7 |
| Analytics CLI | Deterministic scripts/analyzers writing JSON. | scripts/analyze.mjs:10–19; scripts/validate-items.mjs:1–22; scripts/lib/selector.mjs:1–44; scripts/lib/scheduler.mjs:1–46; scripts/lib/rasch.mjs:1–104; scripts/lib/gpcm.mjs:1–29; scripts/lib/fsrs.mjs:1–34; scripts/lib/exposure.mjs:1–26 |
| Server | Telemetry/events/forms/state behind barrel. | lib/server/index.ts:3–22; lib/server/events.ts:1–20; lib/server/forms.ts:1–8 |
| UI | App Router pages/components consuming barrels; composes “Why this next”. | components/StudyView.tsx:1–12, 200–218 |
| RAG | Deterministic evidence indexing/recall. | README.md:105–114 |
| Evidence | Validator and content pipelines. | scripts/validate-items.mjs:1–22; README.md:98–104 |
| Telemetry | NDJSON sink + toggles and rate limiting. | lib/server/events.ts:9–20 |

Module graph
```
Core (@core) ─┐
              ├─> Engine (@engine)
Analytics CLI (@analytics) ─┘   │
                                 ├─> Server (@server)
                                 │      └─> App API routes / server actions
UI (@ui) <───────────────────────┘
Evidence → Validator → Analytics JSON → UI (read-only)
RAG (scripts/rag) → Server (search)
```

## 2) Target Module Boundaries & Public Interfaces
- Core (`@core/*` → `core/*`): stdlib-only; publish `core/index.ts`.
- Engine (`@engine` → `lib/engine/index.ts`): pure APIs from `lib/engine/index.ts:4–17`; why-text (lib/engine/why.ts:1–17); stop rules (lib/engine/constants/stop-rules.ts:1–7).
- Analytics CLI (`@analytics/*`): CLI-only `.mjs` consumed through shims or JSON (README.md:55–57).
- Server (`@server` → `lib/server/index.ts:3–22`): events/forms/state; optional Supabase.
- UI (`@ui/*`): consumes barrels only; never `scripts/lib/*.mjs` (README.md:61–66).

Public API snapshots
- Engine: `difficultyToBeta`, `scoreCandidates`, `selectNextItem`, `scheduleNextLo`, `shouldStopLo`, `computeRetentionBudget`, `buildWhyThisNext`, `buildThompsonArms`, `buildRetentionQueue`, `STOP_RULES`, `rasch`, `runEapUpdate` (lib/engine/index.ts:4–17).
- Server: events/form exports (lib/server/index.ts:3–22) with parsers/writers (lib/server/events.ts:1–20) and form builder (lib/server/forms.ts:1–8).
- Analytics: `scripts/analyze.mjs:10–19` → `public/analytics/latest.json` contract.

## 3) Dependency Rules & Enforcement
TS path contracts — tsconfig.json:33–42 defines `@core`, `@engine`, `@server`, `@analytics`, `@ui`.

Import rules table (allowed/forbidden)
| From → To | Allowed | Examples | Enforcement |
| --- | --- | --- | --- |
| Core → any runtime | No (except stdlib) | `core/*` only | ESLint boundaries; review checklist |
| Engine → Core | Yes | `@core/*` | Lint allowlist; path alias only |
| Engine → Analytics CLI | No at runtime | — | Use `lib/engine/shims/**` (lib/study-engine.ts:1–9); AGENTS.md:127–132 |
| Server → Engine | Yes | `@engine` barrel | Lint pattern ^@engine; ban deep engine paths |
| Server → UI | No | — | Boundaries plugin |
| UI → Engine/Server/Core | Yes via barrels | `@engine`, `@server` | Ban `scripts/lib/*.mjs` imports (README.md:55–66) |
| UI → Analytics CLI | No | — | Import ban + CI grep |

ESLint boundaries (to add)
- Block `scripts/lib/*.mjs` outside `lib/engine/shims/**`.
- Require alias imports over deep relatives when a barrel exists.
- Forbid reverse edges: Core→Engine/Server/UI; Engine→UI; Server→UI.

Example (.eslintrc.cjs)
```js
module.exports = {
  plugins: ['import'],
  overrides: [
    {
      files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
      excludedFiles: ['lib/engine/shims/**'],
      rules: {
        'no-restricted-imports': ['error', {
          patterns: [
            // Block scripts/analytics anywhere in UI or lib (except shims via excludedFiles)
            'scripts/**',
            'scripts/lib/**',
            '@analytics/*',
            { group: ['../scripts/**', '../../scripts/**', '../../../scripts/**'], message: 'Use engine shims or public barrels; UI/lib cannot import scripts.' },
            // Block absolute deep engine paths from UI; require @engine barrel
            'lib/engine/**',
            'lib/engine/shims/**',
            { group: ['../lib/engine/**', '../../lib/engine/**', '../../../lib/engine/**'], message: 'Use @engine barrel (see tsconfig.json:33–42). UI must not import engine internals or shims.' }
          ]
        }],
        'import/no-restricted-paths': ['error', {
          zones: [
            // UI cannot import scripts or engine internals (including shims)
            { target: './scripts', from: './app' },
            { target: './scripts', from: './components' },
            { target: './lib/engine', from: './app' },
            { target: './lib/engine', from: './components' },
            { target: './lib/engine/shims', from: './app' },
            { target: './lib/engine/shims', from: './components' },
            // lib (except shims) cannot import scripts/lib
            { target: './scripts/lib', from: './lib', except: ['./lib/engine/shims'] }
          ]
        }]
      }
    },
    {
      files: ['**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': ['error', {
          patterns: [
            { group: ['../lib/engine/**', '../../lib/engine/**', '../../../lib/engine/**'], message: 'Use @engine/* alias (see tsconfig.json:33–42).' }
          ]
        }]
      }
    },
    { files: ['lib/engine/shims/**'], rules: { 'no-restricted-imports': 'off' } }
  ]
};
```

### Dependency graph checks (madge / dependency-cruiser)
Use either tool (or both) in CI to validate boundaries.

Dependency‑cruiser config (example `.dependency-cruiser.js`)
```js
module.exports = {
  forbidden: [
    { name: 'no-app-to-scripts', from: { path: '^app/' }, to: { path: '^scripts/' } },
    { name: 'no-components-to-scripts', from: { path: '^components/' }, to: { path: '^scripts/' } },
    { name: 'no-lib-to-scriptslib', from: { path: '^lib/(?!engine/shims)' }, to: { path: '^scripts/lib/' } },
    { name: 'no-server-to-scriptslib', from: { path: '^lib/server' }, to: { path: '^scripts/lib/' } }
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    includeOnly: '^(app|components|lib|scripts|core)/'
  }
};
```

Example commands
```bash
npx dependency-cruiser --config .dependency-cruiser.js --validate "app/**" "components/**" "lib/**" "scripts/**" "core/**"
npx madge --ts-config tsconfig.json --extensions ts,tsx --circular app components lib scripts core
```

TypeScript project references (guidance)
- Split per domain: `tsconfig.core.json`, `tsconfig.engine.json` (refs core), `tsconfig.server.json` (refs engine+core), `tsconfig.ui.json` (refs server+engine). Keep CLI in ESM `.mjs` for determinism.

## 4) Incremental Migration & Shims
1. Guardrails-first: add ESLint boundary rules and an `import-lint` CI step; snapshot deterministic scheduler/selector outputs.
2. Stabilize barrels: ensure `@engine`/`@server` cover all runtime needs; provide deprecated re-exports to reduce churn (lib/engine/index.ts:4–17; lib/server/index.ts:3–22).
3. Analytics adapters: a tiny server-only loader reads `public/analytics/latest.json` (scripts/analyze.mjs:10–19) and returns typed DTOs.
4. Telemetry strategy: abstract file vs. Supabase writers behind the current API (lib/server/events.ts:1–20) and add contract tests.
5. Codemods: replace deep relatives with aliases; forbid new violations via pre-commit.
6. Docs: update README/PLAN with any new public APIs; keep SOP gates in sync.

## 5) CI/Testing Updates & Gates
- Preserve order `validate → test → analyze → build` (README.md:115–119).
- Determinism: seed-based snapshot tests for `selectNextItem` and `thompsonSchedule` (lib/study-engine.ts; scripts/lib/scheduler.mjs:1–46).
- Analytics checksum: hash `public/analytics/latest.json` after `analyze` step (scripts/analyze.mjs:10–19).
- Perf budgets: assert TTI <2 s, item render <100 ms, evidence <250 ms, CLS <0.1 (AGENTS.md:11–12, 111–119).
  Note: `.lighthouseci/` artifacts remain in the repo for developer audits, but Lighthouse is not an enforced CI gate. Web Vitals are the authoritative performance gate unless CI/workflows explicitly re‑enable Lighthouse.

## 6) Risks & Mitigations
- Boundary drift → Lint + CI block; barrels mandatory in review (README.md:68–71).
- Determinism regressions → Seed audits + snapshot tests (README.md:89–97).
- Telemetry breakage → Contract tests for FS/Supabase (lib/server/events.ts:9–20).
- Performance regressions → Lightweight Web Vitals gate; feature flags for backout.
- Migration churn → Adapters + deprecations; automated codemods.

## 7) Phased Roadmap & Alternatives
Phase A — Guardrails First (Weeks 1–2)
- ESLint boundaries, import-lint CI, engine/server barrel audit, seed snapshot tests.

Phase B — Facade Hardening (Weeks 3–4)
- Analytics loader, telemetry strategy, missing adapters; unit/integration tests.

Phase C — UI Consumption Cleanup (Weeks 5–6)
- Replace residual deep imports, simplify props/actions; validate budgets + analytics determinism.

Alternatives
- In‑place boundaries (recommended now): lowest risk, minimal churn; relies on lint + code review.
- Workspaces (next): packages/{core,engine,server,ui,analytics-cli}; stronger isolation; more tooling.
- Extract engine package (later): versioned reuse; requires stricter adapters and release flow.

## MCP Context7 Notes
- Align PRs to AGENTS.md Architecture Gates (AGENTS.md:127–132). Include Context7 citation blocks for any external docs.

---
Next agent: ProjectManager · Model: gpt-5-codex-high · Scope: PLAN.md docs/** (link this doc, add milestone)

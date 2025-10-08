# NPM Scripts Reference

This document explains the key scripts in `package.json`, expected ports, and any environment variables.

- `dev` — Runs the dev server and opens a browser.
  - Spawns `dev:start` and `dev:open` in parallel via `npm-run-all`.
- `dev:start` — Starts Next.js on `http://localhost:3005`.
- `dev:open` — Waits for `http://localhost:3005` to be ready, then opens a browser.
  - Respects `DEV_URL` (defaults set by the script invocation).
- `build` — Production build (`next build`).
- `start` — Start the production server (`next start`).
- `test` — Run Vitest unit tests with `--run`.
- `test:e2e` — Run Playwright end‑to‑end tests headless.
- `test:e2e:ui` — Run Playwright with the test UI.
- `validate:items` — Validate item content per Studyin schema.
- `analyze` — Generate analytics to `public/analytics/latest.json`.
- `score:rubric` — Compute rubric scores and emit `public/analytics/rubric-score.json`.
- `pm:pulse` — Weekly pulse helper for PM workflows.
- `pm:close-superseded` — Cleanup helper for stale/superseded PRs.
- `mcp:inspector` — Launch MCP inspector against Codex MCP server.
- `mcp:devtools` — Connect Chrome DevTools MCP to the running dev app at `http://localhost:3005`.

Notes
- Dev‑only routes: `/upload` guarded by `NEXT_PUBLIC_DEV_UPLOAD=1`.
- No runtime LLM calls are used in production; analytics remain deterministic.

# CLI Scripts Reference

Run with `npm run <script>`.

## validate:items

Validates content items and evidence references.

```
npm run validate:items
```

Env flags:
- `REQUIRE_EVIDENCE_CROP=0` — temporarily allow missing crops (dev only)

## analyze

Generates analytics snapshots (deterministic) into `public/analytics/latest.json`.

```
npm run analyze
```

## dev / dev:start

Starts Next.js dev server on port 3005 and opens the app.

```
npm run dev
# or
npm run dev:start
```

## build / start

Builds and runs the production server.

```
npm run build
npm run start
```

## test

Runs unit tests (Vitest).

```
npm test
```

## test:e2e

Runs Playwright end‑to‑end tests.

```
npm run test:e2e
```

## score:rubric

Computes rubric score and writes `public/analytics/rubric-score.json`.

```
npm run score:rubric
```

## pm:pulse

Lightweight weekly pulse for the Project Manager role.

```
npm run pm:pulse
```


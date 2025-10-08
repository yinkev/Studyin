# Local‑First Architecture

Studyin defaults to local computation and storage. This maximizes privacy, speed, and reliability, while allowing optional cloud mirroring.

## Why Local‑First

- Privacy: user study data stays on device by default
- Performance: no network round‑trip in the learning loop
- Reliability: study works offline; sync is optional

## Data Model

- Lessons and state persisted as JSON files under `data/`
- Telemetry written to `data/events.ndjson` (pseudonymous)
- Optional Supabase mirroring via the ingest helpers

## Cloud Optionality

- `USE_SUPABASE_INGEST` disabled by default
- When enabled, only minimal telemetry mirrors to Supabase with RLS
- No runtime LLM/API calls in scoring; cloud services are never required to study


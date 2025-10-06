# Changelog

## 2025-10-06

- Added strong TypeScript interfaces for study and retention events, eliminating `unknown` payloads when parsing schemas.
- Introduced `types/scripts-modules.d.ts` and `types/animejs.d.ts` to document and type deterministic script exports and UI animation helpers.
- Hardened `/api/search` typing and sanitation logic, ensuring evidence chunks return typed LO arrays.
- Updated adaptive study flows and services to consume the new engine metadata shapes.

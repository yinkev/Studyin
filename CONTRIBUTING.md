# Contributing to Studyin

## Development Setup

### Prerequisites
- Node.js 20.14+
- npm 9+

### Install & Run
```
git clone https://github.com/yourusername/studyin.git
cd studyin
npm install
npm run dev
```

## Project Standards

### Code Quality
- TypeScript: strict mode, no `any` without justification
- Formatting: Prettier (auto-format on save)
- Linting: ESLint
- Tests: Vitest (unit), Playwright (E2E)

### Architecture Layers
```
UI Layer (components/, app/)
  ↓ may import
Server Layer (lib/server/)
  ↓ may import
Engine Layer (lib/engine/)
  ↓ may import
Core Layer (lib/core/)
```

Rule: Lower layers cannot import from higher layers.

### Determinism Policy
- No runtime LLM/API calls in engines
- Seeded RNG only (reproducible)
- No `Date.now()` in scoring logic

## Pull Request Process

1. Branch: create from `main` (e.g., `feat/new-feature`)
2. Test: `npm test && npm run build`
3. Commit: Conventional commits (`feat:`, `fix:`, `docs:`)
4. PR: Use the template, link issues
5. Review: Address feedback
6. Merge: Squash & merge

### PR Template
See .github/PULL_REQUEST_TEMPLATE.md

## Testing

```
npm test              # Unit tests (Vitest)
npm run test:e2e      # E2E tests (Playwright)
npm run build         # Verify build passes
```

## Need Help?

- Architecture Overview: docs/architecture/overview.md
- API Reference: docs/reference/api-routes.md
- Open an issue


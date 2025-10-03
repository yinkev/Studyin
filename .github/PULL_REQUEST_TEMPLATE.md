## Summary
- [ ] Purpose and scope clearly described
- [ ] Relevant screenshots/video (if UI change)
- [ ] PRD/IMPLEMENTATION updated for significant feature changes

## Gates (check when satisfied)
- [ ] `npm run validate:items`
- [ ] `npm test -- --run`
- [ ] `npm run analyze`
- [ ] Lighthouse budgets (TTI < 2s, FCP < 2s, TBT < 200 ms, CLS < 0.1)
- [ ] A11y audited (non‑blocking during OKC phase; note any known issues)
- [ ] Rubric score meets thresholds (attach `public/analytics/rubric-score.json`)

## Citations & Determinism
- [ ] MCP citations included (Context7 resolve→fetch→cite; see `docs/WORKFLOW.md`)
- [ ] No runtime LLMs introduced; deterministic behavior unchanged

## Evidence
- [ ] Evidence crops committed (Git LFS) with `{file,page,(bbox|cropPath),citation}`
- [ ] Item status updated (`draft` → `review` or `published`)

## Regression Risk
- [ ] Manual QA performed (list flows)
- [ ] Rollback plan documented

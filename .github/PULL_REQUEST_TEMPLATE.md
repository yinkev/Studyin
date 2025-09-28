## Summary
- [ ] Purpose and scope clearly described
- [ ] Relevant screenshots/video (if UI change)

## Gates (check when satisfied)
- [ ] `npm run validate:items`
- [ ] `npm test -- --run`
- [ ] `npm run analyze`
- [ ] axe automated checks (no critical issues)
- [ ] Lighthouse budgets (TTI < 2s, LCP < 2.5s, INP < 200ms, CLS < 0.1, bundle budget)
- [ ] Rubric score ≥ 92 with ★ ≥ 2.8 (attach output)

## Evidence
- [ ] Evidence crops committed (Git LFS) with `{file,page,(bbox|cropPath),citation}`
- [ ] Item status updated (`draft` → `review` or `published`)

## Regression Risk
- [ ] Manual QA performed (list flows)
- [ ] Rollback plan documented

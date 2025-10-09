# Maintenance Schedule

## Overview

Regular maintenance tasks to keep Studyin healthy, performant, and free of technical debt.

---

## Daily (Automated via CI)

### On Every PR

```yaml
# .github/workflows/pr-checks.yml
- Build verification (npm run build)
- Test suite (npm test && npm run test:e2e)
- Type check (npx tsc --noEmit)
- Layer boundary validation
- Determinism checks (if engine changed)
```

**Manual tasks:**
- Code review (use `/mcp zen codereview`)
- Verify PR description is complete
- Check for breaking changes

---

## Weekly (Every Friday)

### Code Quality

```bash
# 1. Find and fix unused imports
npx tsc --noEmit --noUnusedLocals --noUnusedParameters 2>&1 | grep "is declared but"

# 2. Review TODOs
grep -r "TODO\|FIXME\|XXX\|HACK" --include="*.ts" --include="*.tsx" components/ lib/ app/ scripts/
# Action: Fix or remove each TODO

# 3. Check for commented code
grep -r "^[[:space:]]*//" --include="*.ts" --include="*.tsx" components/ lib/ app/ | wc -l
# If count >50, review and clean up

# 4. Remove debug statements
grep -r "console\." --include="*.ts" --include="*.tsx" components/ lib/ app/ | grep -v "console.error\|console.warn"
# Remove any found
```

### Dependencies

```bash
# Check for security vulnerabilities
npm audit

# If high/critical vulnerabilities:
npm audit fix

# Verify after fixes
npm test && npm run build
```

### Performance

```bash
# Build time check
time npm run build
# Record in spreadsheet, flag if >2x baseline

# Bundle size check
npm run build | grep "Total size"
# Record in spreadsheet, flag if +20% increase
```

### Agent-Assisted

```bash
# Weekly cleanup scan
/mcp zen thinkdeep
step: "Scan codebase for this week's technical debt accumulation"
```

---

## Bi-Weekly (Every Other Monday)

### Design System Review

```bash
# Use UI/UX Designer agent
/agent ui-ux-designer
"Review design system for consistency across all routes"
```

**Check:**
- Color consistency (Game Level palette)
- Component usage (Material Web patterns)
- Accessibility (WCAG 2.2 AAA)
- Animation performance (Motion library)

### Documentation Sync

```bash
# 1. Check if docs match code
# - API routes match docs/reference/api-routes.md
# - Design tokens match docs/architecture/design-system.md
# - Architecture matches docs/architecture/overview.md

# 2. Update examples if API changed
# 3. Fix broken links
# 4. Update timestamps
```

---

## Monthly (First Monday)

### Dependency Updates

```bash
# 1. Check outdated packages
npm outdated

# 2. Update patch versions (safe)
npm update

# 3. Test
npm test && npm run build && npm run test:e2e

# 4. For minor updates, one at a time
npm install package-name@latest
npm test && npm run build
# If passes, keep. If fails, investigate or revert.

# 5. Document major updates in CHANGELOG.md
```

### Orphaned Code Detection

```bash
# Use agent for comprehensive scan
/mcp codex codex
prompt: "Scan entire codebase for unused components, utilities, and types. Generate removal plan with verification."
config: {"approval-policy": "on-request"}

# Review findings
# Remove confirmed orphans
# Run tests after each removal
```

### Performance Audit

```bash
# 1. Profile key flows with real data
# - Study session flow
# - Dashboard load time
# - Summary page render
# - Upload pipeline

# 2. Check Next.js build output for warnings
npm run build

# 3. Lighthouse audit (if applicable)
npx lighthouse http://localhost:3005/study --view

# 4. Address any performance regressions
```

### Security Review

```bash
# 1. Run security audit
npm audit --audit-level=moderate

# 2. Check for exposed secrets
grep -r "API_KEY\|SECRET\|TOKEN" --include="*.ts" --include="*.tsx" --include="*.js" | grep -v "NEXT_PUBLIC_"

# 3. Review server-side code
/mcp zen codereview
review_type: "security"
files: ["app/api/", "lib/server/"]

# 4. Check .env files not in git
git ls-files | grep ".env"
# Should return nothing except .env.example
```

---

## Quarterly (Every 3 Months)

### Architecture Review

```bash
# 1. Use consensus for comprehensive review
/mcp zen consensus
models: [{"model": "gpt-5-codex"}, {"model": "gpt-5-pro"}]
prompt: "Review Studyin architecture for improvements, simplifications, or necessary refactorings"

# 2. Review layer boundaries
# - Are they still appropriate?
# - Any violations accumulating?
# - Should we add/remove layers?

# 3. Check module cohesion
# - Any modules grown too large?
# - Any over-coupled modules?
# - Circular dependencies introduced?

# 4. Document decisions
# Update docs/architecture/ as needed
```

### Design System Evolution

```bash
# 1. Review design trends
/agent ui-ux-designer
"Analyze current design system against 2025 trends and accessibility standards. Propose evolutions."

# 2. User feedback analysis
# - Gather accessibility complaints
# - Analyze UX pain points
# - Review user research

# 3. Plan updates
# - Token additions/changes
# - Component library updates
# - Animation system improvements

# 4. Implement incrementally
# - One change at a time
# - Test thoroughly
# - Document in design system docs
```

### Dependency Major Updates

```bash
# 1. Plan major version updates
npm outdated | grep -E "Red|Yellow"

# 2. For each major update:
# a. Read changelog/migration guide
# b. Create feature branch
# c. Update one dependency
# d. Fix breaking changes
# e. Run full test suite
# f. Create PR with migration notes

# 3. Example: Next.js major update
git checkout -b feat/nextjs-16
npm install next@latest
# Fix breaking changes
npm test && npm run build && npm run test:e2e
git commit -m "chore(deps): upgrade Next.js 15 → 16"
# Create PR with migration notes
```

### Knowledge Transfer

```bash
# 1. Update AGENTS.md with new workflows discovered
# 2. Update CLAUDE.md with new patterns learned
# 3. Document major decisions in docs/explanation/
# 4. Create runbooks for common tasks
# 5. Update onboarding documentation
```

---

## Semi-Annual (Every 6 Months)

### Comprehensive Cleanup

```bash
# 1. Use agents for full codebase analysis
/mcp zen thinkdeep
step: "Comprehensive analysis: find all unused code, dead imports, orphaned files, and inefficiencies"

/mcp zen planner
task: "Create multi-phase cleanup plan based on thinkdeep findings"

/mcp codex codex
prompt: "[Implementation plan from planner]"
config: {"approval-policy": "never"}

# 2. Verify cleanup
npm run build && npm test && npm run test:e2e

# 3. Document
# Create CLEANUP_REPORT_YYYY-MM-DD.md
```

### Full Accessibility Audit

```bash
# 1. Use UI/UX Designer agent
/agent ui-ux-designer
"Conduct comprehensive WCAG 2.2 AAA audit of entire application. Generate remediation plan."

# 2. Manual testing
# - Keyboard navigation all routes
# - Screen reader testing (VoiceOver/NVDA)
# - Color contrast verification
# - Reduced motion testing

# 3. Automated tools
npx lighthouse http://localhost:3005 --view
# Review accessibility score

# 4. Remediation
# Fix all critical issues
# Document acceptable tradeoffs
# Update accessibility statement
```

### Tech Debt Review

```bash
# 1. Review CLEANUP_REPORT_*.md files
# - What debt keeps recurring?
# - What prevention strategies worked?
# - What needs adjustment?

# 2. Update prevention strategies
# - Add CI checks for recurring issues
# - Update coding standards
# - Improve agent workflows

# 3. Team retrospective (if applicable)
# - What maintenance tasks are painful?
# - What could be automated?
# - What processes need improvement?
```

---

## Annual (Start of Year)

### Technology Evaluation

```bash
# 1. Review technology choices
/mcp zen consensus
models: [{"model": "gpt-5-codex"}, {"model": "gpt-5-pro"}]
prompt: "Evaluate Studyin tech stack against current best practices. Should we migrate any major technologies?"

# 2. Consider:
# - Is Next.js still the best choice?
# - Should we migrate to different UI library?
# - Are our psychometric algorithms state-of-art?
# - Database/storage strategy still optimal?

# 3. Document decisions
# Update docs/explanation/ with rationale
```

### Security Penetration Testing

```bash
# 1. Automated security scan
npm audit --audit-level=low
npm run build

# 2. Manual security review
# - Review authentication (if implemented)
# - Check authorization logic
# - Verify input validation
# - Test for XSS/CSRF
# - Check for sensitive data exposure

# 3. External audit (if budget allows)
# Hire security professional for penetration test
```

### Documentation Overhaul

```bash
# 1. Review all documentation
# - Is it current?
# - Are examples still valid?
# - Are best practices up to date?

# 2. Gather feedback
# - What docs are most useful?
# - What's missing?
# - What's confusing?

# 3. Update systematically
# Use Diátaxis framework principles
# Ensure tutorial → guides → reference → explanation flow

# 4. Generate new docs as needed
/mcp codex codex
prompt: "Review docs/ directory and regenerate outdated sections with current code examples"
```

---

## Metrics Dashboard

### Track Over Time

Create a spreadsheet or dashboard tracking:

| Metric | Target | Current | Trend |
|--------|--------|---------|-------|
| TS Errors | 0 | 0 | ✅ Stable |
| Build Time | <5s | 2.9s | ✅ Improving |
| Test Coverage | >80% | 85% | ✅ Stable |
| Bundle Size | <500kb | 423kb | ✅ Stable |
| Total LOC | - | 15,234 | ↓ Decreasing |
| Dependencies | <50 | 42 | ✅ Stable |
| Open TODOs | <10 | 3 | ✅ Good |
| E2E Pass Rate | 100% | 100% | ✅ Stable |

**Update frequency:** Monthly

**Alerts:**
- TS Errors >5: Immediate action
- Build Time >10s: Investigate
- Bundle Size +20%: Review changes
- Open TODOs >20: Cleanup needed

---

## Maintenance Automation

### CI/CD Pipeline

```yaml
# .github/workflows/maintenance.yml
name: Weekly Maintenance
on:
  schedule:
    - cron: '0 9 * * 5' # Every Friday at 9 AM

jobs:
  maintenance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Dependency audit
        run: npm audit --audit-level=high

      - name: Check for unused code
        run: npx tsc --noEmit --noUnusedLocals 2>&1 | tee unused.txt

      - name: Find TODOs
        run: grep -r "TODO" --include="*.ts" --include="*.tsx" . | tee todos.txt

      - name: Create maintenance issue
        if: failure()
        run: |
          gh issue create --title "Weekly Maintenance Alert" --body "See workflow logs"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Automated Alerts

Set up alerts for:
- Build failures
- Test failures
- Security vulnerabilities
- Performance regressions
- Bundle size increases >20%

---

## Emergency Procedures

### Build Broken

```bash
# 1. Identify breaking change
git log -10 --oneline

# 2. Revert if urgent
git revert <commit-hash>
git push

# 3. Fix properly
# Create feature branch
# Fix issue
# Add tests to prevent recurrence
# Create PR
```

### Tests Failing

```bash
# 1. Run locally
npm test

# 2. Check for flaky tests
npm test -- --reporter=verbose

# 3. If flaky, quarantine
# Move to separate test file
# Mark as .skip
# Create issue to fix properly

# 4. If real failure
# Fix immediately if blocking
# Or create high-priority issue
```

### Security Vulnerability

```bash
# 1. Assess severity
npm audit

# 2. If critical/high
npm audit fix
npm test && npm run build

# 3. If no auto-fix
# Research manually
# Update dependency or find alternative
# Test thoroughly
# Deploy ASAP

# 4. Document
# Add to CHANGELOG.md
# Update security policies if needed
```

---

## Resources

- [Preventing Technical Debt](preventing-technical-debt.md)
- [Architecture Modularity](../architecture/modularity.md)
- [AGENTS.md - Agent Workflows](../../AGENTS.md)
- [CLAUDE.md - Coding Standards](../../CLAUDE.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)

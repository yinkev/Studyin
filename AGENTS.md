# AI Agents Guide for Studyin

## Overview
This document explains how to use AI agents (Claude Code, Codex MCP, Zen MCP, UI/UX Designer) effectively for Studyin development.

## Available Agents

### Claude Code
- **Primary development assistant**
- **Use for:** Planning, code review, implementation, debugging
- **Location:** Interactive CLI
- **Access:** `claude-code` command

### UI/UX Designer Agent ⭐ NEW
- **Purpose:** Interface design, wireframes, design systems
- **Use for:** Design decisions, accessibility audits, component design
- **Location:** `.claude/agents/ui-ux-designer.md`
- **Access:** Use `/agent ui-ux-designer` in Claude Code
- **Specialization:** Material Design 3, Game Level color psychology, WCAG 2.2 AAA

### Zen MCP Agents

#### 1. **chat** - General Discussion
```bash
/mcp zen chat
model: "gemini-2.5-pro"
prompt: "Brainstorm approaches for implementing FSRS retention updates"
```
**Use for:** Brainstorming, getting second opinions, exploring ideas

#### 2. **thinkdeep** - Complex Analysis
```bash
/mcp zen thinkdeep
model: "gemini-2.5-pro"
step: "Analyze why Thompson Sampling favors certain LOs"
```
**Use for:** Performance optimization, security analysis, complex bugs, architecture decisions

#### 3. **planner** - Multi-Step Planning
```bash
/mcp zen planner
model: "gemini-2.5-pro"
task: "Plan migration of skill tree progression system"
```
**Use for:** Complex features, architecture decisions, migration planning, large refactors

#### 4. **consensus** - Multi-Model Decisions
```bash
/mcp zen consensus
models: [{"model": "gpt-5-codex"}, {"model": "gpt-5-pro"}]
prompt: "Evaluate storing mastery thresholds in lesson metadata vs central config"
```
**Use for:** Technology choices, design system decisions, breaking changes, feature proposals

#### 5. **codereview** - Systematic Review
```bash
/mcp zen codereview
model: "gemini-2.5-pro"
files: ["lib/engine/mastery.ts", "lib/study-engine.ts"]
focus_on: "determinism, type safety, layer boundaries"
```
**Use for:** Pre-merge validation, security audits, performance reviews, type safety checks

#### 6. **precommit** - Git Validation
```bash
/mcp zen precommit
path: "/Users/kyin/Projects/Studyin"
include_staged: true
focus_on: "determinism, blueprint compliance"
```
**Use for:** Multi-repo validation, security review, change impact assessment

#### 7. **debug** - Root Cause Analysis
```bash
/mcp zen debug
model: "gemini-2.5-pro"
problem: "Thompson Sampling selecting same LO repeatedly despite blueprint deficit"
files: ["lib/engine/shims/scheduler.ts", "lib/study-engine.ts"]
```
**Use for:** Mysterious errors, performance issues, race conditions, integration problems

### Codex MCP

**Purpose:** Autonomous code implementation

```bash
/mcp codex codex
prompt: "[Detailed implementation plan from planner]"
config: {"approval-policy": "never"}  # or "on-request", "on-failure", "untrusted"
```

**Approval Policies:**
- `never` - Full autonomy (cleanup, refactoring)
- `on-request` - Ask before destructive operations (new features)
- `on-failure` - Retry on errors without asking (exploratory work)
- `untrusted` - Ask for all shell commands (untrusted code)

---

## Agent Workflow Patterns

### Pattern 1: New Feature Development

```
┌─────────────────────────────────────┐
│ 1. UI/UX DESIGNER                   │
│    Design system-compliant UI       │
│    /agent ui-ux-designer            │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. PLANNER                          │
│    Break down implementation        │
│    /mcp zen planner                 │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. CONSENSUS (if needed)            │
│    Validate approach                │
│    /mcp zen consensus               │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. CODEX                            │
│    Implement autonomously           │
│    /mcp codex codex                 │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 5. CODEREVIEW                       │
│    Validate before merge            │
│    /mcp zen codereview              │
└─────────────────────────────────────┘
```

**Example:**
```bash
# 1. Design the UI
/agent ui-ux-designer
"Design accessible achievement badge system using Game Level palette"

# 2. Plan implementation
/mcp zen planner
task: "Add achievement badge system with XP milestones"

# 3. Get consensus on storage approach
/mcp zen consensus
models: [{"model": "gpt-5-codex"}, {"model": "gpt-5-pro"}]
prompt: "Evaluate storing badges in localStorage vs Supabase"

# 4. Implement
/mcp codex codex
prompt: "[Plan from planner]"
config: {"approval-policy": "on-request"}

# 5. Review
/mcp zen codereview
files: ["components/badges/", "lib/achievements.ts"]
```

### Pattern 2: Design System Update

```
┌─────────────────────────────────────┐
│ 1. UI/UX DESIGNER                   │
│    Research + propose changes       │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. CONSENSUS                        │
│    Validate with team               │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. CODEX                            │
│    Update tokens + components       │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. UI/UX DESIGNER                   │
│    Accessibility audit              │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 5. CODEREVIEW                       │
│    Verify compliance                │
└─────────────────────────────────────┘
```

### Pattern 3: Bug Investigation

```
┌─────────────────────────────────────┐
│ 1. DEBUG                            │
│    Root cause analysis              │
│    /mcp zen debug                   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. THINKDEEP (if complex)           │
│    Deep investigation               │
│    /mcp zen thinkdeep               │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. FIX (Claude or Codex)            │
│    Implement solution               │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. CODEREVIEW                       │
│    Validate fix                     │
└─────────────────────────────────────┘
```

### Pattern 4: Comprehensive Cleanup

```
┌─────────────────────────────────────┐
│ 1. THINKDEEP                        │
│    Analyze entire codebase          │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. PLANNER                          │
│    Create cleanup strategy          │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. CODEX (approval: never)          │
│    Execute cleanup phases           │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. PRECOMMIT                        │
│    Validate all changes             │
└─────────────────────────────────────┘
```

---

## Determinism Policy for Agents

**Critical:** All agent-generated code must respect determinism.

### Rules
✅ **DO:**
- Use seeded RNG (reproducible randomness)
- Write pure functions where possible
- Test determinism with same seed → same output

❌ **DON'T:**
- Use `Date.now()` in scoring logic
- Make runtime LLM/API calls in engines
- Use non-seeded `Math.random()`

### Verification
```bash
# After agent implementation, verify determinism
npm test -- rasch.test.ts
npm test -- selector.test.ts

# Check for violations
grep -r "Date.now()" lib/engine/
grep -r "Math.random()" lib/engine/
```

---

## Agent Best Practices

### 1. Always Verify Agent Work
```bash
# After any agent changes
npm run build          # Verify build passes
npm test               # Verify tests pass
npm run test:e2e       # Verify E2E passes
npx tsc --noEmit       # Verify types
```

### 2. Chain Agents for Complex Tasks
- **Design → Plan → Implement → Review**
- **Debug → Think → Fix → Review**
- **Research → Consensus → Implement → Validate**

### 3. Use continuation_id for Context
Agents remember conversation via `continuation_id`. Reuse to maintain context:

```bash
# First call
/mcp zen debug
# ... returns continuation_id: "abc-123"

# Continue same conversation
/mcp zen debug
continuation_id: "abc-123"
step: "Found the issue, now testing fix..."
```

### 4. Leverage UI/UX Designer Proactively
Don't wait for design issues - use proactively:

```bash
# Before implementing UI
/agent ui-ux-designer
"Review dashboard layout for cognitive load and accessibility"

# When adding new components
/agent ui-ux-designer
"Design Material Web component for lesson progress with glassmorphism"

# Regular audits
/agent ui-ux-designer
"Audit entire app for WCAG 2.2 AAA compliance"
```

---

## Common Pitfalls

### ❌ Don't
- Let agents push directly to main
- Accept agent code without review
- Use agents for security-sensitive operations without validation
- Skip testing after agent changes
- Ignore determinism violations
- Break layer boundaries (UI → Analytics)

### ✅ Do
- Use agents for repetitive tasks
- Leverage multi-agent workflows
- Keep human oversight on critical paths
- Document agent-generated changes
- Verify determinism after engine changes
- Run full test suite after major agent work

---

## Quick Reference

| Task | Agent | Command |
|------|-------|---------|
| Design new UI | UI/UX Designer | `/agent ui-ux-designer` |
| Plan feature | Planner | `/mcp zen planner` |
| Make decision | Consensus | `/mcp zen consensus` |
| Deep analysis | Thinkdeep | `/mcp zen thinkdeep` |
| Debug issue | Debug | `/mcp zen debug` |
| Code review | Codereview | `/mcp zen codereview` |
| Validate changes | Precommit | `/mcp zen precommit` |
| Implement | Codex | `/mcp codex codex` |
| Brainstorm | Chat | `/mcp zen chat` |

---

## Resources

- [Claude Code Docs](https://docs.claude.com/claude-code)
- [Zen MCP](https://github.com/zen-mcp)
- [Codex MCP](https://github.com/codex-mcp)
- [UI/UX Designer Agent](.claude/agents/ui-ux-designer.md)
- [Design System Docs](docs/architecture/design-system.md)
- [Architecture Overview](docs/architecture/overview.md)

# Changelog

> **Living Document**: Chronological record of all changes, decisions, and milestones

Last Updated: 2025-10-09

---

## Format

Each entry includes:
- **Date**: When the change occurred
- **Type**: Feature | Fix | Docs | Refactor | Architecture | Decision | Milestone
- **Phase**: Which phase (0-8)
- **Description**: What changed and why
- **Impact**: What this affects
- **Files Changed**: Relevant files
- **References**: Links to ADRs, issues, commits

---

## 2025-10-09

### Project Initialization

**Type**: Milestone
**Phase**: Planning
**Description**: Initialized Studyin project - Gamified Medical Learning Platform for USMLE Step 1 preparation.

**Key Decisions Made**:
- Psychology-first → Design → Function approach
- Soft Kawaii UI with subtle pixel accents theme
- Personal use, iterative development
- Phase-based development (no timelines)
- No Docker (local services only)
- Everything dynamic (no hardcoded values)
- Codex CLI with OAuth authentication

**User Requirements**:
- Upload lecture files
- AI determines best teaching method
- Interactive/iterative learning
- Personalized learning pathway with AI coach
- Practice MCQs representative of Step 1
- Spec-driven fullstack development

**Files Created**:
- MVP_SPECIFICATION.md
- TECH_STACK.md
- PROJECT_STRUCTURE.md
- PHASES.md
- QUICKSTART.md
- AGENTS_GUIDE.md (later superseded)

**References**: Initial planning session

---

### User Feedback: Use Current Documentation

**Type**: Architecture
**Phase**: Planning
**Description**: User requested to use context7 for current documentation instead of outdated references.

**Changes Made**:
- Researched Next.js 15 (App Router)
- Researched React 19 (new hooks, Server Components)
- Researched FastAPI latest patterns
- Researched Tailwind CSS v4
- Updated all documentation to 2025 best practices

**Impact**: All documentation now reflects current 2025 standards

**References**: ADR-004 (Next.js 15 App Router)

---

### User Feedback: No Timelines, Phase-Based Only

**Type**: Decision
**Phase**: Planning
**Description**: User explicitly stated: "I do not care for timelines. I just want phases, and todos."

**Changes Made**:
- Converted timeline-based plan to phase-based approach
- Added checkbox todos to each phase
- Removed all date estimates and deadlines
- Created completion criteria per phase

**Impact**: PHASES.md completely restructured

**Files Changed**:
- PHASES.md (major rewrite)

**References**: ADR-010 (Phase-Based Development)

---

### User Feedback: Codex CLI OAuth (No API Keys)

**Type**: Architecture
**Phase**: Planning
**Description**: User requested: "I want to use Codex-CLI in terminal authenticated by OAUTH of my account not API."

**Changes Made**:
- Researched Codex CLI OAuth authentication
- Updated all documentation to use OAuth flow
- Removed API key references
- Added OAuth setup to QUICKSTART.md

**Impact**: Authentication strategy changed across all AI integration

**Files Changed**:
- QUICKSTART.md
- PHASES.md
- TECH_STACK.md

**References**: ADR-003 (Codex CLI OAuth)

---

### User Feedback: No Docker

**Type**: Architecture
**Phase**: Planning
**Description**: User stated: "I do not want to use docker. I do not care for docker."

**Changes Made**:
- Removed all Docker references
- Created local installation instructions
- Added PostgreSQL 16 local setup
- Added Redis 7 local setup
- Added Qdrant local setup
- Documented system service management

**Impact**: Complete infrastructure approach changed

**Files Changed**:
- QUICKSTART.md (major rewrite)
- PHASES.md (Phase 0 updated)

**References**: ADR-001 (No Docker, Local Services Only)

---

### User Feedback: Everything Must Be Dynamic

**Type**: Architecture
**Phase**: Planning
**Description**: User requirement: "Everything also has to be dynamic. Not hardcoded."

**Changes Made**:
- Created Pydantic Settings pattern for backend
- Created config module pattern for frontend
- Documented good vs bad examples
- Added feature flags system
- Created dynamic prompt template system

**Impact**: All configuration strategy redesigned

**Files Changed**:
- QUICKSTART.md (added dynamic config section)
- PHASES.md (added config setup todos)

**References**: ADR-002 (Everything Dynamic, No Hardcoded Values)

**Implementation Examples**:
```python
# Backend: Pydantic Settings
class Settings(BaseSettings):
    DATABASE_URL: str  # Required from env
    XP_PER_QUESTION: int = 10  # Default, overrideable

# Frontend: Config module
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
}
```

---

### Living Documentation System Created

**Type**: Docs
**Phase**: Planning
**Description**: User requested: "I need a AGENTS.md and Claude.md I also need live documents that will update our thought and changes and reasoning."

**Files Created**:

1. **AGENTS.md** - Agent reference guide
   - Quick reference table
   - 15+ agent descriptions
   - Agent workflows
   - Phase-specific plans
   - Best practices
   - Invocation templates

2. **CLAUDE.md** - Claude Code workflows
   - Claude Code vs Codex CLI distinction
   - OAuth authentication setup
   - Usage patterns (planning, code gen, review, debug)
   - Codex CLI integration examples
   - Dynamic configuration patterns
   - Common workflows

3. **DECISIONS.md** - Architecture Decision Records
   - ADR format template
   - 10 initial decisions (ADR-001 through ADR-010)
   - Context, reasoning, alternatives, consequences
   - Implementation examples
   - Outcome tracking

4. **CHANGELOG.md** - This file
   - Chronological change tracking
   - Decision documentation
   - Impact analysis

5. **思考.md** - Reasoning and thought process
   - Design philosophy
   - Problem-solving approaches
   - Learning science integration
   - Trade-off analysis

**Impact**: Comprehensive living documentation system for ongoing development

**References**: All ADRs in DECISIONS.md

---

## Technology Stack Decisions

### Frontend Stack Finalized

**Type**: Architecture
**Phase**: Planning
**Description**: Chose modern 2025 frontend stack.

**Decisions**:
- Next.js 15 with App Router (not Pages Router)
- React 19 (Server Components, `use` hook, Suspense)
- TypeScript
- Tailwind CSS v4
- shadcn/ui component library
- Zustand + TanStack Query for state
- Socket.io Client for WebSocket
- Framer Motion for animations
- Recharts for charts/graphs

**Reasoning**: Modern, performant, 2025 best practices

**References**: ADR-004 (Next.js 15 App Router)

---

### Backend Stack Finalized

**Type**: Architecture
**Phase**: Planning
**Description**: Chose modern Python backend stack.

**Decisions**:
- FastAPI (not Django)
- Python 3.11+ with async/await
- Pydantic Settings for dynamic config
- SQLAlchemy 2.0 (async)
- Alembic for migrations
- WebSocket support built-in
- Background tasks with Redis Streams

**Reasoning**: Modern async patterns, automatic docs, type safety

**References**: ADR-006 (FastAPI Backend)

---

### Database Stack Finalized

**Type**: Architecture
**Phase**: Planning
**Description**: Chose database and caching strategy.

**Decisions**:
- PostgreSQL 16 with pgvector extension
- Redis 7 for caching and background jobs
- Qdrant (optional) for dedicated vector search
- All running locally as system services

**Reasoning**: Simpler MVP with PostgreSQL+pgvector, can add Qdrant later if needed

**References**: ADR-005 (PostgreSQL + pgvector)

---

### Spaced Repetition Algorithm Selected

**Type**: Feature
**Phase**: Planning
**Description**: Selected spaced repetition algorithm.

**Decision**: SM-2 (SuperMemo 2) algorithm

**Reasoning**:
- Well-tested since 1988
- Simple to implement
- Effective for medical learning
- Used by Anki (proven)
- Good balance of simplicity and effectiveness

**Alternatives Considered**:
- SM-17 (too complex)
- FSRS (too new, consider for v2)
- Custom algorithm (unproven)

**References**: ADR-008 (SM-2 Algorithm)

---

### UI Theme Finalized

**Type**: Design
**Phase**: Planning
**Description**: Finalized UI aesthetic.

**Decision**: Soft Kawaii UI with subtle pixel art accents

**Design Principles**:
- Psychology-first: reduce study anxiety
- Soft pastels for UI chrome
- Professional for medical content
- Rounded corners, smooth animations
- Pixel art mascot/coach
- Pixel art badges and achievements
- Clean sans-serif for medical text
- NO pixel fonts for important info

**Separation**:
- UI Chrome: Kawaii/playful
- Medical Content: Professional/clear

**References**: ADR-007 (Soft Kawaii UI)

---

## Development Approach

### Phase-Based Development Established

**Type**: Decision
**Phase**: Planning
**Description**: Established phase-based development methodology.

**Structure**:
- 8 phases (0-8)
- Checkbox todos per phase
- Completion criteria (not dates)
- Review before moving to next phase
- Living documentation updates

**Phases**:
- Phase 0: Foundation Setup
- Phase 1: Core Infrastructure
- Phase 2: Document Processing & RAG
- Phase 3: AI Coach & Learning Paths
- Phase 4: Question Generation & Assessment
- Phase 5: Spaced Repetition & Progress Tracking
- Phase 6: Gamification
- Phase 7: Polish & Optimization
- Phase 8: Deployment

**References**: ADR-010 (Phase-Based Development), PHASES.md

---

### Monorepo Structure Chosen

**Type**: Architecture
**Phase**: Planning
**Description**: Chose monorepo structure for frontend and backend.

**Structure**:
```
studyin/
├── backend/          # FastAPI
├── frontend/         # Next.js
├── docs/             # Shared docs
└── README.md
```

**Reasoning**:
- Simpler for solo development
- Easier to keep in sync
- Atomic commits across stack
- One git repo to manage

**References**: ADR-009 (Monorepo Structure)

---

## Agent Strategy

### Agent Usage Plan Created

**Type**: Docs
**Phase**: Planning
**Description**: Created comprehensive agent usage strategy.

**Key Agents by Phase**:
- Phase 0-1: dx-optimizer, backend-architect, database-architect, security-auditor
- Phase 2-3: ai-engineer, python-pro, frontend-developer, prompt-engineer
- Phase 4-6: ai-engineer, python-pro, frontend-developer, ui-ux-designer
- Phase 7-8: performance-engineer, test-automator, security-auditor, deployment-engineer

**Ongoing Agents**:
- debugger (when stuck)
- code-reviewer (before merges)
- architect-review (for decisions)

**Workflows Documented**:
- Feature development workflow
- AI feature workflow
- Quality assurance workflow

**References**: AGENTS.md, CLAUDE.md

---

## Next Steps

### Immediate Next Steps

**Status**: Planning phase ongoing

**Pending User Input**:
- Review living documentation
- Approve architecture decisions
- Confirm ready to start Phase 0

**When Ready for Phase 0**:
- [ ] Initialize Next.js 15 project
- [ ] Set up FastAPI backend
- [ ] Install PostgreSQL 16 + pgvector
- [ ] Install Redis 7
- [ ] Set up Codex CLI OAuth
- [ ] Create dynamic configuration system

**References**: PHASES.md (Phase 0 todos)

---

## Template for Future Entries

```markdown
### [Change Title]

**Type**: Feature | Fix | Docs | Refactor | Architecture | Decision | Milestone
**Phase**: 0-8
**Date**: YYYY-MM-DD
**Description**: What changed and why

**Changes Made**:
- Bullet list of changes

**Impact**: What this affects

**Files Changed**:
- file1.ext
- file2.ext

**References**: ADR-XXX, Issue #XX, Commit SHA
```

---

## Maintenance Notes

- **Update this file** whenever making changes
- **Keep entries chronological** (newest at top of section)
- **Link to ADRs** for architectural decisions
- **Be specific** about what changed and why
- **Track impact** of changes on other parts of system

---

## Changelog

### 2025-10-09
- Created CHANGELOG.md as living document
- Documented all planning phase decisions
- Established changelog format
- Added templates for future entries

---

**Remember**: This is a living document. Update it continuously as the project evolves.

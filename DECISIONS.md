# Architecture Decisions Record (ADR)

> **Living Document**: Track all major decisions, reasoning, and outcomes

Last Updated: 2025-10-09

---

## Decision Log Format

Each decision includes:
- **Date**: When decided
- **Context**: Why this decision needed
- **Decision**: What we chose
- **Reasoning**: Why we chose it
- **Alternatives**: What else we considered
- **Consequences**: What this means going forward
- **Status**: Active, Superseded, or Deprecated
- **Outcome**: Results after implementation (update later)

---

## ADR-001: No Docker, Local Services Only

**Date**: 2025-10-09
**Status**: ✅ Active
**Phase**: 0 (Foundation)

### Context
Need to decide on development environment strategy for databases and services.

### Decision
Use locally installed PostgreSQL, Redis, and Qdrant instead of Docker containers.

### Reasoning
- User explicitly requested no Docker
- Simpler for personal use project
- More control over services
- Easier debugging and monitoring
- No Docker overhead
- System services are reliable

### Alternatives Considered
1. **Docker Compose** ❌
   - Pros: Consistent environments, easy setup
   - Cons: User doesn't want Docker, additional complexity

2. **Cloud Services** ❌
   - Pros: Zero local setup
   - Cons: Cost, latency, dependency on internet

### Consequences
- **Positive**:
  - Direct access to databases
  - System integration (macOS services)
  - Lower resource usage
  - Simpler architecture

- **Negative**:
  - Manual installation required
  - Version management manual
  - Environment differences possible
  - Team setup more complex (if team grows)

### Implementation
- Document installation in QUICKSTART.md
- Use system package managers (brew, apt)
- Configure as system services

### Outcome
TBD (Update after Phase 0 complete)

---

## ADR-002: Everything Dynamic, No Hardcoded Values

**Date**: 2025-10-09
**Status**: ✅ Active
**Phase**: 0 (Foundation)

### Context
Need configuration strategy for all settings, values, and parameters.

### Decision
All configuration must be dynamic, loaded from environment variables or config files. Zero hardcoded values in codebase.

### Reasoning
- Flexibility to change without code changes
- Environment-specific config (dev, staging, prod)
- Feature flags capability
- Easier testing with different configs
- User explicitly requested this approach

### Alternatives Considered
1. **Hardcoded Defaults** ❌
   - Pros: Simpler, faster to write
   - Cons: Inflexible, requires code changes

2. **Mixed Approach** ❌
   - Pros: Balance of flexibility and simplicity
   - Cons: Inconsistent, user wants fully dynamic

### Consequences
- **Positive**:
  - Maximum flexibility
  - Easy environment switching
  - Testability improved
  - Feature flag capability
  - Configuration as code

- **Negative**:
  - More initial setup
  - Need to document all config options
  - Validation required for all configs
  - Defaults still needed

### Implementation
```python
# Backend: Pydantic Settings
class Settings(BaseSettings):
    DATABASE_URL: str  # Required from env
    XP_PER_QUESTION: int = 10  # Default, overrideable
    class Config:
        env_file = ".env"

# Frontend: Config module
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  features: {
    gamification: env.ENABLE_GAMIFICATION !== 'false'
  }
}
```

### Outcome
TBD (Update as we implement)

---

## ADR-003: Codex CLI OAuth, No API Keys

**Date**: 2025-10-09
**Status**: ✅ Active
**Phase**: 0 (Foundation)

### Context
Need to integrate LLM capabilities for RAG, AI coach, question generation.

### Decision
Use Codex CLI with OAuth authentication (ChatGPT sign-in), not manual API keys.

### Reasoning
- Simpler authentication flow
- No manual key management
- Integrated with ChatGPT account
- Persistent authentication
- Better security (no keys in code/env)
- User preference

### Alternatives Considered
1. **Direct API Keys** ❌
   - Pros: Simple integration
   - Cons: Key management, rotation, security risk

2. **Multiple LLM Providers** ❌
   - Pros: Fallback options
   - Cons: Complexity, user wants Codex CLI specifically

### Consequences
- **Positive**:
  - No key management
  - Better security
  - Simpler .env files
  - ChatGPT account integration
  - OAuth benefits (revocation, etc.)

- **Negative**:
  - Requires OAuth flow
  - Potential network dependency
  - Limited to Anthropic models

### Implementation
```bash
# One-time setup
codex  # Sign in with ChatGPT

# In code
from anthropic import Anthropic
client = Anthropic()  # Uses OAuth, no key needed
```

### Outcome
TBD (Update after Phase 2-3)

---

## ADR-004: Next.js 15 App Router (Not Pages Router)

**Date**: 2025-10-09
**Status**: ✅ Active
**Phase**: 0 (Foundation)

### Context
Choose Next.js routing strategy for frontend.

### Decision
Use Next.js 15 App Router with Server Components.

### Reasoning
- Modern approach (2025 best practice)
- Server Components for performance
- Better data fetching patterns
- Streaming and Suspense support
- Future-proof
- Recommended by Vercel

### Alternatives Considered
1. **Pages Router** ❌
   - Pros: More examples, familiar
   - Cons: Older pattern, less performant

2. **Pure React (no Next.js)** ❌
   - Pros: Simpler
   - Cons: Lose SSR, routing, optimizations

### Consequences
- **Positive**:
  - Better performance
  - Modern patterns
  - Server Components
  - Streaming UI
  - SEO benefits

- **Negative**:
  - Learning curve
  - New patterns
  - Fewer examples
  - Different mental model

### Implementation
- Use `async` Server Components
- Mix Server + Client Components appropriately
- Leverage Suspense for loading states
- Use Server Actions for mutations

### Outcome
TBD (Update after Phase 0-1)

---

## ADR-005: PostgreSQL + pgvector (Not Separate Vector DB Initially)

**Date**: 2025-10-09
**Status**: ✅ Active
**Phase**: 0-2 (Foundation & RAG)

### Context
Need vector storage for embeddings and semantic search.

### Decision
Use PostgreSQL with pgvector extension for MVP. Add dedicated Qdrant later if needed.

### Reasoning
- One database instead of two
- pgvector sufficient for MVP scale
- Simpler architecture
- Easier to setup locally
- Can migrate to Qdrant later if needed

### Alternatives Considered
1. **Qdrant from Start** ⚠️
   - Pros: Specialized vector DB, better performance
   - Cons: Additional service to manage
   - Decision: Make optional, add later

2. **Pinecone (Cloud)** ❌
   - Pros: Managed service
   - Cons: Cost, network dependency

### Consequences
- **Positive**:
  - Simpler architecture
  - One database to manage
  - Relational + vector in same DB
  - Easier transactions
  - Lower resource usage

- **Negative**:
  - May hit performance limits at scale
  - Less specialized features
  - Migration needed if scaling

### Implementation
```sql
-- Enable pgvector
CREATE EXTENSION vector;

-- Use vector column
CREATE TABLE material_chunks (
  id UUID PRIMARY KEY,
  content TEXT,
  embedding vector(1536)  -- OpenAI dimension
);

-- Vector similarity search
SELECT * FROM material_chunks
ORDER BY embedding <-> query_embedding
LIMIT 10;
```

### Migration Path
If performance becomes issue:
1. Add Qdrant alongside PostgreSQL
2. Migrate vectors gradually
3. Keep relational data in PostgreSQL
4. Use both: PostgreSQL for data, Qdrant for search

### Outcome
TBD (Update after Phase 2)

---

## ADR-006: FastAPI (Not Django) for Backend

**Date**: 2025-10-09
**Status**: ✅ Active
**Phase**: 0 (Foundation)

### Context
Choose Python web framework for backend API.

### Decision
Use FastAPI for backend API development.

### Reasoning
- Modern async/await support
- Automatic OpenAPI documentation
- Excellent performance
- Type safety with Pydantic
- WebSocket support
- Active community
- Best for API-first architecture

### Alternatives Considered
1. **Django + DRF** ❌
   - Pros: Mature, batteries-included, admin panel
   - Cons: Heavier, async less mature, overkill for API

2. **Flask** ❌
   - Pros: Simple, flexible
   - Cons: Less modern, no async, manual docs

### Consequences
- **Positive**:
  - Fast development
  - Automatic docs at /docs
  - Type safety
  - Modern patterns
  - Great performance
  - WebSocket built-in

- **Negative**:
  - Less batteries included
  - Need to choose ORM (SQLAlchemy)
  - Smaller ecosystem than Django

### Implementation
```python
from fastapi import FastAPI, WebSocket

app = FastAPI(
    title="Studyin API",
    description="Gamified Medical Learning Platform",
    version="1.0.0"
)

# Async routes
@app.get("/items")
async def get_items():
    return await db.fetch_all()

# WebSocket
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    # Real-time chat
```

### Outcome
TBD (Update after Phase 1)

---

## ADR-007: Soft Kawaii UI with Subtle Pixel Accents

**Date**: 2025-10-09
**Status**: ✅ Active
**Phase**: 0, 6 (Foundation & Gamification)

### Context
Design aesthetic and theme for the application.

### Decision
Implement Soft Kawaii UI with subtle pixel art accents, balancing playfulness with medical professionalism.

### Reasoning
- User-specified requirement
- Psychology-first: reduces study anxiety
- Gamification alignment
- Unique positioning
- Engagement enhancement

### Alternatives Considered
1. **Pure Professional Medical UI** ❌
   - Pros: Traditional, serious
   - Cons: Boring, less engaging, user doesn't want this

2. **Full Pixel Art** ❌
   - Pros: Unique, playful
   - Cons: Too casual for medical content

### Consequences
- **Positive**:
  - Unique brand identity
  - Reduces study anxiety
  - Better engagement
  - Memorable experience
  - Gamification synergy

- **Negative**:
  - Design challenge: balance cute vs professional
  - Need skilled design
  - May not appeal to everyone

### Implementation
**Color Palette**:
- Soft pastels: light blues, pinks, greens
- Accent: single saturated color for CTAs
- Medical content: high contrast, professional

**Components**:
- Rounded corners (Tailwind: `rounded-lg`, `rounded-xl`)
- Pixel art mascot/coach character
- Pixel art badges and achievements
- Smooth animations (Framer Motion)
- Clean sans-serif for medical text
- NO pixel fonts for important info

**Separation**:
- UI Chrome: Kawaii/playful
- Medical Content: Professional/clear

### Outcome
TBD (Update after UI implementation)

---

## ADR-008: SM-2 Algorithm for Spaced Repetition

**Date**: 2025-10-09
**Status**: ✅ Active
**Phase**: 5 (Progress Tracking)

### Context
Choose spaced repetition algorithm for review scheduling.

### Decision
Implement SM-2 (SuperMemo 2) algorithm for spaced repetition.

### Reasoning
- Well-tested algorithm (since 1988)
- Simple to implement
- Effective for medical learning
- Used by Anki (proven track record)
- Good balance of simplicity and effectiveness

### Alternatives Considered
1. **SM-17 (Latest SuperMemo)** ❌
   - Pros: More sophisticated
   - Cons: Complex, proprietary, overkill for MVP

2. **Custom Algorithm** ❌
   - Pros: Tailored to our needs
   - Cons: Unproven, time-consuming

3. **FSRS (Free Spaced Repetition Scheduler)** ⚠️
   - Pros: Modern, ML-based
   - Cons: More complex, newer
   - Decision: Consider for v2

### Consequences
- **Positive**:
  - Proven effectiveness
  - Simple implementation
  - Well-documented
  - Easy to explain to users

- **Negative**:
  - Not the newest algorithm
  - May need tuning for medical content

### Implementation
```python
class SM2Algorithm:
    """SuperMemo 2 implementation"""

    @staticmethod
    def calculate_next_review(
        quality: int,  # 0-5 rating
        repetition: int,
        easiness_factor: float,
        interval: int
    ) -> tuple[int, float, int]:
        """Calculate next review date"""

        # Update EF
        ef = max(1.3, easiness_factor +
                 (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

        # Update repetition and interval
        if quality >= 3:
            if repetition == 0:
                interval = 1
            elif repetition == 1:
                interval = 6
            else:
                interval = round(interval * ef)
            repetition += 1
        else:
            repetition = 0
            interval = 1

        return interval, ef, repetition
```

### Outcome
TBD (Update after Phase 5)

---

## ADR-009: Monorepo Structure (Frontend + Backend Together)

**Date**: 2025-10-09
**Status**: ✅ Active
**Phase**: 0 (Foundation)

### Context
Organize frontend and backend code repositories.

### Decision
Use monorepo structure with both frontend and backend in same repository.

### Reasoning
- Simpler for solo development
- Easier to keep in sync
- Atomic commits across stack
- Simpler documentation
- One git repo to manage

### Alternatives Considered
1. **Separate Repos** ❌
   - Pros: Clear separation, independent versioning
   - Cons: Harder to sync, more overhead for solo dev

2. **Monorepo with Workspaces** ⚠️
   - Pros: Better tooling (Turborepo, etc.)
   - Cons: Overkill for MVP
   - Decision: Consider for v2 if team grows

### Consequences
- **Positive**:
  - Simple git workflow
  - Easy to coordinate changes
  - Shared documentation
  - One CI/CD pipeline

- **Negative**:
  - Mixed dependencies
  - Larger repo size
  - Need clear folder structure

### Implementation
```
studyin/
├── backend/          # FastAPI
│   ├── app/
│   ├── tests/
│   ├── alembic/
│   └── requirements.txt
├── frontend/         # Next.js
│   ├── src/
│   ├── public/
│   ├── __tests__/
│   └── package.json
├── docs/             # Shared docs
│   ├── PHASES.md
│   ├── AGENTS.md
│   └── DECISIONS.md (this file)
└── README.md
```

### Outcome
TBD (Update after Phase 0)

---

## ADR-010: Phase-Based Development (Not Time-Based)

**Date**: 2025-10-09
**Status**: ✅ Active
**Phase**: All

### Context
Choose development methodology and planning approach.

### Decision
Use phase-based development with checkbox todos, no timelines or deadlines.

### Reasoning
- User explicitly doesn't care about timelines
- Focus on quality over speed
- Each phase has clear completion criteria
- Flexible to learning and discovery
- Reduces pressure
- Iterative refinement

### Alternatives Considered
1. **Sprint-Based (Agile)** ❌
   - Pros: Time-boxed, structured
   - Cons: User doesn't want timelines

2. **Waterfall** ❌
   - Pros: Sequential, predictable
   - Cons: Inflexible, timeline-focused

### Consequences
- **Positive**:
  - No deadline pressure
  - Quality-focused
  - Flexible to changes
  - Learn and adapt per phase
  - Better for solo dev

- **Negative**:
  - No timeline predictability
  - Could take longer
  - Need self-discipline

### Implementation
- 8 clear phases (0-8)
- Checkbox todos per phase
- Completion criteria (not dates)
- Review before moving to next phase
- Document learnings in living docs

### Outcome
TBD (Update after each phase)

---

## Future Decisions

### To Be Decided

#### TBD-001: Mobile App Strategy
**When**: Post-MVP
**Options**: React Native, Flutter, Native (iOS/Android)

#### TBD-002: Scaling Strategy
**When**: If user base grows beyond personal use
**Options**: Vertical scaling, horizontal scaling, cloud migration

#### TBD-003: Advanced Analytics
**When**: Phase 7+
**Options**: Custom, Google Analytics, Mixpanel

#### TBD-004: Community Features
**When**: Post-MVP
**Options**: Study groups, leaderboards, social features

---

## Decision Template

Copy this for new decisions:

```markdown
## ADR-XXX: Decision Title

**Date**: YYYY-MM-DD
**Status**: 🚧 Proposed | ✅ Active | ⚠️ Superseded | ❌ Deprecated
**Phase**: X

### Context
Why this decision needed

### Decision
What we chose

### Reasoning
Why we chose it

### Alternatives Considered
1. **Option A** ❌
   - Pros:
   - Cons:
   - Why rejected:

### Consequences
- **Positive**:
  -
- **Negative**:
  -

### Implementation
Code/config examples

### Outcome
TBD (Update after implementation)
```

---

## Changelog

### 2025-10-09
- Created DECISIONS.md
- Added ADR-001 through ADR-010
- Established decision format
- Added template for future decisions

---

**Remember**: Update this document when making architectural decisions. Include reasoning, alternatives, and outcomes.

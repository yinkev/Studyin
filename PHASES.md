# Development Phases - Gamified Medical Learning Platform

## Phase-Based Implementation Plan

> **No timelines.** Each phase has clear todos. Complete one phase before moving to the next.

---

## Phase 0: Foundation Setup

**Goal**: Get the development environment running

### Todos:
- [ ] Initialize Next.js 15 project with App Router
- [ ] Set up Tailwind CSS v4 + shadcn/ui
- [ ] Initialize FastAPI backend with Python 3.11+
- [ ] Install and configure PostgreSQL 16 locally (with pgvector)
- [ ] Install and configure Redis 7 locally
- [ ] Install and configure Qdrant locally (optional for MVP)
- [ ] Set up Codex CLI OAuth authentication (no API keys!)
- [ ] Create git repository and initial commit
- [ ] Configure ESLint + Prettier + Ruff
- [ ] Create dynamic .env configuration files
- [ ] Set up config.py with Pydantic Settings (no hardcoded values!)
- [ ] Create frontend config system (all from env vars)

**Completion Criteria**:
- `pnpm dev` runs Next.js frontend successfully
- `uvicorn app.main:app --reload` runs FastAPI backend successfully
- PostgreSQL, Redis running locally (no Docker)
- Can sign in to Codex CLI with ChatGPT OAuth
- All configuration is dynamic (loaded from .env)
- No hardcoded values in codebase

---

## Phase 1: Core Infrastructure

**Goal**: Authentication, database models, basic API structure

### Frontend Todos:
- [ ] Create authentication pages (login, register)
- [ ] Implement NextAuth.js with JWT
- [ ] Build dashboard layout with navigation
- [ ] Add client-side state management (Zustand)
- [ ] Set up TanStack Query for API calls

### Backend Todos:
- [ ] Implement JWT authentication endpoints
- [ ] Create SQLAlchemy models (User, Material, Progress, etc.)
- [ ] Set up Alembic migrations
- [ ] Build base repository pattern
- [ ] Create health check and status endpoints
- [ ] Configure CORS and security middleware

**Completion Criteria**:
- User can register and log in
- JWT tokens are issued and validated
- Database migrations run successfully
- API documentation auto-generated at `/docs`

---

## Phase 2: Document Processing & RAG

**Goal**: Upload materials, process them, create vector embeddings

### Backend Todos:
- [ ] Create file upload endpoint (FastAPI UploadFile)
- [ ] Implement document parser (PDF, DOCX, TXT)
- [ ] Build semantic chunking system (512 tokens, 128 overlap)
- [ ] Integrate Codex CLI for embeddings via OAuth (no API keys)
- [ ] Set up Qdrant collections and indexing
- [ ] Create background job system (Redis Streams)
- [ ] Build semantic search endpoint

### Frontend Todos:
- [ ] Build drag-and-drop upload component
- [ ] Show upload progress and processing status
- [ ] Display material library with cards
- [ ] Add search functionality for materials

**Completion Criteria**:
- Can upload PDF and get it processed
- Documents are chunked and embedded
- Semantic search returns relevant chunks
- Processing happens in background without blocking

---

## Phase 3: AI Coach & Learning Paths

**Goal**: Use Codex CLI to generate personalized learning paths and coach interactions

### Backend Todos:
- [ ] Integrate Codex CLI for AI generation (OAuth, not API keys)
- [ ] Build learning path generation algorithm
- [ ] Create skill tree data structure
- [ ] Implement adaptive difficulty system
- [ ] Build WebSocket handler for real-time sessions
- [ ] Create prompt templates for medical teaching
- [ ] Implement context injection from RAG

### Frontend Todos:
- [ ] Build skill tree visualization component
- [ ] Create interactive learning session UI
- [ ] Implement WebSocket client for real-time chat
- [ ] Add streaming response display
- [ ] Build content card components
- [ ] Show AI Coach mascot with animations

**Completion Criteria**:
- AI generates learning path from uploaded materials
- Skill tree displays with locked/unlocked nodes
- Can have interactive conversation with AI Coach via WebSocket
- Responses stream in real-time
- Context from RAG is injected into prompts

---

## Phase 4: Question Generation & Assessment

**Goal**: AI-generated MCQs with NBME-style formatting

### Backend Todos:
- [ ] Build MCQ generation with Codex CLI
- [ ] Create question validation and quality scoring
- [ ] Implement question bank storage
- [ ] Build quiz session management
- [ ] Create answer evaluation logic
- [ ] Generate detailed explanations for all options

### Frontend Todos:
- [ ] Build quiz interface with timer
- [ ] Create question card component
- [ ] Add confidence rating input
- [ ] Display feedback with explanations
- [ ] Show quiz summary and analytics
- [ ] Build question bank browser

**Completion Criteria**:
- Can generate NBME-style questions from content
- Questions have 4-5 options with explanations
- Quiz sessions track answers and timing
- Feedback is detailed and educational

---

## Phase 5: Spaced Repetition & Progress Tracking

**Goal**: SM-2 algorithm, progress analytics, review scheduling

### Backend Todos:
- [ ] Implement SM-2 spaced repetition algorithm
- [ ] Build review scheduling system
- [ ] Create progress calculation logic
- [ ] Build analytics aggregation queries
- [ ] Implement mastery level calculation
- [ ] Create "due reviews" endpoint

### Frontend Todos:
- [ ] Build progress dashboard with charts
- [ ] Show due reviews section
- [ ] Display mastery indicators per topic
- [ ] Create streak calendar component
- [ ] Build analytics charts (Recharts)
- [ ] Add progress export functionality

**Completion Criteria**:
- Reviews are scheduled using SM-2
- Dashboard shows due reviews daily
- Progress metrics are accurate
- Charts display learning trends

---

## Phase 6: Gamification

**Goal**: XP, levels, achievements, streaks, rewards

### Backend Todos:
- [ ] Build XP calculation system
- [ ] Create level progression logic
- [ ] Implement streak tracking
- [ ] Design achievement unlock conditions
- [ ] Create virtual currency system
- [ ] Build reward redemption logic

### Frontend Todos:
- [ ] Create XP bar component
- [ ] Build level badge display
- [ ] Implement streak counter with animations
- [ ] Design achievement showcase
- [ ] Build rewards shop UI
- [ ] Add avatar/mascot customization

**Completion Criteria**:
- XP is awarded for study activities
- Levels increase based on XP thresholds
- Streaks track daily engagement
- Achievements unlock and display
- Users can customize avatar with earned rewards

---

## Phase 7: Polish & Optimization

**Goal**: Performance, UX refinement, testing

### Frontend Todos:
- [ ] Optimize bundle size and code splitting
- [ ] Implement proper loading states everywhere
- [ ] Add error boundaries and fallbacks
- [ ] Ensure responsive design (mobile, tablet, desktop)
- [ ] Implement dark mode
- [ ] Add micro-interactions and animations
- [ ] Accessibility audit (WCAG 2.1 AA)

### Backend Todos:
- [ ] Optimize database queries (N+1, indexes)
- [ ] Implement caching strategy (Redis)
- [ ] Add rate limiting per user
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Configure error tracking (Sentry)
- [ ] Write comprehensive tests (pytest)

### Testing Todos:
- [ ] Unit tests for critical functions
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user workflows (Playwright)
- [ ] Load testing for concurrent users
- [ ] Security audit and penetration testing

**Completion Criteria**:
- Page load time < 2s
- API response time < 500ms (p95)
- No console errors or warnings
- Works on mobile and desktop
- Test coverage > 80%
- Security vulnerabilities addressed

---

## Phase 8: Deployment

**Goal**: Production deployment and monitoring

### Infrastructure Todos:
- [ ] Set up production environment (Railway/Render/VPS)
- [ ] Configure environment variables
- [ ] Set up SSL certificates (Let's Encrypt)
- [ ] Configure CDN for static assets (Cloudflare)
- [ ] Set up database backups
- [ ] Configure log aggregation

### Deployment Todos:
- [ ] Create production Dockerfile
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Configure auto-deployment on merge to main
- [ ] Set up staging environment
- [ ] Create deployment rollback procedure
- [ ] Document deployment process

### Monitoring Todos:
- [ ] Set up uptime monitoring
- [ ] Configure performance monitoring
- [ ] Set up error alerting
- [ ] Create admin dashboard
- [ ] Document operational procedures

**Completion Criteria**:
- Application is live and accessible
- Monitoring dashboards are operational
- Backups run automatically
- CI/CD deploys changes automatically
- Alerts notify of issues

---

## Post-MVP: Future Enhancements

### Potential Next Phases:
- Mobile app (React Native or Flutter)
- Community features (study groups, leaderboards)
- Video content integration
- Flashcard mode
- Voice interaction with AI coach
- Collaborative note-taking
- Anki integration
- Multi-user support (classes, institutions)
- Advanced analytics (predictive modeling)

---

## Key Technologies

### Frontend Stack:
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **State**: Zustand + TanStack Query
- **Real-time**: Socket.io Client
- **Charts**: Recharts
- **Animations**: Framer Motion

### Backend Stack:
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 16 (pgvector)
- **Cache**: Redis 7
- **Vector DB**: Qdrant
- **ORM**: SQLAlchemy 2.0 (async)
- **Migrations**: Alembic
- **Background Jobs**: Redis Streams

### AI Integration:
- **Primary**: Codex CLI (OAuth authentication, not API keys)
- **Embeddings**: Via Codex CLI
- **RAG**: Qdrant + semantic search

---

## Development Workflow

### Starting Development:
```bash
# Terminal 1: Start backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# Terminal 2: Start frontend
cd frontend && pnpm dev

# Terminal 3: Run Codex CLI when needed
codex  # Uses OAuth, no API keys

# Note: PostgreSQL and Redis run as system services
# macOS: brew services list
# Linux: systemctl status postgresql redis
```

### Before Each Phase:
1. Review phase goals and todos
2. Create feature branch: `git checkout -b phase-N-feature-name`
3. Mark todos as you complete them
4. Test thoroughly before moving to next phase
5. Merge to main when phase complete

### Testing Each Phase:
```bash
# Backend tests
cd backend && pytest tests/ -v

# Frontend tests
cd frontend && pnpm test

# E2E tests
cd frontend && pnpm test:e2e
```

---

## Notes

- **No Timelines**: Work at your own pace. Quality > Speed.
- **Iterative**: Each phase builds on previous phases.
- **Flexible**: Adjust todos as you learn and discover issues.
- **Codex CLI**: Uses OAuth sign-in with ChatGPT, no manual API keys.
- **Testing**: Test after every major feature, not just at end.
- **Documentation**: Update docs as you implement.

**Remember**: This is a learning platform built with learning principles. Apply those same principles to your development process.

# Implementation Plan
# StudyIn - Gamified Medical Learning Platform

> **Master Plan**: Detailed implementation roadmap with milestones and checklists

**Version**: 1.0
**Last Updated**: 2025-10-09
**Status**: Planning Phase Complete → Ready for Phase 0
**Related Docs**: PRD.md, TECH_SPEC.md, PHASES.md, DESIGN_SYSTEM.md

---

## Executive Summary

**Current Status**: 📋 Planning Complete
**Next Action**: 🚀 Begin Phase 0 (Foundation Setup)
**Total Phases**: 9 (0-8)
**Estimated Duration**: 19-26 weeks (quality over speed, no hard deadlines)

**Key Milestones**:
1. ✅ Planning & Documentation (Week 0) - COMPLETE
2. ⏳ Phase 0: Foundation Setup (Weeks 1-3)
3. Phase 1: Core Infrastructure (Weeks 4-7)
4. Phase 2: Document Processing & RAG (Weeks 8-10)
5. Phase 3: AI Coach & Learning Paths (Weeks 11-14)
6. Phase 4: Question Generation (Weeks 15-17)
7. Phase 5: Spaced Repetition & Progress (Weeks 18-19)
8. Phase 6: Gamification (Weeks 20-22)
9. Phase 7: Polish & Optimization (Weeks 23-25)
10. Phase 8: Deployment (Week 26)

---

## Planning Phase (Week 0) ✅ COMPLETE

### Completed Deliverables

- [x] MVP_SPECIFICATION.md - Initial vision document
- [x] TECH_STACK.md - Technology decisions
- [x] PROJECT_STRUCTURE.md - Directory organization
- [x] PHASES.md - Phase-based development plan
- [x] QUICKSTART.md - Setup guide (no Docker)
- [x] AGENTS.md - Agent usage reference
- [x] CLAUDE.md - Claude Code workflows
- [x] DECISIONS.md - Architecture Decision Records (10 ADRs)
- [x] CHANGELOG.md - Change tracking
- [x] 思考.md - Design reasoning and philosophy
- [x] DESIGN_SYSTEM.md - Soft Kawaii Brutalist UI system
- [x] PRD.md - Product Requirements Document
- [x] TECH_SPEC.md - Technical specifications
- [x] IMPLEMENTATION_PLAN.md - This document

### Key Decisions Made

1. **No Docker** - Local services (PostgreSQL, Redis, Qdrant)
2. **Everything Dynamic** - Pydantic Settings, no hardcoded values
3. **Codex CLI OAuth** - No manual API keys
4. **Next.js 15 App Router** - Server Components
5. **FastAPI Backend** - Async Python
6. **PostgreSQL + pgvector** - Qdrant optional for MVP
7. **Phase-Based Development** - No timelines, checkbox todos
8. **Soft Kawaii Brutalist UI** - Unique design aesthetic
9. **SM-2 Algorithm** - Proven spaced repetition
10. **Monorepo Structure** - Frontend + backend together

### Planning Phase Review

**What Went Well**:
- Comprehensive documentation created
- Clear architecture decisions documented
- Design system fully specified
- User personas and flows defined

**Lessons Learned**:
- User feedback critical (no Docker, no timelines, dynamic config)
- Living documents approach helps maintain clarity
- Agent-based development requires upfront planning

**Action Items Before Phase 0**:
- [ ] Review all documentation one final time
- [ ] Ensure local environment is ready (Homebrew, Node, Python installed)
- [ ] Back up all documentation to git repository
- [ ] Create initial git repository and commit

---

## Phase 0: Foundation Setup

**Duration**: 2-3 weeks
**Goal**: Get development environment running with all tools and infrastructure
**Status**: 🎯 READY TO START

### Week 1: Environment & Tools

#### Day 1-2: Local Services Installation

**PostgreSQL 16 Setup**:
```bash
# macOS (Homebrew)
brew install postgresql@16
brew install pgvector
brew services start postgresql@16

# Create database
psql postgres
CREATE DATABASE studyin;
CREATE USER studyin_user WITH PASSWORD 'dev_password_changeme';
GRANT ALL PRIVILEGES ON DATABASE studyin TO studyin_user;

# Enable pgvector
\c studyin
CREATE EXTENSION vector;
\q
```

**Redis 7 Setup**:
```bash
# macOS
brew install redis
brew services start redis

# Test
redis-cli ping  # Should return PONG
```

**Qdrant Setup** (Optional for MVP):
```bash
# macOS
brew tap qdrant/qdrant
brew install qdrant
brew services start qdrant

# Or use Docker (if preferred for Qdrant only)
docker run -p 6333:6333 qdrant/qdrant
```

**Codex CLI Setup**:
```bash
# Install Codex CLI (if not already installed)
# Follow official installation instructions

# Authenticate with OAuth
codex
# Sign in with ChatGPT account
# Verify authentication works
```

**Checklist**:
- [ ] PostgreSQL 16 installed and running
- [ ] pgvector extension enabled in studyin database
- [ ] Redis 7 installed and running
- [ ] Qdrant installed (optional) or skipped
- [ ] Codex CLI authenticated via OAuth
- [ ] All services verified working

---

#### Day 3-4: Backend Foundation

**Initialize FastAPI Project**:
```bash
# Create project directory
mkdir -p backend/app
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install fastapi uvicorn[standard] sqlalchemy[asyncio] alembic pydantic-settings asyncpg redis python-jose[cryptography] passlib[bcrypt] python-multipart

# Create requirements.txt
pip freeze > requirements.txt
```

**Create Initial Structure**:
```bash
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry
│   ├── config.py            # Pydantic Settings
│   ├── api/
│   │   └── __init__.py
│   ├── core/
│   │   └── __init__.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── session.py
│   ├── models/
│   │   └── __init__.py
│   ├── schemas/
│   │   └── __init__.py
│   └── services/
│       └── __init__.py
├── .env
├── requirements.txt
└── alembic.ini
```

**Create config.py**:
```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "StudyIn"
    DEBUG: bool = True
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()
```

**Create .env**:
```bash
DATABASE_URL=postgresql+asyncpg://studyin_user:dev_password_changeme@localhost:5432/studyin
REDIS_URL=redis://localhost:6379
SECRET_KEY=dev-secret-key-change-in-production
DEBUG=true
```

**Create main.py**:
```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "StudyIn API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

**Test Backend**:
```bash
# Run server
uvicorn app.main:app --reload

# Test in browser
open http://localhost:8000
open http://localhost:8000/docs  # Swagger UI
```

**Checklist**:
- [ ] FastAPI project initialized
- [ ] Virtual environment created
- [ ] Dependencies installed
- [ ] Config system working (loading from .env)
- [ ] Server runs at http://localhost:8000
- [ ] Swagger docs accessible at /docs
- [ ] Health check endpoint responds

---

#### Day 5-7: Frontend Foundation

**Initialize Next.js Project**:
```bash
# Create Next.js 15 project
pnpm create next-app@latest frontend

# Options:
# ✔ TypeScript? Yes
# ✔ ESLint? Yes
# ✔ Tailwind CSS? Yes
# ✔ src/ directory? Yes
# ✔ App Router? Yes
# ✔ Turbopack? No (stable for now)
# ✔ Import alias? Yes (@/*)

cd frontend
```

**Install Dependencies**:
```bash
# UI components
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
pnpm add class-variance-authority clsx tailwind-merge
pnpm add lucide-react  # Icons

# State management
pnpm add zustand

# Data fetching
pnpm add @tanstack/react-query axios

# WebSocket
pnpm add socket.io-client

# Animations
pnpm add framer-motion

# Charts
pnpm add recharts

# Dev dependencies
pnpm add -D @types/node @types/react @types/react-dom
```

**Set up shadcn/ui**:
```bash
# Initialize shadcn/ui
pnpm dlx shadcn-ui@latest init

# Options:
# ✔ Style? New York
# ✔ Base color? Neutral
# ✔ CSS variables? Yes

# Add initial components
pnpm dlx shadcn-ui@latest add button
pnpm dlx shadcn-ui@latest add card
pnpm dlx shadcn-ui@latest add input
pnpm dlx shadcn-ui@latest add dialog
pnpm dlx shadcn-ui@latest add badge
```

**Configure Tailwind for Soft Kawaii Brutalist Theme**:
```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kawaii pastels
        kawaii: {
          pink: "#FFE5EC",
          blue: "#E0F4FF",
          green: "#E8F8E8",
          lavender: "#F0E8FF",
          peach: "#FFF0E5",
          mint: "#E5FFF0",
        },
        // Saturated accents
        accent: {
          pink: "#FF6B9D",
          blue: "#4A90E2",
          purple: "#9B59B6",
          coral: "#FF7675",
          teal: "#00B894",
        },
        // Pixel art palette
        pixel: {
          pink: "#FF77A9",
          yellow: "#FFD93D",
          green: "#6BCF7F",
          red: "#FF6B6B",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
        heading: ["var(--font-dm-sans)"],
        code: ["var(--font-jetbrains-mono)"],
        pixel: ["var(--font-press-start)"],
      },
      boxShadow: {
        "brutal-sm": "4px 4px 0px rgba(0, 0, 0, 0.1)",
        "brutal-md": "6px 6px 0px rgba(0, 0, 0, 0.15)",
        "brutal-lg": "8px 8px 0px rgba(0, 0, 0, 0.2)",
        "brutal-hero": "12px 12px 0px rgba(0, 0, 0, 1)",
      },
    },
  },
  plugins: [],
}
export default config
```

**Create Config System**:
```typescript
// src/lib/config.ts
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',

  features: {
    gamification: process.env.NEXT_PUBLIC_ENABLE_GAMIFICATION !== 'false',
    aiCoach: process.env.NEXT_PUBLIC_ENABLE_AI_COACH !== 'false',
  },

  theme: {
    primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#FF6B9D',
  },
};
```

**.env.local**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
NEXT_PUBLIC_ENABLE_GAMIFICATION=true
NEXT_PUBLIC_ENABLE_AI_COACH=true
NEXT_PUBLIC_PRIMARY_COLOR=#FF6B9D
```

**Test Frontend**:
```bash
pnpm dev
# Open http://localhost:3000
```

**Checklist**:
- [ ] Next.js 15 project initialized
- [ ] Dependencies installed (Zustand, TanStack Query, etc.)
- [ ] shadcn/ui configured and components added
- [ ] Tailwind configured with Soft Kawaii Brutalist theme
- [ ] Config system created (loading from .env.local)
- [ ] Server runs at http://localhost:3000
- [ ] Can see landing page

---

### Week 2-3: Git, CI/CD, and Initial Commits

#### Day 8-9: Git Repository Setup

**Initialize Repository**:
```bash
# At project root
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
frontend/node_modules/
backend/venv/
backend/__pycache__/

# Environment variables
.env
.env.local
.env.*.local

# Build outputs
frontend/.next/
frontend/out/
backend/dist/

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Uploads (local dev)
backend/uploads/
EOF

# Initial commit
git add .
git commit -m "feat: initial project setup (Phase 0)

- Initialize Next.js 15 frontend with Tailwind CSS
- Initialize FastAPI backend with PostgreSQL
- Configure dynamic settings (Pydantic Settings)
- Set up local services (PostgreSQL, Redis, Qdrant)
- Create comprehensive documentation (PRD, TECH_SPEC, etc.)
- Configure Soft Kawaii Brutalist UI theme

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Create GitHub repository (if using GitHub)
gh repo create studyin --private --source=. --remote=origin
git push -u origin main
```

**Checklist**:
- [ ] Git repository initialized
- [ ] .gitignore configured
- [ ] Initial commit created
- [ ] GitHub repository created (if applicable)
- [ ] Code pushed to remote

---

#### Day 10-12: Database Setup

**Initialize Alembic**:
```bash
cd backend

# Initialize Alembic
alembic init alembic

# Edit alembic.ini to use dynamic config
# Change: sqlalchemy.url = driver://user:pass@localhost/dbname
# To: # sqlalchemy.url =

# Edit alembic/env.py
```

**alembic/env.py**:
```python
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.config import settings
from app.db.base import Base  # Import all models

# This is the Alembic Config object
config = context.config

# Set database URL from settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# ... rest of default alembic/env.py
```

**Create Base Model**:
```python
# app/db/base.py
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass
```

**Create Database Session**:
```python
# app/db/session.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
```

**Create First Migration**:
```bash
# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Review generated migration in alembic/versions/

# Apply migration
alembic upgrade head

# Verify in database
psql studyin -c "\dt"  # Should show tables
```

**Checklist**:
- [ ] Alembic initialized
- [ ] Database session configured (async)
- [ ] Base model created
- [ ] Initial migration created and applied
- [ ] Database tables created successfully

---

#### Day 13-14: CI/CD Setup (GitHub Actions)

**Create GitHub Actions Workflow**:

**.github/workflows/ci.yml**:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: studyin_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: studyin_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd backend
          pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-asyncio

      - name: Run tests
        env:
          DATABASE_URL: postgresql+asyncpg://studyin_user:test_password@localhost:5432/studyin_test
          REDIS_URL: redis://localhost:6379
          SECRET_KEY: test-secret-key
        run: |
          cd backend
          pytest tests/ -v

  frontend-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 8

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: frontend/pnpm-lock.yaml

      - name: Install dependencies
        run: |
          cd frontend
          pnpm install

      - name: Run ESLint
        run: |
          cd frontend
          pnpm lint

      - name: Run tests
        run: |
          cd frontend
          pnpm test

      - name: Build
        run: |
          cd frontend
          pnpm build
```

**Checklist**:
- [ ] GitHub Actions workflow created
- [ ] CI pipeline tests backend
- [ ] CI pipeline tests frontend
- [ ] CI pipeline runs on push and PR

---

### Phase 0 Completion Criteria

**Before Moving to Phase 1**:

- [ ] PostgreSQL 16 installed and running
- [ ] pgvector extension enabled
- [ ] Redis 7 installed and running
- [ ] Codex CLI authenticated via OAuth
- [ ] FastAPI backend runs at `http://localhost:8000`
- [ ] FastAPI `/docs` accessible (Swagger UI)
- [ ] Next.js frontend runs at `http://localhost:3000`
- [ ] Dynamic configuration working (backend and frontend)
- [ ] Tailwind configured with Soft Kawaii Brutalist theme
- [ ] Git repository initialized and pushed to remote
- [ ] Alembic migrations working
- [ ] Database tables created
- [ ] CI/CD pipeline passing

**Deliverables**:
1. Running development environment
2. Initialized frontend and backend projects
3. Database schema migrations
4. Git repository with initial commit
5. CI/CD pipeline configured

**Phase 0 Review Meeting**:
- Review all setup
- Test all services
- Verify documentation is up-to-date
- Plan Phase 1 tasks

---

## Phase 1: Core Infrastructure

**Duration**: 3-4 weeks
**Goal**: Authentication, database models, basic API structure
**Status**: 🔜 Next Up

### Detailed Plan

See PHASES.md for complete Phase 1 checklist.

**Key Milestones**:
- Week 4: Authentication (JWT) backend + frontend
- Week 5: Database models (User, Material, Question, Progress)
- Week 6: Basic API endpoints
- Week 7: Dashboard layout and navigation

**Success Criteria**:
- User can register, log in, and see dashboard
- JWT authentication working end-to-end
- Database models created with migrations
- API documentation auto-generated at `/docs`

---

## Phase 2-8 Overview

*See PHASES.md for detailed checklists for each phase.*

**Phase 2**: Document Processing & RAG (Weeks 8-10)
**Phase 3**: AI Coach & Learning Paths (Weeks 11-14)
**Phase 4**: Question Generation (Weeks 15-17)
**Phase 5**: Spaced Repetition & Progress (Weeks 18-19)
**Phase 6**: Gamification (Weeks 20-22)
**Phase 7**: Polish & Optimization (Weeks 23-25)
**Phase 8**: Deployment (Week 26)

---

## Development Workflow

### Daily Workflow

1. **Start of Day**:
   ```bash
   # Terminal 1: Backend
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload

   # Terminal 2: Frontend
   cd frontend
   pnpm dev

   # Terminal 3: Git/tasks
   # Work here
   ```

2. **During Development**:
   - Update CHANGELOG.md with changes
   - Mark todos as complete in PHASES.md
   - Create git commits for completed features
   - Run tests before committing

3. **End of Day**:
   - Commit work-in-progress with clear WIP message
   - Update living documents if needed
   - Push to remote backup

---

### Testing Workflow

**Backend Tests**:
```bash
cd backend
pytest tests/ -v
pytest tests/ -v --cov=app  # With coverage
```

**Frontend Tests**:
```bash
cd frontend
pnpm test
pnpm test:watch  # Watch mode
```

**E2E Tests** (Phase 7):
```bash
cd frontend
pnpm test:e2e
```

---

### Git Commit Workflow

**Commit Message Format**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, no code change
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Build tasks, etc.

**Example**:
```bash
git add .
git commit -m "feat(auth): implement JWT authentication

- Add JWT token generation and validation
- Create auth endpoints (login, register, refresh)
- Implement password hashing with bcrypt
- Add auth middleware for protected routes

Closes #12

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Agent Usage Plan

### Phase 0 Agents

**Primary**: dx-optimizer, python-pro, frontend-developer
**Usage**:
- dx-optimizer: Optimize development workflow setup
- python-pro: Review FastAPI structure and config
- frontend-developer: Review Next.js 15 App Router setup

---

### Phase 1 Agents

**Primary**: backend-architect, database-architect, security-auditor, frontend-developer
**Usage**:
- backend-architect: Design API structure
- database-architect: Design database schema
- security-auditor: Review JWT implementation
- frontend-developer: Build auth UI and dashboard

---

### Ongoing Agents

- **debugger**: When stuck on bugs
- **code-reviewer**: Before merging features
- **architect-review**: For architectural decisions

---

## Risk Management

### Risk: Scope Creep

**Mitigation**:
- Stick to MVP scope (see PRD.md)
- Defer nice-to-have features to post-MVP
- Review scope every phase

### Risk: Technical Blockers

**Mitigation**:
- Use debugger agent when stuck
- Document blockers in CHANGELOG.md
- Ask for help (Reddit, Stack Overflow, Claude Code agents)
- Timebox investigation (2 hours max), then seek help

### Risk: Burnout

**Mitigation**:
- No hard deadlines (phase-based approach)
- Take breaks when needed
- Celebrate phase completions
- Track accomplishments in CHANGELOG.md

---

## Success Metrics

### Phase Completion Metrics

Each phase has clear completion criteria (see PHASES.md).

**Definition of Done**:
- All phase todos checked off
- Tests passing
- Code reviewed (by code-reviewer agent)
- Documentation updated
- Changes committed to git

---

### Project Success Metrics

**MVP Success (Post Phase 8)**:
- [ ] Can upload documents and see processing
- [ ] Can chat with AI coach
- [ ] Can take quizzes with NBME-style questions
- [ ] Spaced repetition system works
- [ ] Gamification feels motivating
- [ ] UI is delightful (Soft Kawaii Brutalist)
- [ ] Self-reported: "I prefer this over my old study method"

---

## Changelog

### 2025-10-09
- Initial implementation plan created
- Phase 0 detailed breakdown (Days 1-14)
- Development workflow documented
- Git commit guidelines established
- Testing workflow defined
- Agent usage plan created
- Risk management strategies documented

---

## Next Steps

**Immediate**: Begin Phase 0, Day 1
**Action**: Install PostgreSQL 16 + pgvector

```bash
# Let's go! 🚀
brew install postgresql@16 pgvector
brew services start postgresql@16
```

---

**Remember**: Quality over speed. No rush. Complete each phase thoroughly before moving to the next. Update this plan as you learn and discover new requirements.

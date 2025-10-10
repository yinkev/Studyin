# Project Structure & Setup Guide

## Overview

This document outlines the complete project structure for the Gamified Medical Learning Platform, including directory organization, initial setup steps, and development workflow.

---

## 1. Repository Structure

```
studyin/
├── README.md
├── docker-compose.yml
├── .gitignore
├── .env.example
│
├── docs/
│   ├── MVP_SPECIFICATION.md
│   ├── TECH_STACK.md
│   ├── API_DOCUMENTATION.md
│   ├── DESIGN_SYSTEM.md
│   └── DEPLOYMENT.md
│
├── backend/
│   ├── README.md
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── .env.example
│   ├── alembic.ini
│   ├── pytest.ini
│   │
│   ├── alembic/
│   │   ├── versions/
│   │   ├── env.py
│   │   └── script.py.mako
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI application entry
│   │   ├── config.py               # Settings and configuration
│   │   ├── dependencies.py         # Dependency injection
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── v1/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py       # Main router
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   ├── materials.py
│   │   │   │   ├── learning_paths.py
│   │   │   │   ├── sessions.py
│   │   │   │   ├── questions.py
│   │   │   │   ├── progress.py
│   │   │   │   └── gamification.py
│   │   │   │
│   │   │   └── websockets/
│   │   │       ├── __init__.py
│   │   │       └── session_handler.py
│   │   │
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── security.py         # JWT, password hashing
│   │   │   ├── exceptions.py       # Custom exceptions
│   │   │   └── logging.py          # Logging configuration
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── user.py
│   │   │   ├── material.py
│   │   │   ├── learning_path.py
│   │   │   ├── question.py
│   │   │   ├── progress.py
│   │   │   ├── session.py
│   │   │   └── gamification.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── material.py
│   │   │   ├── learning_path.py
│   │   │   ├── question.py
│   │   │   ├── progress.py
│   │   │   ├── session.py
│   │   │   └── gamification.py
│   │   │
│   │   ├── repositories/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── user_repo.py
│   │   │   ├── material_repo.py
│   │   │   ├── learning_path_repo.py
│   │   │   ├── question_repo.py
│   │   │   ├── progress_repo.py
│   │   │   └── session_repo.py
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   │
│   │   │   ├── document_processor/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── parser.py
│   │   │   │   ├── chunker.py
│   │   │   │   └── embedder.py
│   │   │   │
│   │   │   ├── ai_coach/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── orchestrator.py
│   │   │   │   ├── llm_client.py
│   │   │   │   ├── prompt_templates.py
│   │   │   │   └── response_parser.py
│   │   │   │
│   │   │   ├── learning_engine/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── path_generator.py
│   │   │   │   ├── adaptive_algorithm.py
│   │   │   │   └── spaced_repetition.py
│   │   │   │
│   │   │   ├── question_generator/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── mcq_generator.py
│   │   │   │   └── quality_scorer.py
│   │   │   │
│   │   │   └── gamification/
│   │   │       ├── __init__.py
│   │   │       ├── xp_calculator.py
│   │   │       └── achievement_tracker.py
│   │   │
│   │   ├── workers/
│   │   │   ├── __init__.py
│   │   │   ├── document_worker.py
│   │   │   └── question_worker.py
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── cache.py
│   │       ├── validators.py
│   │       └── helpers.py
│   │
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py
│       ├── unit/
│       │   ├── test_auth.py
│       │   ├── test_services.py
│       │   └── test_models.py
│       ├── integration/
│       │   ├── test_api.py
│       │   └── test_workflows.py
│       └── fixtures/
│           └── sample_data.py
│
├── frontend/
│   ├── README.md
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── .prettierrc
│   │
│   ├── public/
│   │   ├── mascot/
│   │   │   ├── happy.png
│   │   │   ├── thinking.png
│   │   │   └── celebrating.png
│   │   ├── icons/
│   │   └── pixel-art/
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── globals.css
│   │   │   │
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── register/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   ├── learning-map/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── session/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── questions/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── progress/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── materials/
│   │   │   │   ├── page.tsx
│   │   │   │   └── upload/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Navigation.tsx
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── DailyGoals.tsx
│   │   │   │   ├── DueReviews.tsx
│   │   │   │   ├── QuickStats.tsx
│   │   │   │   └── MascotGreeting.tsx
│   │   │   │
│   │   │   ├── learning/
│   │   │   │   ├── SkillTree.tsx
│   │   │   │   ├── LearningSession.tsx
│   │   │   │   ├── ContentCard.tsx
│   │   │   │   └── ProgressBar.tsx
│   │   │   │
│   │   │   ├── questions/
│   │   │   │   ├── QuestionCard.tsx
│   │   │   │   ├── AnswerFeedback.tsx
│   │   │   │   ├── QuizSummary.tsx
│   │   │   │   └── ConfidenceRating.tsx
│   │   │   │
│   │   │   ├── gamification/
│   │   │   │   ├── XPBar.tsx
│   │   │   │   ├── LevelBadge.tsx
│   │   │   │   ├── StreakCounter.tsx
│   │   │   │   ├── Achievement.tsx
│   │   │   │   └── RewardAnimation.tsx
│   │   │   │
│   │   │   ├── materials/
│   │   │   │   ├── FileUploader.tsx
│   │   │   │   ├── MaterialCard.tsx
│   │   │   │   └── ProcessingStatus.tsx
│   │   │   │
│   │   │   └── mascot/
│   │   │       ├── Mascot.tsx
│   │   │       └── MascotAnimations.tsx
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts              # API client
│   │   │   ├── websocket.ts        # WebSocket client
│   │   │   ├── utils.ts            # Utility functions
│   │   │   └── cn.ts               # Class name utility
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useSession.ts
│   │   │   ├── useProgress.ts
│   │   │   └── useWebSocket.ts
│   │   │
│   │   ├── stores/
│   │   │   ├── authStore.ts
│   │   │   ├── sessionStore.ts
│   │   │   └── uiStore.ts
│   │   │
│   │   └── types/
│   │       ├── api.ts
│   │       ├── user.ts
│   │       ├── learning.ts
│   │       └── gamification.ts
│   │
│   └── __tests__/
│       ├── unit/
│       ├── integration/
│       └── e2e/
│           └── learning-flow.spec.ts
│
├── infra/
│   ├── docker/
│   │   ├── backend.Dockerfile
│   │   ├── frontend.Dockerfile
│   │   └── nginx.conf
│   │
│   ├── k8s/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   └── secrets.yaml
│   │
│   └── terraform/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
│
├── scripts/
│   ├── setup.sh
│   ├── seed_data.py
│   ├── backup_db.sh
│   └── deploy.sh
│
└── .github/
    └── workflows/
        ├── backend-ci.yml
        ├── frontend-ci.yml
        └── deploy.yml
```

---

## 2. Initial Setup Steps

### Step 1: Clone and Initialize

```bash
# Create project directory
mkdir studyin
cd studyin

# Initialize git
git init
git branch -M main

# Create .gitignore
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
*.egg-info/
.pytest_cache/

# Node
node_modules/
.next/
out/
build/
dist/
*.log

# Environment
.env
.env.local
.env.*.local

# IDEs
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Uploads
uploads/
*.pdf
*.docx

# Database
*.db
*.sqlite

# Misc
.coverage
htmlcov/
EOF

# Create README
cat > README.md << 'EOF'
# Studyin - Gamified Medical Learning Platform

A psychology-first, AI-powered learning platform for USMLE Step 1 preparation.

## Quick Start

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

## Architecture

- **Frontend**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Backend**: Python 3.11+ + FastAPI
- **Databases**: PostgreSQL 16 (pgvector) + Redis 7 + Qdrant
- **AI**: Claude 3.5 Sonnet + GPT-4o-mini + Gemini 1.5 Flash

## Documentation

- [MVP Specification](docs/MVP_SPECIFICATION.md)
- [Tech Stack](docs/TECH_STACK.md)
- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [API Documentation](docs/API_DOCUMENTATION.md)

## License

Personal use only.
EOF
```

### Step 2: Backend Setup

```bash
# Create backend directory
mkdir backend
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Create requirements.txt
cat > requirements.txt << 'EOF'
# Core
fastapi==0.110.0
uvicorn[standard]==0.27.0
pydantic==2.6.0
pydantic-settings==2.1.0

# Database
sqlalchemy==2.0.25
alembic==1.13.1
asyncpg==0.29.0
psycopg2-binary==2.9.9

# Redis
redis==5.0.1
hiredis==2.3.2

# AI/ML
anthropic==0.18.0
openai==1.12.0
google-generativeai==0.3.0
qdrant-client==1.7.0

# Document Processing
pypdf2==3.0.1
python-docx==1.1.0
beautifulsoup4==4.12.3
lxml==5.1.0

# Auth
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9

# Utils
aiofiles==23.2.1
python-dotenv==1.0.1
tenacity==8.2.3

# Monitoring
sentry-sdk[fastapi]==1.40.0

# Rate Limiting
slowapi==0.1.9

# Testing
pytest==8.0.0
pytest-asyncio==0.23.4
pytest-cov==4.1.0
httpx==0.26.0
faker==22.6.0

# Development
ruff==0.2.0
black==24.1.0
mypy==1.8.0
EOF

pip install -r requirements.txt

# Create basic structure
mkdir -p app/{api/v1,api/websockets,core,models,schemas,repositories,services,workers,utils}
mkdir -p tests/{unit,integration,fixtures}
mkdir alembic

# Create main.py
cat > app/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Studyin API",
    description="Gamified Medical Learning Platform API",
    version="1.0.0"
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
    return {"message": "Studyin API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
EOF

# Create config.py
cat > app/config.py << 'EOF'
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Studyin"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # AI APIs
    ANTHROPIC_API_KEY: str
    OPENAI_API_KEY: str
    GOOGLE_API_KEY: str

    # Auth
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15

    class Config:
        env_file = ".env"

settings = Settings()
EOF

# Create .env.example
cat > .env.example << 'EOF'
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/studyin

# Redis
REDIS_URL=redis://localhost:6379

# AI APIs
ANTHROPIC_API_KEY=your-claude-key
OPENAI_API_KEY=your-openai-key
GOOGLE_API_KEY=your-gemini-key

# Security
SECRET_KEY=your-secret-key-here

# Environment
DEBUG=True
EOF

cd ..
```

### Step 3: Frontend Setup

```bash
# Create Next.js app
npx create-next-app@latest frontend --typescript --tailwind --app --src-dir --import-alias "@/*"

cd frontend

# Install additional dependencies
pnpm add @tanstack/react-query zustand socket.io-client recharts lucide-react framer-motion class-variance-authority clsx tailwind-merge

# Install dev dependencies
pnpm add -D @types/node prettier eslint-config-prettier

# Create .env.example
cat > .env.example << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
EOF

# Create lib/api.ts
mkdir -p src/lib
cat > src/lib/api.ts << 'EOF'
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
EOF

cd ..
```

### Step 4: Docker Setup

```bash
# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: studyin
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      QDRANT__SERVICE__GRPC_PORT: 6334

volumes:
  postgres_data:
  redis_data:
  qdrant_data:
EOF
```

### Step 5: Scripts

```bash
mkdir scripts

# Create setup script
cat > scripts/setup.sh << 'EOF'
#!/bin/bash

echo "🚀 Setting up Studyin development environment..."

# Check prerequisites
command -v python3.11 >/dev/null 2>&1 || { echo "Python 3.11+ required but not found. Aborting." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js required but not found. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker required but not found. Aborting." >&2; exit 1; }

# Start infrastructure
echo "📦 Starting databases..."
docker-compose up -d postgres redis qdrant

# Wait for databases
echo "⏳ Waiting for databases to be ready..."
sleep 5

# Backend setup
echo "🐍 Setting up backend..."
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy env file if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your API keys"
fi

# Run migrations
alembic upgrade head

cd ..

# Frontend setup
echo "⚛️  Setting up frontend..."
cd frontend
pnpm install

# Copy env file if not exists
if [ ! -f .env.local ]; then
    cp .env.example .env.local
fi

cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your API keys"
echo "2. Start backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "3. Start frontend: cd frontend && pnpm dev"
echo "4. Visit http://localhost:3000"
EOF

chmod +x scripts/setup.sh
```

---

## 3. Development Workflow

### Daily Development

```bash
# Terminal 1: Start infrastructure
docker-compose up

# Terminal 2: Start backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 3: Start frontend
cd frontend
pnpm dev

# Terminal 4: Available for commands (tests, migrations, etc.)
```

### Running Tests

```bash
# Backend tests
cd backend
source venv/bin/activate
pytest tests/ -v

# Frontend tests
cd frontend
pnpm test

# E2E tests
cd frontend
pnpm test:e2e
```

### Database Migrations

```bash
cd backend
source venv/bin/activate

# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Code Quality

```bash
# Backend
cd backend
source venv/bin/activate
ruff check .
black .
mypy app/

# Frontend
cd frontend
pnpm lint
pnpm format
```

---

## 4. Git Workflow

```bash
# Feature development
git checkout -b feature/learning-path-generation
# ... make changes ...
git add .
git commit -m "feat: implement learning path generation"
git push origin feature/learning-path-generation

# Create PR on GitHub

# After PR approval
git checkout main
git pull origin main
git branch -d feature/learning-path-generation
```

### Commit Message Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

---

## 5. Environment Variables

### Backend (.env)

```env
# Required
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/studyin
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AI...
SECRET_KEY=generate-with-openssl-rand-hex-32

# Optional
DEBUG=True
LOG_LEVEL=INFO
QDRANT_URL=http://localhost:6333
MAX_FILE_SIZE_MB=50
RATE_LIMIT_PER_MINUTE=100
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_ENV=development
```

---

## 6. IDE Configuration

### VS Code (.vscode/settings.json)

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.ruffEnabled": true,
  "python.formatting.provider": "black",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### VS Code Extensions

```
ms-python.python
ms-python.vscode-pylance
ms-python.black-formatter
charliermarsh.ruff
dbaeumer.vscode-eslint
esbenp.prettier-vscode
bradlc.vscode-tailwindcss
ms-azuretools.vscode-docker
```

---

## 7. Deployment Checklist

### Pre-deployment

- [ ] All tests passing
- [ ] Code linted and formatted
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Secrets rotated
- [ ] Dependencies updated
- [ ] Security audit passed

### Deployment

- [ ] Build Docker images
- [ ] Push to container registry
- [ ] Deploy to production
- [ ] Run health checks
- [ ] Monitor logs
- [ ] Verify functionality

### Post-deployment

- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Document any issues

---

## 8. Troubleshooting

### Backend won't start

```bash
# Check Python version
python --version  # Should be 3.11+

# Recreate venv
cd backend
rm -rf venv
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Database connection issues

```bash
# Check if postgres is running
docker-compose ps

# Restart postgres
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Frontend build errors

```bash
# Clear cache
cd frontend
rm -rf .next node_modules
pnpm install
pnpm dev
```

---

## Summary

This project structure provides:

✅ **Clear Organization**: Separate concerns, easy to navigate
✅ **Scalable Architecture**: Room to grow from MVP to production
✅ **Best Practices**: Type safety, testing, linting, formatting
✅ **Developer Experience**: Hot reload, auto-docs, helpful scripts
✅ **Production Ready**: Docker, CI/CD, monitoring, security

**Next Step**: Run `scripts/setup.sh` to get started!

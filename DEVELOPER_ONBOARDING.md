# Developer Onboarding Guide

> **Welcome to StudyIn! This guide will get you up and running in 30 minutes.**

## Table of Contents
1. [Welcome & Overview](#welcome--overview)
2. [Prerequisites & Setup](#prerequisites--setup)
3. [Local Development Environment](#local-development-environment)
4. [Project Structure Walkthrough](#project-structure-walkthrough)
5. [Development Workflow](#development-workflow)
6. [Key Concepts & Architecture](#key-concepts--architecture)
7. [Common Tasks](#common-tasks)
8. [Testing Strategy](#testing-strategy)
9. [Troubleshooting](#troubleshooting)
10. [Resources & Next Steps](#resources--next-steps)

---

## Welcome & Overview

### What is StudyIn?

StudyIn is an AI-powered medical learning platform designed to help medical students prepare for USMLE Step 1. It features:
- 🤖 Real-time AI coaching with WebSocket streaming
- 📚 Document processing and RAG (Retrieval-Augmented Generation)
- 🎮 Gamification with XP, levels, and achievements
- 📊 Comprehensive analytics dashboard
- 🎨 Unique Soft Kawaii Brutalist design system

### Tech Stack at a Glance

**Frontend**: React 19.2 + TypeScript + Vite 7 + Tailwind CSS v4
**Backend**: FastAPI + SQLAlchemy + PostgreSQL + Redis
**AI/LLM**: Codex CLI (OAuth-based, no API keys!)
**Real-time**: WebSockets for chat
**DevOps**: Docker Compose + GitHub Actions

---

## Prerequisites & Setup

### Required Software

Before you begin, ensure you have installed:

```bash
# Check versions
node --version      # v20.0.0 or higher
python --version    # Python 3.10 or higher
docker --version    # Docker 20.10 or higher
git --version       # Git 2.30 or higher

# Database tools (optional but recommended)
psql --version      # PostgreSQL client
redis-cli --version # Redis client
```

### Installing Prerequisites

#### macOS
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install node@20 python@3.10 postgresql redis docker git

# Install Docker Desktop
brew install --cask docker
```

#### Ubuntu/Debian
```bash
# Update package list
sudo apt update

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.10
sudo apt install python3.10 python3-pip python3.10-venv

# Install PostgreSQL and Redis
sudo apt install postgresql postgresql-contrib redis-server

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

#### Windows (WSL2 Recommended)
```powershell
# Install WSL2
wsl --install

# Inside WSL2, follow Ubuntu instructions above

# Install Docker Desktop for Windows
# Download from: https://www.docker.com/products/docker-desktop
```

---

## Local Development Environment

### 🚀 Quick Start (15 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/studyin.git
cd studyin

# 2. Start infrastructure with Docker Compose
docker-compose up -d postgres redis chromadb

# 3. Setup Backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings

# Run database migrations
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --port 8000

# 4. Setup Frontend (new terminal)
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local

# Start frontend development server
npm run dev
```

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://studyin:password@localhost:5432/studyin_dev
REDIS_URL=redis://localhost:6379/0

# Security (generate with: openssl rand -hex 32)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ALLOW_ORIGINS=["http://localhost:5173"]
CORS_ALLOW_METHODS=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
CORS_ALLOW_HEADERS=["*"]

# Environment
ENVIRONMENT=development
DEBUG=true

# LLM Settings (Codex CLI)
CODEX_MODEL=claude-3-5-sonnet
CODEX_MAX_TOKENS=4096
CODEX_TEMPERATURE=0.7

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_PERIOD=60

# File Upload
MAX_UPLOAD_SIZE=52428800  # 50MB
ALLOWED_EXTENSIONS=["pdf", "docx", "txt"]
```

#### Frontend (.env.local)
```env
# API Configuration
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_PUBLIC_URL=http://localhost:5173

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_GAMIFICATION=true
VITE_ENABLE_CHAT=true

# Development
VITE_DEBUG=true
```

### Docker Compose Services

```yaml
# docker-compose.yml overview
services:
  postgres:     # Main database (port 5432)
  redis:        # Cache & sessions (port 6379)
  chromadb:     # Vector database (port 8001)
  mailhog:      # Email testing (port 8025)
  minio:        # S3-compatible storage (port 9000)
```

Start all services:
```bash
docker-compose up -d
```

Check service status:
```bash
docker-compose ps
docker-compose logs -f [service-name]
```

---

## Project Structure Walkthrough

### Repository Layout

```
studyin/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and API client
│   │   ├── stores/         # Zustand state management
│   │   └── styles/         # CSS and design tokens
│   ├── public/             # Static assets
│   ├── package.json        # Dependencies
│   └── vite.config.ts      # Vite configuration
│
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core functionality
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── middleware/     # Custom middleware
│   ├── alembic/            # Database migrations
│   ├── tests/              # Test suite
│   └── requirements.txt    # Dependencies
│
├── docs/                    # Documentation
├── scripts/                # Utility scripts
├── .github/                # GitHub Actions
└── docker-compose.yml      # Local development services
```

### Key Files to Know

#### Frontend
- `src/App.tsx` - Main application component
- `src/hooks/useChatSession.ts` - WebSocket chat hook
- `src/lib/api/client.ts` - API client configuration
- `src/stores/authStore.ts` - Authentication state

#### Backend
- `app/main.py` - FastAPI application entry
- `app/api/auth.py` - Authentication endpoints
- `app/api/chat.py` - WebSocket chat handler
- `app/services/rag_service.py` - RAG implementation
- `app/models/user.py` - User database model

---

## Development Workflow

### Git Workflow

We follow GitHub Flow:

```bash
# 1. Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push branch and create PR
git push origin feature/your-feature-name
# Create PR on GitHub

# 4. After review and merge
git checkout main
git pull origin main
git branch -d feature/your-feature-name
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user profile page
fix: resolve WebSocket reconnection issue
docs: update API documentation
style: format code with prettier
refactor: extract chat logic to custom hook
test: add unit tests for auth service
chore: update dependencies
```

### Code Style

#### Frontend (TypeScript/React)
```bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run type-check
```

#### Backend (Python)
```bash
# Format with black
black backend/

# Lint with flake8
flake8 backend/

# Type check with mypy
mypy backend/
```

### Pre-commit Hooks

Install pre-commit hooks:
```bash
pip install pre-commit
pre-commit install
```

Configuration (`.pre-commit-config.yaml`):
```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.42.0
    hooks:
      - id: eslint
```

---

## Key Concepts & Architecture

### Frontend Architecture

#### Component Structure
```tsx
// Example: Feature Component Pattern
// components/StudyCard/
├── StudyCard.tsx          # Main component
├── StudyCard.styles.css   # Styles
├── StudyCard.test.tsx     # Tests
├── StudyCard.stories.tsx  # Storybook stories
└── index.ts              # Public export
```

#### State Management with Zustand
```typescript
// stores/gameStore.ts
import { create } from 'zustand';

interface GameStore {
  level: number;
  xp: number;
  streak: number;

  addXP: (amount: number) => void;
  updateStreak: () => void;
  resetProgress: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  level: 1,
  xp: 0,
  streak: 0,

  addXP: (amount) => set((state) => {
    const newXP = state.xp + amount;
    const newLevel = Math.floor(newXP / 1000) + 1;
    return { xp: newXP, level: newLevel };
  }),

  updateStreak: () => set((state) => ({
    streak: state.streak + 1
  })),

  resetProgress: () => set({
    level: 1, xp: 0, streak: 0
  })
}));
```

### Backend Architecture

#### Service Layer Pattern
```python
# services/learning_service.py
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Question
from app.schemas import QuestionCreate

class LearningService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_question(
        self,
        topic: str,
        difficulty: int,
        user_id: str
    ) -> Question:
        """Generate a personalized question."""
        # Business logic here
        pass

    async def check_answer(
        self,
        question_id: str,
        answer: str,
        user_id: str
    ) -> bool:
        """Validate user answer."""
        # Validation logic here
        pass
```

#### Dependency Injection
```python
# api/deps.py
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services import LearningService

async def get_learning_service(
    db: AsyncSession = Depends(get_db)
) -> LearningService:
    return LearningService(db)

# Usage in endpoint
@router.post("/question")
async def create_question(
    data: QuestionCreate,
    service: LearningService = Depends(get_learning_service)
):
    return await service.generate_question(**data.dict())
```

### WebSocket Architecture

#### Frontend WebSocket Hook
```typescript
// hooks/useWebSocket.ts
export const useWebSocket = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleMessage(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Implement reconnection logic
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [url]);

  const send = (data: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  };

  return { socket, isConnected, send };
};
```

---

## Common Tasks

### Adding a New API Endpoint

1. **Define Pydantic Schema** (`schemas/feature.py`):
```python
from pydantic import BaseModel

class FeatureCreate(BaseModel):
    name: str
    description: str

class FeatureResponse(BaseModel):
    id: str
    name: str
    description: str
    created_at: datetime
```

2. **Create Database Model** (`models/feature.py`):
```python
from sqlalchemy import Column, String, DateTime
from app.models.base import Base

class Feature(Base):
    __tablename__ = "features"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, server_default=func.now())
```

3. **Implement Service** (`services/feature_service.py`):
```python
class FeatureService:
    async def create_feature(self, data: FeatureCreate) -> Feature:
        feature = Feature(**data.dict())
        self.db.add(feature)
        await self.db.commit()
        return feature
```

4. **Add API Route** (`api/feature.py`):
```python
@router.post("/features", response_model=FeatureResponse)
async def create_feature(
    data: FeatureCreate,
    service: FeatureService = Depends(get_feature_service)
):
    feature = await service.create_feature(data)
    return feature
```

5. **Create Database Migration**:
```bash
alembic revision -m "add features table"
# Edit the generated migration file
alembic upgrade head
```

### Adding a New React Component

1. **Create Component Structure**:
```bash
mkdir -p src/components/FeatureCard
touch src/components/FeatureCard/{index.ts,FeatureCard.tsx,FeatureCard.test.tsx}
```

2. **Implement Component**:
```tsx
// FeatureCard.tsx
import React from 'react';
import { Card } from '@/components/ui/Card';

interface FeatureCardProps {
  title: string;
  description: string;
  onAction?: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  onAction
}) => {
  return (
    <Card className="soft-card pixel-border">
      <h3 className="text-brutalist">{title}</h3>
      <p className="text-body">{description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="btn-kawaii mt-4"
        >
          Learn More
        </button>
      )}
    </Card>
  );
};
```

3. **Add Tests**:
```tsx
// FeatureCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FeatureCard } from './FeatureCard';

describe('FeatureCard', () => {
  it('renders title and description', () => {
    render(
      <FeatureCard
        title="Test Feature"
        description="Test description"
      />
    );

    expect(screen.getByText('Test Feature')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('calls onAction when button clicked', () => {
    const handleAction = jest.fn();
    render(
      <FeatureCard
        title="Test"
        description="Test"
        onAction={handleAction}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});
```

### Working with Database Migrations

```bash
# Create a new migration
alembic revision -m "description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history

# Generate migration from model changes
alembic revision --autogenerate -m "auto migration"
```

### Debugging Tips

#### Frontend Debugging
```typescript
// Enable React DevTools Profiler
if (process.env.NODE_ENV === 'development') {
  import('react-devtools');
}

// Add debug logging
const DEBUG = import.meta.env.VITE_DEBUG === 'true';

export const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
};

// Use in components
debugLog('Component rendered', { props, state });
```

#### Backend Debugging
```python
# Use Python debugger
import pdb; pdb.set_trace()

# Or use IPython debugger (better)
import ipdb; ipdb.set_trace()

# Add logging
import logging
logger = logging.getLogger(__name__)

logger.debug(f"Processing request: {request_data}")
logger.info(f"User {user_id} logged in")
logger.warning(f"Rate limit approaching for {user_id}")
logger.error(f"Failed to process: {error}")

# FastAPI debugging
if settings.DEBUG:
    import traceback
    traceback.print_exc()
```

---

## Testing Strategy

### Frontend Testing

#### Unit Tests (Vitest)
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

Example test:
```typescript
// hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('should login successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password'
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeDefined();
  });
});
```

#### E2E Tests (Playwright)
```bash
# Run E2E tests
npm run test:e2e

# Run in headed mode
npm run test:e2e -- --headed
```

### Backend Testing

#### Unit Tests (Pytest)
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test
pytest tests/test_auth.py::test_login

# Run with verbose output
pytest -v
```

Example test:
```python
# tests/test_auth.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_login():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "password"
        })

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "user" in data
```

### WebSocket Testing
```python
# tests/test_websocket.py
import pytest
from fastapi.testclient import TestClient

def test_websocket_chat():
    client = TestClient(app)

    with client.websocket_connect("/ws/chat") as websocket:
        # Send authentication
        websocket.send_json({"type": "auth", "token": "test_token"})

        # Receive connection confirmation
        data = websocket.receive_json()
        assert data["type"] == "connected"

        # Send message
        websocket.send_json({
            "type": "message",
            "content": "Hello"
        })

        # Receive response
        response = websocket.receive_json()
        assert response["type"] == "message"
```

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Database Connection Errors
```bash
# Error: could not connect to database
# Solution: Check PostgreSQL is running
docker-compose ps postgres
docker-compose up -d postgres

# Reset database
docker-compose down -v  # Warning: deletes data
docker-compose up -d postgres
alembic upgrade head
```

#### 2. CORS Issues
```python
# backend/.env
CORS_ALLOW_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
CORS_ALLOW_CREDENTIALS=true
```

#### 3. WebSocket Connection Failed
```typescript
// Check WebSocket URL
console.log('Connecting to:', import.meta.env.VITE_WS_URL);

// Ensure backend WebSocket is running
// Check browser console for errors
// Verify no proxy interference
```

#### 4. Module Import Errors
```bash
# Frontend: Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Backend: Recreate virtual environment
deactivate
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 5. Hot Reload Not Working
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    watch: {
      usePolling: true,  // For Docker/WSL
    }
  }
});
```

### Debugging Checklist

1. **Check Service Status**:
```bash
docker-compose ps
curl http://localhost:8000/health
curl http://localhost:5173
```

2. **Check Logs**:
```bash
# Backend logs
docker-compose logs -f backend

# Frontend console
# Open browser DevTools > Console

# Database logs
docker-compose logs -f postgres
```

3. **Verify Environment Variables**:
```bash
# Backend
cat backend/.env

# Frontend
cat frontend/.env.local
```

4. **Test API Endpoints**:
```bash
# Using curl
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Using httpie (better output)
http POST localhost:8000/api/auth/login \
  email=test@example.com password=password
```

---

## Resources & Next Steps

### Essential Documentation

1. **Project Docs**:
   - [README.md](/README.md) - Project overview
   - [ARCHITECTURE.md](/ARCHITECTURE.md) - System architecture
   - [API_DOCUMENTATION.md](/API_DOCUMENTATION.md) - API reference
   - [DESIGN_SYSTEM_GUIDE.md](/DESIGN_SYSTEM_GUIDE.md) - Design system

2. **External Resources**:
   - [FastAPI Docs](https://fastapi.tiangolo.com/)
   - [React 19 Docs](https://react.dev/)
   - [Tailwind CSS v4](https://tailwindcss.com/)
   - [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Development Tools

#### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "github.copilot",
    "eamodio.gitlens"
  ]
}
```

#### Browser Extensions
- React Developer Tools
- Redux DevTools (for Zustand)
- WebSocket Client

### Learning Resources

#### For Frontend Development
1. **React Patterns**: Learn advanced React patterns
2. **TypeScript Deep Dive**: Master TypeScript
3. **Tailwind CSS**: Component patterns
4. **WebSocket Guide**: Real-time communication

#### For Backend Development
1. **FastAPI Tutorial**: Official tutorial
2. **SQLAlchemy 2.0**: Async patterns
3. **Redis Guide**: Caching strategies
4. **WebSocket with FastAPI**: Real-time features

### Your First Tasks

As a new developer, here's a suggested progression:

#### Week 1: Familiarization
- [ ] Set up local development environment
- [ ] Run the application successfully
- [ ] Explore the codebase structure
- [ ] Read architecture documentation
- [ ] Try the main features as a user

#### Week 2: Small Contributions
- [ ] Fix a small bug or typo
- [ ] Add a unit test
- [ ] Improve documentation
- [ ] Add a small UI enhancement
- [ ] Review a pull request

#### Week 3: Feature Development
- [ ] Pick a small feature from backlog
- [ ] Design and implement solution
- [ ] Write tests
- [ ] Create pull request
- [ ] Respond to code review

#### Week 4: Deep Dive
- [ ] Understand WebSocket implementation
- [ ] Learn the RAG pipeline
- [ ] Explore gamification system
- [ ] Contribute to a complex feature

### Getting Help

#### Internal Resources
- **Team Chat**: Discord/Slack #dev channel
- **Documentation**: This guide and others
- **Code Reviews**: Learn from PR feedback
- **Pair Programming**: Schedule sessions

#### Asking Good Questions
```markdown
### Issue Template
**What I'm trying to do:**
[Clear description]

**What I've tried:**
1. First attempt
2. Second attempt

**Error/Result:**
```error message or unexpected behavior```

**Expected Result:**
[What should happen]

**Environment:**
- OS: macOS/Windows/Linux
- Node: version
- Python: version
- Branch: feature/xxx
```

### Performance Tips

#### Frontend Performance
- Use React.memo for expensive components
- Implement virtual scrolling for long lists
- Lazy load routes and components
- Optimize images (WebP format)
- Use React DevTools Profiler

#### Backend Performance
- Use database indexes properly
- Implement caching with Redis
- Use async/await throughout
- Batch database operations
- Profile with cProfile

### Security Best Practices

1. **Never commit secrets**:
```bash
# Use git-secrets
git secrets --install
git secrets --register-aws
```

2. **Validate all inputs**:
```python
from pydantic import validator

class UserCreate(BaseModel):
    email: EmailStr
    password: str

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password too short')
        return v
```

3. **Use prepared statements** (SQLAlchemy does this)
4. **Implement rate limiting**
5. **Keep dependencies updated**

---

## Conclusion

Welcome to the StudyIn development team! This guide should give you everything you need to start contributing effectively. Remember:

- 🚀 **Start small**: Your first PR doesn't need to be perfect
- 💬 **Ask questions**: We're here to help
- 📚 **Keep learning**: The codebase is always evolving
- 🎨 **Have fun**: Enjoy building something meaningful

### Your Onboarding Checklist

- [ ] Environment setup complete
- [ ] Can run frontend and backend locally
- [ ] Understand project structure
- [ ] Know the git workflow
- [ ] Familiar with testing approach
- [ ] Read design system guide
- [ ] Joined team communication channels
- [ ] Made first commit/PR

**Ready to build the future of medical education? Let's go! 🚀**

---

*Last updated: January 2025*
*Questions? Reach out in #dev-help*
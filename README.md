# StudyIn - Medical Learning Platform

> **AI-Powered Adaptive Learning System for Medical Education**

A comprehensive medical learning platform featuring real-time AI coaching, adaptive question generation, gamification, and advanced analytics. Built with modern web technologies and a Soft Kawaii Brutalist Minimal Pixelated design aesthetic.

---

## 🚀 Tech Stack

### Frontend
- **React 19.2.0** - Latest React with concurrent features
- **Vite 7.0** - Next-generation frontend tooling
- **Tailwind CSS v4.0** - Modern utility-first CSS with theme customization
- **TypeScript 5.6** - Type-safe development
- **Zustand** - Lightweight state management
- **ECharts** - Advanced data visualization
- **WebSocket** - Real-time bidirectional communication

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy 2.0** - Async ORM with PostgreSQL
- **Redis** - Caching, session management, and analytics
- **ChromaDB** - Vector database for RAG
- **JWT** - Secure authentication
- **Alembic** - Database migrations
- **WebSockets** - Real-time chat support

### AI/LLM Integration
- **ChatMock (local)** - OpenAI-compatible chat API on 127.0.0.1:8801 (Plus/Pro login; no API key needed in apps)
- **RAG Pipeline** - PDF text ingestion via PyMuPDF (+ optional Tesseract OCR on low‑text pages)
- **Embeddings (text)** - Gemini gemini-embedding-001 with 1536‑dim vectors (cosine, L2‑normalized)
- **Streaming** - Real-time chat completions

### Infrastructure
- **PostgreSQL 16** - Primary database
- **Redis 7** - Cache and real-time analytics
- **Docker Compose** - Local development
- **nginx** - Production reverse proxy

---

## ✨ Features

### 🎓 Core Learning
- **Adaptive Learning System** - Personalized difficulty adjustment
- **AI Coach** - Real-time Socratic teaching with streaming responses
- **Document Processing** - Upload and process medical materials (PDF/DOCX)
- **Smart Question Generation** - USMLE-style MCQ creation
- **Knowledge Gap Analysis** - Identify and address weak areas

### 🎮 Gamification
- **XP & Leveling System** - Track progress with experience points
- **Daily Streaks** - Maintain consistency with streak tracking
- **Achievement Badges** - Unlock rewards for milestones
- **Mastery Tracking** - Visual progress indicators
- **Leaderboards** - Compare with peers

### 📊 Analytics Dashboard
- **Real-time Metrics** - Live performance tracking
- **Study Patterns** - Heatmaps and trend analysis
- **Progress Visualization** - Charts and graphs
- **Error Analysis** - Identify common mistakes
- **Custom Reports** - Exportable analytics

### 🎨 Design System
- **Soft Kawaii Brutalist Aesthetic** - Unique visual identity
- **Pixel Art Elements** - Retro-inspired graphics
- **Glassmorphism** - Modern transparency effects
- **Responsive Design** - Mobile-first approach
- **Dark/Light Themes** - User preference support

### 🔐 Security & Performance
- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - API protection
- **CSRF Protection** - Cross-site request forgery prevention
- **Input Validation** - Comprehensive data validation
- **Response Caching** - Redis-based optimization
- **Lazy Loading** - Code splitting for performance

---

## 📁 Project Structure

```
/Users/kyin/Projects/Studyin/
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/       # Base UI components
│   │   │   ├── chat/     # Chat system components
│   │   │   ├── gamification/  # XP, badges, streaks
│   │   │   └── analytics/     # Charts and metrics
│   │   ├── pages/        # Main application views
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and helpers
│   │   └── styles/       # CSS and design tokens
│   └── vite.config.ts    # Vite configuration
│
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   │   ├── auth.py   # Authentication routes
│   │   │   ├── chat.py   # WebSocket chat
│   │   │   ├── materials.py  # Document upload
│   │   │   └── analytics.py  # Analytics endpoints
│   │   ├── core/         # Core functionality
│   │   │   ├── jwt.py    # JWT handling
│   │   │   ├── password.py   # Password hashing
│   │   │   └── rate_limit.py # Rate limiting
│   │   ├── models/       # Database models
│   │   ├── services/     # Business logic
│   │   │   ├── rag_service.py       # RAG implementation
│   │   │   ├── embedding_service.py  # Embeddings
│   │   │   └── codex_llm.py         # LLM integration
│   │   └── middleware/   # Custom middleware
│   ├── alembic/          # Database migrations
│   └── requirements.txt  # Python dependencies
│
├── docs/                  # Documentation
├── scripts/              # Utility scripts
└── docker-compose.yml    # Development environment
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+** and npm/yarn
- **Python 3.10+**
- **PostgreSQL 16**
- **Redis 7**
- **Docker Desktop** (optional, for containerized services)

### Backend Setup (local)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration (no placeholders by default):
# - LLM_PROVIDER=openai_chatmock
# - OPENAI_BASE_URL=http://127.0.0.1:8801/v1
# - OPENAI_API_KEY=x
# - GEMINI_API_KEY=<your key>
# - GEMINI_EMBEDDING_MODEL=gemini-embedding-001
# - GEMINI_EMBEDDING_DIM=1536
# - DATABASE_URL=postgresql+asyncpg://studyin_user:changeme@localhost:5432/studyin_dev

# Run database migrations
# Migrations (Alembic CLI) are configured under backend/migrations.
# Common commands (run from backend/):
#   make db-rev MSG="add column"
#   make db-up
#   make db-down
#   make db-stamp

# Start the backend server
./venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

### Local AI (ChatMock)

```bash
# Install once
brew tap RayBytes/chatmock && brew install chatmock

# Login (Plus/Pro)
chatmock login

# Start local API (127.0.0.1:8801)
chatmock serve \
  --host 127.0.0.1 --port 8801 \
  --reasoning-effort high --reasoning-compat o3 --reasoning-summary none \
  --expose-reasoning-models --enable-web-search
```

Clients use baseURL http://127.0.0.1:8801/v1 and any non‑empty API key (e.g., "x").

### One‑Command Dev Start/Stop

```bash
# From repo root
./START_SERVERS.sh   # starts Postgres/Redis (via brew if needed), backend (8000), frontend (5173), ChatMock (8801)
./END_SERVERS.sh     # stops listeners on 8000/5173/8801
```

Logs:
- Backend: `/tmp/studyin-backend.log`
- Frontend: `/tmp/studyin-frontend.log`
- ChatMock: `~/.chatmock_server.log`

---

## ☁️ Deploy (GitHub → Vercel)

Vercel deploys on each push to `main`.

- Production Branch: `main`
- Root Directory: `frontend`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Node: `20.x`

Environment (Production):
- `VITE_API_URL` → e.g., `https://api.yourdomain.com`
- `VITE_WS_URL` → `wss://api.yourdomain.com/api/chat/ws` (note: wss, not ws)
- `VITE_ENVIRONMENT` → `production`
- `VITE_SENTRY_DSN` → optional

Backend CORS (staging/production): set in backend `.env` on the server

```
ENVIRONMENT=production
CORS_ALLOW_ORIGINS=https://<your-domain>,https://<project>.vercel.app
# optionally allow previews
CORS_ALLOW_ORIGIN_REGEX=https://.*\.vercel\.app$
```

Verify backend before deploy: `curl -I https://api.yourdomain.com/health` → 200.

---

## 🔄 CI/CD

GitHub Actions run backend tests (Postgres+Redis services) and frontend tests.
Deploy jobs exist for `develop` (staging) and `main` (production) via SSH scripts under `.github/workflows/deploy.yml`.

### Ingest PDFs into RAG

```bash
# Optional OCR dependency (on macOS)
brew install tesseract

# Ingest a lecture (OCR only on low‑text pages)
make ingest FILE="/absolute/path/to/lecture.pdf" OCR=1
```

This creates 1536‑dim embeddings in Chroma (collection: material_chunks_1536).

### One‑command dev start

```bash
# Starts ChatMock → backend (venv) → frontend (Vite)
./START_SERVERS.sh

### Chat WebSocket

- The socket is manual by design to avoid background reconnect noise.
- On the Chat view, click “Reconnect” to open the WS session.
- If the backend restarts, click “Reconnect” again.
```
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install  # or yarn install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local:
# VITE_API_URL=http://localhost:8000
# VITE_WS_URL=ws://localhost:8000

# Start development server
npm run dev  # or yarn dev
```

### Docker Compose (Alternative)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user account |
| POST | `/api/auth/login` | User login (returns JWT) |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update user profile |

### Learning Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/materials/upload` | Upload study materials |
| GET | `/api/materials` | List uploaded materials |
| DELETE | `/api/materials/{id}` | Delete material |
| GET | `/api/questions/generate` | Generate MCQ questions |
| POST | `/api/questions/answer` | Submit answer |

### Chat & AI Coach

| Method | Endpoint | Description |
|--------|----------|-------------|
| WS | `/ws/chat` | WebSocket chat connection |
| POST | `/api/chat/message` | Send chat message |
| GET | `/api/chat/history` | Get chat history |
| POST | `/api/chat/context` | Update chat context |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard metrics |
| GET | `/api/analytics/progress` | Learning progress |
| GET | `/api/analytics/performance` | Performance metrics |
| GET | `/api/analytics/streaks` | Streak data |
| GET | `/api/analytics/achievements` | User achievements |

### Gamification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gamification/stats` | User XP and level |
| POST | `/api/gamification/checkin` | Daily check-in |
| GET | `/api/gamification/leaderboard` | Global leaderboard |
| GET | `/api/gamification/badges` | Available badges |

---

## 🎨 Design System

### Color Palette

```css
/* Primary Colors */
--primary: oklch(70% 0.2 270);      /* Soft purple */
--secondary: oklch(75% 0.18 340);   /* Soft pink */
--accent: oklch(72% 0.15 160);      /* Soft green */

/* Gradients */
--gradient-kawaii: linear-gradient(135deg,
  rgba(110, 108, 246, 0.16),
  rgba(245, 143, 181, 0.25));

/* Shadows */
--shadow-soft: 0 22px 44px -18px rgba(90, 84, 243, 0.35);
--shadow-elevated: 0 30px 60px -32px rgba(17, 19, 33, 0.45);
```

### Typography

```css
/* Font Families */
--font-heading: 'Space Grotesk';    /* Bold, uppercase headings */
--font-body: 'Inter';                /* Clean body text */
--font-pixel: 'Press Start 2P';     /* Pixel art elements */

/* Font Scales */
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
```

### Component Classes

```css
.soft-card         /* Glassmorphic card with soft shadows */
.pixel-border      /* 8-bit style border decoration */
.kawaii-icon       /* Rounded icon containers */
.badge-soft        /* Soft gradient badges */
.text-brutalist    /* Uppercase, bold, tracked text */
```

---

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost/studyin
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ALLOW_ORIGINS=["http://localhost:5173"]
CORS_ALLOW_METHODS=["GET", "POST", "PUT", "DELETE"]

# LLM Integration (via Codex CLI)
CODEX_MODEL=claude-3-5-sonnet
CODEX_MAX_TOKENS=4096
CODEX_TEMPERATURE=0.7

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_PERIOD=60
```

#### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_PUBLIC_URL=http://localhost:5173
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v --cov=app --cov-report=term-missing
```

### Frontend Tests
```bash
cd frontend
npm test        # Run tests
npm run test:e2e  # E2E tests
npm run test:coverage  # Coverage report
```

### Integration Tests
```bash
# WebSocket testing
python test_websocket.py

# API load testing
locust -f tests/load_test.py
```

---

## 📈 Performance Optimization

### Frontend Optimizations
- **Code Splitting** - Lazy loading for routes
- **Bundle Size** - Tree shaking and minification
- **Image Optimization** - WebP format, lazy loading
- **Caching Strategy** - Service workers for offline support
- **React Optimization** - Memo, useCallback, useMemo

### Backend Optimizations
- **Database Indexing** - Optimized queries
- **Redis Caching** - Response caching
- **Connection Pooling** - Database and Redis pools
- **Async Operations** - Non-blocking I/O
- **Rate Limiting** - Prevent abuse

### Monitoring
- **Performance Metrics** - Response times, throughput
- **Error Tracking** - Sentry integration
- **Analytics** - User behavior tracking
- **Health Checks** - Service availability

---

## 🚦 Development Workflow

### Git Flow
```bash
main          # Production-ready code
├── develop   # Development branch
├── feature/* # Feature branches
├── hotfix/*  # Emergency fixes
└── release/* # Release preparation
```

### Commit Convention
```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code style changes
refactor: Code refactoring
test: Test additions/changes
chore: Build/config changes
```

### Code Quality
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **Black** - Python formatting
- **mypy** - Python type checking
- **Pre-commit hooks** - Automated checks

---

## 📝 Roadmap

### Phase 1: MVP ✅ (Completed)
- [x] Core authentication system
- [x] Document upload and processing
- [x] AI Coach with WebSocket streaming
- [x] Basic gamification (XP, levels, streaks)
- [x] Analytics dashboard
- [x] Responsive design

### Phase 2: Enhancement (Q1 2025)
- [ ] Advanced RAG with citations
- [ ] Collaborative study groups
- [ ] Mobile app (React Native)
- [ ] Voice interaction
- [ ] Spaced repetition algorithm
- [ ] Export study notes

### Phase 3: Scale (Q2 2025)
- [ ] Multi-tenancy support
- [ ] Advanced analytics AI
- [ ] Content marketplace
- [ ] API for third-party integrations
- [ ] Internationalization (i18n)
- [ ] Performance optimizations

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with modern web technologies and best practices:
- **Anthropic Claude** - AI coaching and content generation
- **React Team** - For React 19 and concurrent features
- **FastAPI** - Modern Python web framework
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Next generation frontend tooling

---

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/studyin/issues)
- **Discord**: [Join our community](https://discord.gg/studyin)
- **Email**: support@studyin.app

---

## 🚀 Quick Commands

```bash
# Development
npm run dev          # Start frontend dev server
uvicorn app.main:app --reload  # Start backend server

# Testing
npm test            # Run frontend tests
pytest             # Run backend tests

# Building
npm run build      # Build frontend
docker build .     # Build Docker image

# Database
alembic upgrade head    # Apply migrations
alembic revision -m "message"  # Create migration

# Code Quality
npm run lint       # Lint frontend
black backend/     # Format Python code
```

---

**Built with ❤️ for medical students who want to learn efficiently**

*Version 2.0 - January 2025*

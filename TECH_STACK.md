# Technology Stack - Final Decisions

## Overview

This document consolidates all technology decisions for the Gamified Medical Learning Platform MVP, based on insights from Gemini (psychology/design), Backend Architect, and AI Engineer agents.

---

## Stack Summary

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│  Next.js 14 + React 18 + TypeScript + Tailwind     │
│  shadcn/ui + Framer Motion + Socket.io Client      │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ HTTP / WebSocket / SSE
                       │
┌──────────────────────▼──────────────────────────────┐
│                   Backend                            │
│  Python 3.11+ + FastAPI + Pydantic                  │
│  Async/Await + WebSocket + Background Tasks         │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼───────┐ ┌───▼────────┐ ┌──▼──────────┐
│   PostgreSQL  │ │   Qdrant   │ │    Redis    │
│   16 + pgvector│ │  (Vectors) │ │ (Cache/Queue)│
└───────────────┘ └────────────┘ └─────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼───────┐ ┌───▼────────┐ ┌──▼─────────┐
│ Claude 3.5    │ │  GPT-4o    │ │ Gemini 1.5 │
│   Sonnet      │ │   -mini    │ │   Flash    │
│  (Primary)    │ │ (Secondary)│ │ (Bulk)     │
└───────────────┘ └────────────┘ └────────────┘
```

---

## 1. Frontend Stack

### Core Framework
**Next.js 14.2+ (App Router)**
- **Why**: Server components, built-in routing, excellent performance, SEO-ready
- **Alternative Considered**: Vite + React Router (faster dev, but less features)

**React 18.3+**
- **Why**: Industry standard, huge ecosystem, concurrent features
- **TypeScript**: Type safety, better DX, catch errors early

### Styling & UI
**Tailwind CSS 3.4+**
- **Why**: Utility-first, rapid development, consistent design system
- **Configuration**: Custom kawaii color palette, rounded corners default

**shadcn/ui**
- **Why**: Accessible, customizable, copy-paste components
- **Usage**: Base components (Button, Card, Dialog, etc.)

**Framer Motion**
- **Why**: Smooth animations, spring physics, gesture support
- **Usage**: Page transitions, mascot animations, micro-interactions

### State Management
**TanStack Query (React Query) v5**
- **Why**: Server state management, caching, optimistic updates
- **Usage**: API data fetching, cache management

**Zustand**
- **Why**: Lightweight, simple API, TypeScript-friendly
- **Usage**: Client-side state (UI state, session data)

### Real-time Communication
**Socket.io Client**
- **Why**: WebSocket with fallbacks, room support, reconnection
- **Usage**: Interactive learning sessions, real-time adaptation

### Data Visualization
**Recharts**
- **Why**: React-native, responsive, customizable
- **Usage**: Progress charts, performance analytics

### Icons & Assets
**Lucide React**
- **Why**: Modern, consistent icon set
- **Usage**: UI icons

**Custom Pixel Art**
- **Design Tool**: Aseprite or Piskel
- **Usage**: Mascot, achievements, decorative elements

---

## 2. Backend Stack

### Core Framework
**FastAPI 0.110+**
- **Why**: Async, automatic OpenAPI docs, Pydantic validation, high performance
- **Python 3.11+**: Pattern matching, better performance, modern syntax

### API Patterns
**Hybrid Architecture**:
- **REST**: CRUD operations, standard requests
- **WebSocket**: Real-time learning sessions
- **SSE**: Streaming LLM responses

### ORM & Database
**SQLAlchemy 2.0+ (Async)**
- **Why**: Mature, type-safe, async support
- **Usage**: PostgreSQL ORM

**Alembic**
- **Why**: Database migrations, version control for schema
- **Usage**: Schema evolution management

### Background Jobs
**Redis Streams + AsyncIO**
- **Why**: Simple for MVP, built into Redis
- **Usage**: Document processing, question generation
- **Future**: Celery or Temporal for complex workflows

### Validation & Serialization
**Pydantic 2.0+**
- **Why**: Type validation, automatic API docs, performance
- **Usage**: Request/response schemas, config management

### Authentication
**python-jose** (JWT)
- **Why**: Stateless, scalable, standard
- **Token Strategy**: Access (15 min) + Refresh (7 days)

**passlib + bcrypt**
- **Why**: Secure password hashing
- **Configuration**: Bcrypt cost factor 12

---

## 3. Data Storage

### Primary Database
**PostgreSQL 16+**

**Configuration**:
```yaml
DB_NAME: medical_learning_platform
DB_USER: postgres
POOL_SIZE: 20
MAX_OVERFLOW: 40
```

**Extensions**:
- **pgvector**: Vector similarity search (embeddings)
- **pg_trgm**: Fuzzy text search
- **uuid-ossp**: UUID generation

**Why PostgreSQL?**
- ACID compliance for user data
- pgvector eliminates separate vector DB for MVP
- JSONB for flexible metadata
- Mature ecosystem, excellent performance

### Vector Database
**Qdrant (Self-hosted) or Pinecone (Managed)**

**Recommendation**: Start with Qdrant, migrate to Pinecone if needed

**Qdrant**:
- **Why**: Self-hostable, cost-effective, Docker-friendly
- **Configuration**: Docker container, 1GB memory
- **Collection**: medical_content (1536 dimensions for OpenAI embeddings)

**Pinecone** (Alternative):
- **Why**: Zero ops, auto-scaling, excellent performance
- **Cost**: Free tier (1 index, 1 pod), $70/month for starter
- **When to Switch**: If scaling beyond personal use

**Vector Strategy**:
- Embedding Model: OpenAI text-embedding-3-small (1536d)
- Similarity Metric: Cosine similarity
- Hybrid Search: Vector + keyword (BM25)

### Cache & Queue
**Redis 7+**

**Uses**:
1. **Session Cache**: User sessions, JWT tokens
2. **API Response Cache**: Frequently accessed data
3. **LLM Response Cache**: Semantic caching for AI responses
4. **Background Queue**: Job queue for async processing
5. **Rate Limiting**: Request throttling

**Configuration**:
```yaml
REDIS_HOST: localhost
REDIS_PORT: 6379
CACHE_TTL: 3600  # 1 hour default
MAX_CONNECTIONS: 50
```

### File Storage
**Phase 1 (MVP)**: Local filesystem
**Phase 2**: S3-compatible storage (AWS S3 or MinIO)

**Structure**:
```
/uploads
  /{user_id}
    /materials
      /{material_id}.pdf
    /avatars
      /avatar.png
```

---

## 4. AI/LLM Integration

### Multi-Model Strategy

#### Primary: Claude 3.5 Sonnet
**Use Cases**:
- Interactive teaching (Socratic method)
- Complex medical reasoning
- Adaptive explanations
- Learning path generation

**Why**:
- 200k context window (handles long documents)
- Strong medical knowledge
- Excellent instruction following
- Natural conversational ability

**Cost**: $3/million input tokens, $15/million output tokens

#### Secondary: GPT-4o-mini
**Use Cases**:
- MCQ generation (cost-effective)
- Batch question creation
- Quick explanations
- Fallback for Claude

**Why**:
- 80% cheaper than Claude
- Fast response times
- Good question generation quality

**Cost**: $0.15/million input, $0.60/million output

#### Specialist: Gemini 1.5 Flash
**Use Cases**:
- Initial document analysis
- Bulk content processing
- Background tasks
- Tertiary fallback

**Why**:
- 93% cheaper than Claude
- Fast processing
- 1M context window
- Good for batch operations

**Cost**: $0.075/million input, $0.30/million output

### Embeddings
**OpenAI text-embedding-3-small**
- **Dimensions**: 1536
- **Cost**: $0.02/million tokens
- **Why**: Best balance of quality and cost

### LLM Integration Architecture

```python
# Unified interface with fallback
class LLMOrchestrator:
    """
    Routes requests to optimal model
    Implements semantic caching
    Handles fallback on failures
    """

    primary: ClaudeProvider
    secondary: GPTProvider
    tertiary: GeminiProvider
    cache: SemanticCache  # 60% cost savings
```

**Smart Routing**:
- **Complex reasoning** → Claude 3.5 Sonnet
- **Bulk generation** → GPT-4o-mini
- **Document analysis** → Gemini 1.5 Flash
- **Fallback Chain**: Claude → GPT → Gemini → Degraded mode

### Cost Optimization

#### 1. Semantic Caching (60% savings)
- Cache responses at 92% similarity threshold
- Redis-backed with 24h TTL
- Embedding comparison for matching

#### 2. Model Routing (30% savings)
- Right model for right task
- Avoid over-powered models for simple tasks

#### 3. Request Coalescing (20% savings)
- Batch similar requests
- Debounce rapid successive calls

**Target Cost**: $10-15/month for 100 questions/day (76% reduction from naive $45)

### RAG Pipeline

**Document Processing**:
1. **Parse**: PyPDF2, python-docx, BeautifulSoup
2. **Chunk**: Hierarchical (sections → paragraphs), 512 tokens, 128 overlap
3. **Embed**: OpenAI text-embedding-3-small
4. **Store**: Qdrant vector database
5. **Index**: Build semantic + keyword indexes

**Retrieval**:
1. **Query**: User question or context
2. **Vector Search**: Top 10 most similar chunks (cosine)
3. **Keyword Search**: BM25 ranking
4. **Hybrid Fusion**: Combine scores (RRF)
5. **Rerank**: Cross-encoder for final Top 5
6. **Context**: Inject into LLM prompt

**Context Management**:
- **Short-term**: Redis (current session)
- **Long-term**: PostgreSQL (user history)
- **Episodic**: Key learning moments stored
- **Compression**: Summarize old context to fit window

---

## 5. Infrastructure & DevOps

### Development Environment
**Docker Compose**

**Services**:
```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16

  redis:
    image: redis:7-alpine

  qdrant:
    image: qdrant/qdrant:latest

  backend:
    build: ./backend
    depends_on: [postgres, redis, qdrant]

  frontend:
    build: ./frontend
    depends_on: [backend]
```

### Production Deployment

#### Option 1: VPS (Cost-Effective)
**Provider**: DigitalOcean, Linode, Hetzner
**Specs**: 4 vCPU, 8GB RAM, 160GB SSD
**Cost**: ~$24/month
**Setup**: Docker Compose or Kubernetes (k3s)

#### Option 2: PaaS (Convenience)
**Provider**: Railway, Render, Fly.io
**Cost**: ~$30-50/month
**Why**: Zero ops, auto-scaling, easy deployments

#### Option 3: Cloud (Scalability)
**Provider**: AWS, GCP, Azure
**Services**: ECS/EKS, RDS, ElastiCache, S3
**Cost**: ~$50-100/month (optimized)
**Why**: Enterprise-grade, scales to thousands

**MVP Recommendation**: Railway or Render (convenience, MVP speed)

### CI/CD
**GitHub Actions**

**Pipeline**:
1. **Test**: Run unit + integration tests
2. **Lint**: Code quality checks (Ruff, ESLint)
3. **Build**: Docker images
4. **Deploy**: Auto-deploy to production (main branch)

### Monitoring & Observability

**Error Tracking**: Sentry (free tier)
**Metrics**: Prometheus + Grafana
**Logging**: Structured JSON logs → Loki
**Uptime**: UptimeRobot (free)

**Key Metrics**:
- API response times (p50, p95, p99)
- LLM API costs and latency
- Database query performance
- Cache hit rates
- Active users and sessions
- Error rates by endpoint

---

## 6. Development Tools

### Backend Development
- **IDE**: VS Code with Python extension
- **Linting**: Ruff (fast, Rust-based)
- **Formatting**: Black
- **Type Checking**: mypy
- **Testing**: pytest + pytest-asyncio
- **API Testing**: HTTPie or Postman

### Frontend Development
- **IDE**: VS Code with ESLint + Prettier
- **Linting**: ESLint (TypeScript rules)
- **Formatting**: Prettier
- **Type Checking**: Built-in TypeScript compiler
- **Testing**: Vitest + React Testing Library
- **E2E Testing**: Playwright

### Design Tools
- **UI Design**: Figma (design system, mockups)
- **Pixel Art**: Aseprite or Piskel
- **Prototyping**: Figma + Framer
- **Illustrations**: Procreate or Adobe Illustrator

### Database Tools
- **Client**: pgAdmin, DBeaver, or Postico
- **Migrations**: Alembic
- **Seeding**: Custom Python scripts

---

## 7. Security Stack

### Authentication & Authorization
- **JWT**: python-jose
- **Password Hashing**: passlib + bcrypt
- **OAuth 2.0** (Future): authlib

### API Security
- **Rate Limiting**: slowapi (Redis-backed)
- **CORS**: FastAPI CORS middleware
- **HTTPS**: Let's Encrypt (Caddy or Nginx)
- **Input Validation**: Pydantic
- **SQL Injection Prevention**: SQLAlchemy parameterized queries
- **XSS Prevention**: CSP headers, sanitization

### Data Protection
- **Encryption at Rest**: PostgreSQL encryption
- **Encryption in Transit**: TLS 1.3
- **Secrets Management**: Environment variables (never in code)
- **API Key Rotation**: Scheduled rotation policy

### Monitoring
- **Audit Logs**: Critical operations logged
- **Security Scanning**: Dependabot (GitHub)
- **Vulnerability Scanning**: Snyk or Safety

---

## 8. Package Management

### Backend (Python)
**Tool**: uv (Astral, fastest) or Poetry

**Key Dependencies**:
```toml
[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.110.0"
uvicorn = "^0.27.0"
sqlalchemy = "^2.0.25"
alembic = "^1.13.1"
pydantic = "^2.6.0"
redis = "^5.0.1"
qdrant-client = "^1.7.0"
anthropic = "^0.18.0"
openai = "^1.12.0"
google-generativeai = "^0.3.0"
python-jose = "^3.3.0"
passlib = "^1.7.4"
python-multipart = "^0.0.9"
aiofiles = "^23.2.1"
pypdf2 = "^3.0.1"
python-docx = "^1.1.0"
beautifulsoup4 = "^4.12.3"
slowapi = "^0.1.9"
```

### Frontend (Node.js)
**Tool**: pnpm (fast, efficient) or npm

**Key Dependencies**:
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@tanstack/react-query": "^5.25.0",
    "zustand": "^4.5.0",
    "socket.io-client": "^4.6.1",
    "recharts": "^2.12.0",
    "lucide-react": "^0.344.0",
    "framer-motion": "^11.0.0",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/node": "^20.11.0",
    "typescript": "^5.3.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0",
    "vitest": "^1.3.0",
    "@playwright/test": "^1.42.0"
  }
}
```

---

## 9. Alternative Stacks Considered

### Alternative A: Full JavaScript
**Stack**: Node.js + Express + Prisma + MongoDB
**Pros**: One language, faster context switching
**Cons**: Weaker AI/ML ecosystem, less mature vector support
**Verdict**: ❌ Python's AI ecosystem is too valuable

### Alternative B: Ruby on Rails
**Stack**: Rails 7 + PostgreSQL + Sidekiq
**Pros**: Rapid development, mature ecosystem
**Cons**: Declining community, slower performance, weaker AI libraries
**Verdict**: ❌ Python better for AI integration

### Alternative C: Go Backend
**Stack**: Gin/Echo + PostgreSQL + Python workers
**Pros**: Excellent performance, strong typing
**Cons**: Split language ecosystem, less AI tooling
**Verdict**: ❌ Added complexity not worth performance gains for MVP

### Alternative D: Django
**Stack**: Django 5 + DRF + Celery
**Pros**: Batteries included, admin panel, mature
**Cons**: Heavier, more opinionated, async less mature
**Verdict**: ❌ FastAPI more flexible and modern

---

## 10. Decision Matrix

| Criteria | Weight | Python/FastAPI | Node.js | Django | Score |
|----------|--------|----------------|---------|--------|-------|
| AI/ML Ecosystem | 25% | 10 | 6 | 10 | ✅ FastAPI/Django |
| Development Speed | 20% | 9 | 10 | 8 | ✅ Node.js |
| Performance | 15% | 8 | 9 | 7 | ✅ Node.js |
| Async Support | 15% | 10 | 10 | 7 | ✅ FastAPI/Node |
| Learning Curve | 10% | 8 | 9 | 7 | ✅ Node.js |
| Community Size | 10% | 8 | 10 | 7 | ✅ Node.js |
| Type Safety | 5% | 8 | 7 | 8 | ✅ FastAPI |
| **Total** | 100% | **8.9** | 8.5 | 7.9 | **✅ FastAPI** |

**Winner**: **Python + FastAPI** (AI ecosystem is decisive factor)

---

## 11. Cost Breakdown

### Development Costs (One-time)
| Item | Cost |
|------|------|
| Developer Time | $0 (self-built) |
| Design Assets (mascot, icons) | $200-500 |
| Domain (1 year) | $12-15 |
| **Total** | **$212-515** |

### Monthly Operating Costs (Personal Use)
| Item | Cost |
|------|------|
| LLM APIs (optimized, 100 q/day) | $10-15 |
| VPS Hosting (4 vCPU, 8GB RAM) | $24 |
| Domain | $1 |
| Monitoring (Sentry free tier) | $0 |
| **Total** | **$35-40/month** |

### Alternative: Railway/Render (PaaS)
| Item | Cost |
|------|------|
| LLM APIs (optimized) | $10-15 |
| Railway/Render hosting | $25-35 |
| Domain | $1 |
| **Total** | **$36-51/month** |

### Heavy Optimization (Local Models)
| Item | Cost |
|------|------|
| LLM APIs (aggressive caching) | $5-8 |
| Self-hosted (home server) | $0 |
| Electricity (est.) | $5 |
| Domain | $1 |
| **Total** | **$11-14/month** |

---

## 12. Migration Path (Future Scaling)

### Phase 1: MVP (1 user)
**Current Stack**: Monolith, single server

### Phase 2: Friends & Family (10-50 users)
- Add load balancer (Nginx/Caddy)
- PostgreSQL read replicas
- CDN for static assets (Cloudflare)
- Separate background workers

### Phase 3: Public Beta (100-500 users)
- Kubernetes deployment
- Horizontal scaling of API servers
- Managed PostgreSQL (RDS/Cloud SQL)
- Managed Redis (ElastiCache/Memorystore)
- Object storage (S3/GCS)
- Rate limiting per user

### Phase 4: Production (1000+ users)
- Microservices extraction:
  - Document Processing Service
  - AI Coach Service
  - Question Generation Service
  - Gamification Service
- Message queue (RabbitMQ/Kafka)
- Multi-region deployment
- Advanced monitoring and alerting
- A/B testing infrastructure

---

## 13. Quick Start Commands

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Environment variables
cp .env.example .env
# Edit .env with your API keys

# Database
alembic upgrade head

# Run
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
pnpm install  # or npm install

# Environment variables
cp .env.example .env.local
# Edit .env.local

# Run
pnpm dev  # or npm run dev
```

### Docker Setup
```bash
# From project root
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 14. Validation & Testing

### Backend Testing
```bash
# Unit tests
pytest tests/unit -v

# Integration tests
pytest tests/integration -v

# Coverage
pytest --cov=app --cov-report=html
```

### Frontend Testing
```bash
# Unit tests
pnpm test  # or npm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:coverage
```

---

## Summary

This stack provides:
✅ **Psychology-First**: Python AI ecosystem enables evidence-based learning
✅ **Rapid Development**: FastAPI + Next.js = fast MVP iteration
✅ **Cost-Effective**: $35-40/month with optimization strategies
✅ **Scalable**: Clear migration path to 1000+ users
✅ **Modern**: Async, type-safe, excellent DX
✅ **Proven**: Production-grade technologies with large communities

**Next Step**: Review this stack, provide feedback, then proceed to project setup!

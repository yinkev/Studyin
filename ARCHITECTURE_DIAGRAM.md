# Medical Learning Platform - Visual Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                 │
│  (Web App / Mobile App / API Clients)                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (FastAPI)                            │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐                │
│  │ Rate Limiting│  │Authentication │  │  Request     │                │
│  │              │  │  (JWT)        │  │  Validation  │                │
│  └──────────────┘  └───────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                       COST OPTIMIZER LAYER                               │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐                │
│  │ Semantic     │  │   Budget      │  │  Request     │                │
│  │ Cache        │  │   Monitor     │  │  Coalescing  │                │
│  │ (Redis)      │  │               │  │              │                │
│  └──────────────┘  └───────────────┘  └──────────────┘                │
│         ↓ Cache Miss                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      LEARNING ENGINE (Orchestration)                     │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │  Session Manager                                             │       │
│  │  • Start/Resume sessions  • Track progress  • Analytics     │       │
│  └─────────────────────────────────────────────────────────────┘       │
│                                                                          │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐                │
│  │ Adaptive     │  │ Difficulty    │  │ Performance  │                │
│  │ Teaching     │  │ Adjustment    │  │ Analysis     │                │
│  └──────────────┘  └───────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
┌──────────────────────┐ ┌──────────────────┐ ┌─────────────────────┐
│   RAG PIPELINE       │ │  LLM ROUTER      │ │ CONTEXT MANAGER     │
│                      │ │                  │ │                     │
│ ┌────────────────┐  │ │ ┌──────────────┐ │ │ ┌─────────────────┐ │
│ │ Document       │  │ │ │ Model        │ │ │ │ Short-term      │ │
│ │ Processor      │  │ │ │ Selection    │ │ │ │ Memory (Redis)  │ │
│ └────────────────┘  │ │ └──────────────┘ │ │ └─────────────────┘ │
│         ↓           │ │        ↓         │ │         ↓           │
│ ┌────────────────┐  │ │ ┌──────────────┐ │ │ ┌─────────────────┐ │
│ │ Chunking       │  │ │ │ Fallback     │ │ │ │ Long-term       │ │
│ │ (Hybrid)       │  │ │ │ Logic        │ │ │ │ Profile (PG)    │ │
│ └────────────────┘  │ │ └──────────────┘ │ │ └─────────────────┘ │
│         ↓           │ │        ↓         │ │         ↓           │
│ ┌────────────────┐  │ │ ┌──────────────┐ │ │ ┌─────────────────┐ │
│ │ Embeddings     │  │ │ │ Retry        │ │ │ │ Episodic        │ │
│ │ (OpenAI)       │  │ │ │ Backoff      │ │ │ │ Memory (PG)     │ │
│ └────────────────┘  │ │ └──────────────┘ │ │ └─────────────────┘ │
│         ↓           │ │                  │ │                     │
│ ┌────────────────┐  │ │                  │ │                     │
│ │ Vector Store   │  │ │                  │ │                     │
│ │ (Qdrant)       │  │ │                  │ │                     │
│ └────────────────┘  │ │                  │ │                     │
│         ↓           │ │                  │ │                     │
│ ┌────────────────┐  │ │                  │ │                     │
│ │ Hybrid Search  │  │ │                  │ │                     │
│ │ + Reranking    │  │ │                  │ │                     │
│ └────────────────┘  │ │                  │ │                     │
└──────────────────────┘ └──────────────────┘ └─────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
         ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
         │ CLAUDE 3.5       │ │ GPT-4o-mini  │ │ GEMINI 1.5       │
         │ SONNET           │ │              │ │ FLASH            │
         │                  │ │              │ │                  │
         │ • Socratic       │ │ • MCQ Gen    │ │ • Bulk Analysis  │
         │   Teaching       │ │ • Simple     │ │ • Document       │
         │ • Medical        │ │   Explain    │ │   Processing     │
         │   Reasoning      │ │ • Mnemonics  │ │ • Extraction     │
         │ • Analysis       │ │              │ │                  │
         │                  │ │              │ │                  │
         │ $3/$15 per 1M    │ │ $0.15/$0.60  │ │ $0.075/$0.30     │
         │ 200K context     │ │ 128K context │ │ 1M context       │
         └──────────────────┘ └──────────────┘ └──────────────────┘
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA PERSISTENCE LAYER                           │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐                │
│  │ PostgreSQL   │  │    Redis      │  │   Qdrant     │                │
│  │              │  │               │  │              │                │
│  │ • Users      │  │ • Session     │  │ • Document   │                │
│  │ • Profiles   │  │   Cache       │  │   Vectors    │                │
│  │ • Sessions   │  │ • Rate Limits │  │ • Semantic   │                │
│  │ • Questions  │  │ • Queues      │  │   Search     │                │
│  │ • Analytics  │  │ • Temp Data   │  │              │                │
│  └──────────────┘  └───────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      MONITORING & OBSERVABILITY                          │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐                │
│  │ Prometheus   │  │   Grafana     │  │   Logs       │                │
│  │ (Metrics)    │  │ (Dashboards)  │  │ (JSON)       │                │
│  └──────────────┘  └───────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────────────────────────┘
```

## Request Flow Diagram

### Scenario 1: Generate MCQ Question

```
User Request: "Generate cardiology question"
        ↓
┌───────────────────────────────────────┐
│ 1. API Gateway                        │
│    • Authenticate user                │
│    • Validate request                 │
│    • Check rate limit                 │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 2. Cost Optimizer                     │
│    • Check semantic cache             │
│    • Similar question cached?         │
│      ✓ Yes → Return cached (0 cost)  │
│      ✗ No → Continue                 │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 3. Learning Engine                    │
│    • Get user profile                 │
│    • Determine difficulty             │
│    • Select question type             │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 4. RAG Pipeline                       │
│    • Query: "cardiology concepts"     │
│    • Retrieve relevant chunks         │
│    • Hybrid search (vector + keyword) │
│    • Rerank top results               │
│    • Return context                   │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 5. Prompt Builder                     │
│    • Load MCQ template                │
│    • Insert RAG context               │
│    • Add user level                   │
│    • Add difficulty setting           │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 6. LLM Router                         │
│    • Task: MCQ generation             │
│    • Complexity: Moderate             │
│    • Route to: GPT-4o-mini            │
│      (cheaper, good at structured)    │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 7. GPT-4o-mini API                    │
│    • Generate question                │
│    • Cost: ~$0.003                    │
│    • Time: ~1.5s                      │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 8. Response Processing                │
│    • Parse JSON response              │
│    • Validate structure               │
│    • Store in cache                   │
│    • Update metrics                   │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 9. Return to User                     │
│    • Question + options               │
│    • Metadata (difficulty, topic)     │
│    • Performance metrics              │
└───────────────────────────────────────┘

Total time: ~2s
Total cost: $0.003
```

### Scenario 2: Adaptive Teaching

```
User: "I don't understand heart failure"
        ↓
┌───────────────────────────────────────┐
│ 1. Context Manager                    │
│    • Retrieve conversation history    │
│    • Get user profile                 │
│      - Level: 3/5                     │
│      - Style: Clinical                │
│      - Recent errors: [...]           │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 2. RAG Retrieval (Adaptive)           │
│    • Query: "heart failure"           │
│    • Filter: difficulty ≤ 3           │
│    • Boost: user's weak areas         │
│    • Return: Clinical-focused content │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 3. Prompt Engineering                 │
│    • Template: Adaptive teaching      │
│    • Insert:                          │
│      - User level (3)                 │
│      - Learning style (clinical)      │
│      - Recent mistakes                │
│      - RAG context                    │
│      - Conversation history           │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 4. LLM Router                         │
│    • Task: Socratic teaching          │
│    • Complexity: Expert               │
│    • Route to: Claude 3.5 Sonnet      │
│      (best at adaptive teaching)      │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 5. Claude 3.5 Sonnet                  │
│    • Generate explanation             │
│      - At their level                 │
│      - Clinical examples              │
│      - Socratic questions             │
│      - Address misconceptions         │
│    • Cost: ~$0.015                    │
│    • Time: ~2.5s                      │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ 6. Context Update                     │
│    • Store interaction                │
│    • Update user profile              │
│    • Track topic coverage             │
└───────────────────────────────────────┘
        ↓
User receives personalized explanation
```

## Data Flow Diagram

```
┌──────────────┐
│ User Uploads │
│ PDF Textbook │
└──────────────┘
       ↓
┌──────────────────────────────────┐
│ Document Processing Pipeline     │
│                                  │
│ 1. PDF → Text Extraction         │
│    └─ Preserve structure         │
│                                  │
│ 2. Hierarchical Chunking         │
│    ├─ Chapter boundaries         │
│    ├─ Section divisions          │
│    └─ Semantic coherence         │
│                                  │
│ 3. Metadata Extraction           │
│    ├─ Topics                     │
│    ├─ Difficulty                 │
│    └─ Clinical relevance         │
└──────────────────────────────────┘
       ↓
┌──────────────────────────────────┐
│ Embedding Generation             │
│                                  │
│ OpenAI text-embedding-3-small    │
│ • Batch size: 32                 │
│ • Normalize: Yes                 │
│ • Cost: ~$0.05 per 1000 pages    │
└──────────────────────────────────┘
       ↓
┌──────────────────────────────────┐
│ Vector Storage (Qdrant)          │
│                                  │
│ Collection: "medical_knowledge"  │
│ ├─ Vectors: 384 dimensions       │
│ ├─ Metadata: topic, difficulty   │
│ └─ Index: HNSW                   │
└──────────────────────────────────┘
       ↓
┌──────────────────────────────────┐
│ Ready for Retrieval              │
│                                  │
│ • Hybrid search enabled          │
│ • Reranking configured           │
│ • Filters available              │
└──────────────────────────────────┘
```

## Cost Optimization Flow

```
Incoming Request
       ↓
┌─────────────────────────────────────┐
│ TIER 1: Exact Match Cache           │
│                                     │
│ Check: Identical prompt in cache?   │
│ • Hash-based lookup                 │
│ • Lightning fast (< 1ms)            │
│                                     │
│ ✓ Hit  → Return (Cost: $0)         │
│ ✗ Miss → Continue to Tier 2        │
└─────────────────────────────────────┘
       ↓
┌─────────────────────────────────────┐
│ TIER 2: Semantic Cache              │
│                                     │
│ Check: Similar prompt in cache?     │
│ • Embedding-based similarity        │
│ • Threshold: 92%                    │
│                                     │
│ ✓ Hit  → Return (Cost: $0)         │
│ ✗ Miss → Continue to Tier 3        │
└─────────────────────────────────────┘
       ↓
┌─────────────────────────────────────┐
│ TIER 3: Budget Check                │
│                                     │
│ Verify: Budget remaining?           │
│ • Hourly limit: $1                  │
│ • Daily limit: $10                  │
│                                     │
│ ✓ OK   → Continue to Tier 4        │
│ ✗ Exceeded → Queue or deny         │
└─────────────────────────────────────┘
       ↓
┌─────────────────────────────────────┐
│ TIER 4: Request Coalescing          │
│                                     │
│ Check: Duplicate in-flight request? │
│ • Same prompt being processed?      │
│ • Wait window: 100ms                │
│                                     │
│ ✓ Duplicate → Attach & wait        │
│ ✗ Unique    → Continue to Tier 5   │
└─────────────────────────────────────┘
       ↓
┌─────────────────────────────────────┐
│ TIER 5: Model Selection             │
│                                     │
│ Route to cheapest suitable model:   │
│                                     │
│ Simple task                         │
│   → GPT-4o-mini ($0.003)           │
│                                     │
│ Moderate task                       │
│   → GPT-4o-mini ($0.003)           │
│   → Gemini Flash ($0.001)          │
│                                     │
│ Complex task                        │
│   → Claude 3.5 ($0.015)            │
└─────────────────────────────────────┘
       ↓
┌─────────────────────────────────────┐
│ API Call with Retries               │
│                                     │
│ • Exponential backoff               │
│ • Max retries: 3                    │
│ • Fallback to alternative model     │
└─────────────────────────────────────┘
       ↓
┌─────────────────────────────────────┐
│ Cache Result                        │
│                                     │
│ • Store in exact cache              │
│ • Store in semantic cache (w/ emb)  │
│ • TTL: 1 hour                       │
│ • Update usage metrics              │
└─────────────────────────────────────┘
       ↓
Return to User

Expected Savings:
• Cache hit rate: 60-70%
• Cost reduction: 60-80%
• Avg cost per request: $0.004
  (vs $0.015 without optimization)
```

## Learning Session State Machine

```
┌─────────────┐
│   START     │
│  SESSION    │
└─────────────┘
       ↓
┌─────────────────────────────────────┐
│   PHASE 1: WARMUP                   │
│                                     │
│ • 3 easier questions                │
│ • Assess baseline                   │
│ • Build confidence                  │
│ • Difficulty: user.level - 1        │
└─────────────────────────────────────┘
       ↓
┌─────────────────────────────────────┐
│   PHASE 2: TEACHING                 │
│                                     │
│ • Adaptive explanations             │
│ • Socratic questioning              │
│ • Address knowledge gaps            │
│ • Clinical examples                 │
└─────────────────────────────────────┘
       ↓
┌─────────────────────────────────────┐
│   PHASE 3: PRACTICE                 │
│                                     │
│ • 10-15 questions                   │
│ • Adaptive difficulty               │
│   - Target: 75% accuracy            │
│   - Adjust every 5 questions        │
│ • Real-time feedback                │
└─────────────────────────────────────┘
       ↓
       │    ┌────────────────────┐
       │    │ Difficulty Too Low │
       ├───>│ Accuracy > 85%     │
       │    │ → Increase level   │
       │    └────────────────────┘
       │            ↓
       │    ┌────────────────────┐
       │    │ Optimal Range      │
       ├───>│ Accuracy 60-85%    │
       │    │ → Maintain level   │
       │    └────────────────────┘
       │            ↓
       │    ┌────────────────────┐
       │    │ Difficulty Too High│
       └───>│ Accuracy < 60%     │
            │ → Decrease level   │
            └────────────────────┘
       ↓
┌─────────────────────────────────────┐
│   PHASE 4: ASSESSMENT               │
│                                     │
│ • 5 questions at target level       │
│ • No hints or help                  │
│ • Measure true understanding        │
└─────────────────────────────────────┘
       ↓
┌─────────────────────────────────────┐
│   PHASE 5: REVIEW                   │
│                                     │
│ • Analyze performance               │
│ • Identify patterns                 │
│ • Generate recommendations          │
│ • Schedule spaced repetition        │
└─────────────────────────────────────┘
       ↓
┌─────────────────────────────────────┐
│   SESSION COMPLETE                  │
│                                     │
│ Output:                             │
│ • Performance report                │
│ • Knowledge gaps identified         │
│ • Study plan updated                │
│ • Next session scheduled            │
└─────────────────────────────────────┘
```

## Technology Stack Summary

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                       │
│                                                         │
│  React / Vue.js / Flutter                               │
│  • Web & Mobile UI                                      │
│  • Real-time updates (WebSocket)                        │
│  • Offline support                                      │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                     │
│                                                         │
│  FastAPI (Python 3.10+)                                 │
│  • Async/await throughout                               │
│  • Type hints (Pydantic)                                │
│  • Auto-generated OpenAPI docs                          │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                  AI/ML LAYER                            │
│                                                         │
│  LLM Providers:                                         │
│  • Anthropic SDK (Claude)                               │
│  • OpenAI SDK (GPT-4o)                                  │
│  • Google GenerativeAI (Gemini)                         │
│                                                         │
│  ML Libraries:                                          │
│  • Sentence Transformers (embeddings)                   │
│  • LangChain (orchestration)                            │
│  • Tiktoken (tokenization)                              │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                   DATA LAYER                            │
│                                                         │
│  PostgreSQL 16                                          │
│  • User profiles & sessions                             │
│  • Analytics & metrics                                  │
│  • pgvector extension (optional)                        │
│                                                         │
│  Redis 7                                                │
│  • Session cache                                        │
│  • Semantic cache                                       │
│  • Rate limiting                                        │
│  • Pub/Sub for real-time                                │
│                                                         │
│  Qdrant                                                 │
│  • Vector embeddings                                    │
│  • Hybrid search                                        │
│  • Metadata filtering                                   │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│              INFRASTRUCTURE LAYER                       │
│                                                         │
│  Docker & Docker Compose                                │
│  • Local development                                    │
│  • Service orchestration                                │
│                                                         │
│  Kubernetes (Production)                                │
│  • Auto-scaling                                         │
│  • Load balancing                                       │
│  • Health checks                                        │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│            MONITORING & OBSERVABILITY                   │
│                                                         │
│  Prometheus + Grafana                                   │
│  • Metrics collection                                   │
│  • Real-time dashboards                                 │
│  • Alerting                                             │
│                                                         │
│  Structured Logging                                     │
│  • JSON format                                          │
│  • Request tracing                                      │
│  • Error tracking                                       │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────────────────────────────────────────┐
│              DEVELOPMENT                              │
│                                                      │
│  Docker Compose (local)                              │
│  • All services on localhost                         │
│  • Hot reload enabled                                │
│  • Debug mode on                                     │
│  • Mock data available                               │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│              STAGING                                  │
│                                                      │
│  AWS / GCP / Azure                                   │
│  • Single region                                     │
│  • Smaller instances                                 │
│  • Test with production data                         │
│  • Performance testing                               │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│              PRODUCTION                               │
│                                                      │
│  Kubernetes Cluster                                  │
│  ├─ Load Balancer (Nginx/ALB)                       │
│  ├─ App Pods (3+ replicas)                          │
│  │  • Auto-scaling: 3-10 pods                       │
│  │  • Health checks                                 │
│  │  • Rolling updates                               │
│  ├─ Cache Layer (Redis Cluster)                     │
│  │  • Master-replica setup                          │
│  │  • Persistence enabled                           │
│  ├─ Database (PostgreSQL)                           │
│  │  • Primary + read replicas                       │
│  │  • Automated backups                             │
│  └─ Vector DB (Qdrant)                              │
│     • Distributed deployment                         │
│     • Regular snapshots                              │
│                                                      │
│  CDN (CloudFlare)                                    │
│  • Static assets                                     │
│  • DDoS protection                                   │
│  • SSL/TLS                                           │
│                                                      │
│  Monitoring                                          │
│  • Prometheus cluster                                │
│  • Grafana dashboards                                │
│  • PagerDuty alerts                                  │
└──────────────────────────────────────────────────────┘
```

This architecture provides:
- ✅ Scalability (handle 100s-1000s concurrent users)
- ✅ Cost optimization (60-80% API cost reduction)
- ✅ High availability (99.9% uptime)
- ✅ Fast responses (<2s average)
- ✅ Intelligent learning (adaptive difficulty)
- ✅ Medical accuracy (RAG-validated content)
- ✅ Easy deployment (Docker Compose → Kubernetes)
- ✅ Comprehensive monitoring (metrics, logs, alerts)
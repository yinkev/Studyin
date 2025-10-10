# Medical Learning Platform - Integration Guide

## Quick Start

### Prerequisites
- Python 3.10+
- Docker & Docker Compose
- API keys for: Anthropic (Claude), OpenAI, Google (Gemini)
- 8GB+ RAM recommended

### 1. Environment Setup

```bash
# Clone or navigate to project directory
cd /Users/kyin/Projects/Studyin

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
# API Keys
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_gemini_api_key

# Database
DB_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password

# Security
JWT_SECRET=your_jwt_secret_key

# Environment
ENVIRONMENT=development
EOF
```

### 2. Start Infrastructure

```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f app
```

### 3. Initialize Database

```bash
# Create initial schema
python -c "
from database_setup import initialize_database
import asyncio
asyncio.run(initialize_database())
"
```

### 4. Test the System

```python
# test_integration.py
import asyncio
from llm_integration import LLMOrchestrator, LLMRequest, TaskComplexity
from rag_pipeline import MedicalDocumentProcessor, RAGRetriever
from learning_engine import AdaptiveLearningEngine, UserProfile, LearningStyle

async def test_system():
    # Initialize components
    config = {
        "ANTHROPIC_API_KEY": "your-key",
        "OPENAI_API_KEY": "your-key",
        "GOOGLE_API_KEY": "your-key"
    }

    llm = LLMOrchestrator(config)
    rag = RAGRetriever({"url": "localhost", "port": 6333})
    engine = AdaptiveLearningEngine(llm, rag, {})

    # Create user profile
    user = UserProfile(
        user_id="test_user",
        level=3,
        learning_style=LearningStyle.CLINICAL
    )

    # Start session
    session = await engine.start_session(user)

    # Generate a question
    question = await engine.generate_question(session, user, "Cardiac Physiology")
    print("Generated Question:", question)

    # Test teaching
    teaching = await engine.teach_concept(session, user, "Myocardial infarction")
    print("\nTeaching Content:", teaching[:200])

    return "System operational!"

if __name__ == "__main__":
    result = asyncio.run(test_system())
    print(result)
```

Run the test:
```bash
python test_integration.py
```

## Architecture Overview

### Component Flow

```
User Request
    ↓
FastAPI Endpoint
    ↓
Cost Optimizer (Check cache, budget)
    ↓
Learning Engine (Orchestration)
    ↓
┌─────────────┬──────────────┬─────────────┐
│             │              │             │
RAG Pipeline  LLM Router    Context Mgr
│             │              │             │
Qdrant        Claude/GPT     Redis
│             │              │             │
└─────────────┴──────────────┴─────────────┘
    ↓
Response Processing
    ↓
User Response (with metrics)
```

## Detailed Integration Steps

### Step 1: Document Processing & RAG Setup

```python
from rag_pipeline import MedicalDocumentProcessor, RAGRetriever, DocumentType

async def setup_rag():
    # Initialize processor
    processor = MedicalDocumentProcessor()

    # Process medical documents
    chunks = await processor.process_document(
        file_path="/path/to/medical_textbook.pdf",
        doc_type=DocumentType.TEXTBOOK,
        chunking_strategy=ChunkingStrategy.HYBRID
    )

    # Initialize retriever
    retriever = RAGRetriever({
        "url": "localhost",
        "port": 6333,
        "collection": "medical_knowledge"
    })

    # Create collection
    await retriever.initialize_collection()

    # Index chunks
    await retriever.index_chunks(chunks)

    print(f"Indexed {len(chunks)} chunks")

    # Test retrieval
    results = await retriever.retrieve(
        query="What causes myocardial infarction?",
        top_k=5
    )

    for result in results:
        print(f"Score: {result['score']:.3f} - {result['content'][:100]}")

# Run
asyncio.run(setup_rag())
```

### Step 2: LLM Integration & Model Routing

```python
from llm_integration import LLMOrchestrator, LLMRequest, TaskComplexity

async def test_llm():
    orchestrator = LLMOrchestrator({
        "ANTHROPIC_API_KEY": "your-key",
        "OPENAI_API_KEY": "your-key",
        "GOOGLE_API_KEY": "your-key"
    })

    # Simple explanation (will route to GPT-4o-mini)
    simple_request = LLMRequest(
        task_type="simple_explanation",
        prompt="Explain hypertension in simple terms",
        complexity=TaskComplexity.SIMPLE
    )

    response = await orchestrator.call_with_fallback(simple_request)
    print(f"Model used: {response.model_used}")
    print(f"Cost: ${response.cost}")
    print(f"Response: {response.content[:200]}")

    # Complex reasoning (will route to Claude)
    complex_request = LLMRequest(
        task_type="medical_reasoning",
        prompt="Explain the pathophysiology of heart failure with reduced ejection fraction",
        complexity=TaskComplexity.EXPERT
    )

    response = await orchestrator.call_with_fallback(complex_request)
    print(f"\nModel used: {response.model_used}")
    print(f"Cost: ${response.cost}")

asyncio.run(test_llm())
```

### Step 3: Cost Optimization Setup

```python
from cost_optimizer import CostOptimizer, CacheStrategy

async def setup_cost_optimization():
    optimizer = CostOptimizer(config={
        "redis_url": "redis://localhost",
        "cache_threshold": 0.92,
        "daily_budget": 10.0,
        "hourly_budget": 1.0
    })

    await optimizer.initialize()

    # Define API call function
    async def execute_request(request):
        # Your actual LLM call here
        return {
            "content": f"Response to {request['prompt']}",
            "model_used": "claude-3.5-sonnet",
            "cost": 0.015,
            "tokens_used": {"input": 100, "output": 200}
        }

    # Make optimized requests
    request = {
        "task_type": "mcq_generation",
        "prompt": "Generate a USMLE question about cardiac physiology"
    }

    # First call - API
    response1, info1 = await optimizer.optimize_request(
        request_data=request,
        execute_fn=execute_request,
        cache_strategy=CacheStrategy.HYBRID
    )
    print(f"First call - Cached: {info1['cached']}, Cost: ${info1.get('cost', 0)}")

    # Second identical call - Cached
    response2, info2 = await optimizer.optimize_request(
        request_data=request,
        execute_fn=execute_request
    )
    print(f"Second call - Cached: {info2['cached']}, Saved: ${info2.get('cost_saved', 0)}")

    # Get report
    report = await optimizer.get_optimization_report()
    print(f"\nCache hit rate: {report['cache_performance']['hit_rate']}")
    print(f"Total savings: {report['cost_metrics']['cost_savings']}")

    await optimizer.close()

asyncio.run(setup_cost_optimization())
```

### Step 4: Full Learning Session

```python
from learning_engine import AdaptiveLearningEngine, UserProfile, LearningStyle
from datetime import datetime, timedelta

async def run_learning_session():
    # Initialize components
    llm = LLMOrchestrator(config)
    rag = RAGRetriever({"url": "localhost", "port": 6333})
    engine = AdaptiveLearningEngine(llm, rag, {})

    # Create user profile
    user = UserProfile(
        user_id="john_doe",
        level=3,
        learning_style=LearningStyle.CLINICAL,
        weaknesses=["Cardiology", "Pharmacology"],
        study_hours_per_day=4,
        target_exam_date=datetime.now() + timedelta(days=90)
    )

    # Start session
    session = await engine.start_session(
        user_profile=user,
        focus_topics=["Cardiology"]
    )

    print(f"Session started: {session.session_id}")
    print(f"Focus topic: {session.current_topic}")

    # Teaching phase
    print("\n--- Teaching Phase ---")
    teaching = await engine.teach_concept(
        session, user, "Acute Myocardial Infarction"
    )
    print(teaching[:300])

    # Practice phase
    print("\n--- Practice Phase ---")
    for i in range(5):
        # Generate question
        question = await engine.generate_question(session, user)
        print(f"\nQuestion {i+1}:")
        print(question["vignette"])
        print(question["question"])
        for key, value in question["options"].items():
            print(f"{key}. {value}")

        # Simulate user answer (in real app, get from user input)
        user_answer = question["correct_answer"]  # Simulating correct answer

        # Process answer
        result = await engine.process_answer(
            session, user, question, user_answer, time_spent=75.0
        )

        print(f"\nResult: {'✓ Correct' if result['is_correct'] else '✗ Incorrect'}")
        print(result['feedback'][:200])

        if result['difficulty_adjusted']:
            print(f"Difficulty adjusted to: {result['new_difficulty']}")

    # Session analysis
    print("\n--- Session Analysis ---")
    analysis = await engine.analyze_session(session, user)
    print(f"Accuracy: {analysis['overall_performance']['accuracy']}")
    print(f"Knowledge gaps: {', '.join([gap['topic'] for gap in analysis['knowledge_gaps'][:3]])}")
    print(f"Recommendations:")
    for rec in analysis['learning_recommendations'][:3]:
        print(f"  - {rec['action']}")

    return session, user, analysis

# Run
session, user, analysis = asyncio.run(run_learning_session())
```

## API Endpoints (FastAPI)

Create `main.py`:

```python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import asyncio

from llm_integration import LLMOrchestrator
from rag_pipeline import RAGRetriever, MedicalDocumentProcessor, DocumentType
from learning_engine import AdaptiveLearningEngine, UserProfile, LearningStyle
from cost_optimizer import CostOptimizer

app = FastAPI(title="Medical Learning Platform API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
llm_orchestrator = None
rag_retriever = None
learning_engine = None
cost_optimizer = None

@app.on_event("startup")
async def startup():
    global llm_orchestrator, rag_retriever, learning_engine, cost_optimizer

    config = {
        "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY"),
        "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),
        "GOOGLE_API_KEY": os.getenv("GOOGLE_API_KEY")
    }

    llm_orchestrator = LLMOrchestrator(config)
    rag_retriever = RAGRetriever({"url": "qdrant", "port": 6333})
    learning_engine = AdaptiveLearningEngine(llm_orchestrator, rag_retriever, {})
    cost_optimizer = CostOptimizer({"redis_url": "redis://redis:6379"})
    await cost_optimizer.initialize()

# Request/Response Models
class StartSessionRequest(BaseModel):
    user_id: str
    focus_topics: Optional[List[str]] = None

class QuestionRequest(BaseModel):
    session_id: str
    user_id: str
    topic: Optional[str] = None

class AnswerRequest(BaseModel):
    session_id: str
    user_id: str
    question_id: str
    user_answer: str
    time_spent: float

# Endpoints
@app.post("/api/session/start")
async def start_session(request: StartSessionRequest):
    """Start a new learning session"""
    # Get user profile from database
    user = UserProfile(user_id=request.user_id)  # Simplified

    session = await learning_engine.start_session(user, request.focus_topics)

    return {
        "session_id": session.session_id,
        "current_topic": session.current_topic,
        "current_difficulty": session.current_difficulty
    }

@app.post("/api/question/generate")
async def generate_question(request: QuestionRequest):
    """Generate a practice question"""
    # Get session from cache/database
    # session = ...
    # user = ...

    question = await learning_engine.generate_question(session, user, request.topic)

    return question

@app.post("/api/answer/submit")
async def submit_answer(request: AnswerRequest):
    """Submit and process an answer"""
    # Get session and question from cache/database
    # session = ...
    # user = ...
    # question = ...

    result = await learning_engine.process_answer(
        session, user, question, request.user_answer, request.time_spent
    )

    return result

@app.get("/api/analytics/performance/{user_id}")
async def get_performance(user_id: str):
    """Get user performance analytics"""
    # Fetch from database
    return {
        "user_id": user_id,
        "overall_accuracy": 0.75,
        "topics_mastered": [],
        "knowledge_gaps": []
    }

@app.get("/api/optimization/report")
async def get_optimization_report():
    """Get cost optimization report"""
    report = await cost_optimizer.get_optimization_report()
    return report

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Monitoring & Optimization

### View Metrics

```bash
# Application logs
docker-compose logs -f app

# Prometheus metrics
open http://localhost:9090

# Grafana dashboards
open http://localhost:3001  # Login: admin/admin

# Cost optimization report
curl http://localhost:8000/api/optimization/report
```

### Cost Monitoring

```python
# Check budget status
async def check_budget():
    optimizer = CostOptimizer(...)
    await optimizer.initialize()

    status = await optimizer.get_budget_status()
    print(f"Daily budget: {status['daily']['spent']} / {status['daily']['limit']}")
    print(f"Remaining: {status['daily']['remaining']}")
    print(f"Usage: {status['daily']['percentage']}")
```

## Troubleshooting

### Common Issues

1. **API Rate Limits**
   - Enable semantic caching: Set `cache_threshold: 0.90` in config
   - Increase `coalescing_window_ms` to batch more requests
   - Adjust model routing to prefer cheaper models

2. **High Costs**
   - Review cost report: `/api/optimization/report`
   - Lower `daily_budget` to enforce limits
   - Increase cache TTL for frequently asked questions
   - Use GPT-4o-mini for simple tasks

3. **Slow Responses**
   - Enable Redis caching
   - Increase Qdrant memory allocation
   - Use response streaming
   - Optimize chunk sizes

4. **Vector Search Quality**
   - Adjust `similarity_threshold` in RAG config
   - Enable reranking: `use_reranking: true`
   - Try different chunking strategies
   - Fine-tune embedding model on medical content

## Production Deployment

```bash
# Update config for production
export ENVIRONMENT=production

# Start with production profile
docker-compose --profile production up -d

# Enable SSL
# Edit nginx.conf with SSL certificates

# Set up monitoring alerts
# Configure Prometheus alertmanager

# Enable auto-scaling (Kubernetes)
kubectl apply -f k8s/deployment.yaml
```

## Best Practices

1. **Cost Management**
   - Start with conservative budgets
   - Monitor cache hit rates (target >70%)
   - Route simple tasks to cheaper models
   - Use request coalescing for bulk operations

2. **Performance**
   - Pre-generate common questions during off-peak
   - Cache user profiles in Redis
   - Use async operations throughout
   - Batch database writes

3. **Quality**
   - Validate medical accuracy with RAG
   - Track user feedback on generated content
   - A/B test different prompts
   - Monitor error patterns

4. **Scalability**
   - Horizontal scaling with load balancer
   - Separate read/write databases
   - Use CDN for static content
   - Implement queue for heavy processing

## Next Steps

1. Implement user authentication (JWT)
2. Add frontend UI (React/Vue)
3. Set up CI/CD pipeline
4. Configure backup strategies
5. Implement A/B testing framework
6. Add audio/image support
7. Build mobile apps

## Support & Resources

- Architecture docs: `ai_architecture_overview.md`
- API documentation: http://localhost:8000/docs
- Monitoring: http://localhost:3001
- Issue tracking: GitHub Issues
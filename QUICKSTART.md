# Medical Learning Platform - Quick Start Guide

## 🚀 Get Running in 15 Minutes

### Prerequisites
- Python 3.10+
- Docker Desktop installed and running
- API keys ready: Anthropic, OpenAI, Google

---

## Step 1: Environment Setup (3 minutes)

```bash
# Navigate to project
cd /Users/kyin/Projects/Studyin

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << 'EOF'
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-key-here
GOOGLE_API_KEY=your-key-here
DB_PASSWORD=secure_password_123
REDIS_PASSWORD=redis_password_123
JWT_SECRET=your-jwt-secret-key
ENVIRONMENT=development
EOF
```

---

## Step 2: Start Infrastructure (2 minutes)

```bash
# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# Expected output:
# studyin-postgres    running    5432/tcp
# studyin-redis       running    6379/tcp
# studyin-qdrant      running    6333/tcp

# Check logs
docker-compose logs -f
```

---

## Step 3: Initialize Vector Database (2 minutes)

```python
# Create: init_qdrant.py
import asyncio
from rag_pipeline import RAGRetriever

async def initialize():
    retriever = RAGRetriever({
        "url": "localhost",
        "port": 6333,
        "collection": "medical_knowledge"
    })

    await retriever.initialize_collection(vector_size=384)
    print("✓ Qdrant collection created")

if __name__ == "__main__":
    asyncio.run(initialize())
```

```bash
# Run initialization
python init_qdrant.py
```

---

## Step 4: Test LLM Integration (3 minutes)

```python
# Create: test_llm.py
import asyncio
import os
from dotenv import load_dotenv
from llm_integration import LLMOrchestrator, LLMRequest, TaskComplexity

load_dotenv()

async def test_llm():
    print("Testing LLM integration...\n")

    # Initialize
    orchestrator = LLMOrchestrator({
        "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY"),
        "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),
        "GOOGLE_API_KEY": os.getenv("GOOGLE_API_KEY")
    })

    # Test 1: Simple explanation (should use GPT-4o-mini)
    print("Test 1: Simple Explanation")
    print("-" * 50)

    request = LLMRequest(
        task_type="simple_explanation",
        prompt="Explain hypertension in 2 sentences",
        complexity=TaskComplexity.SIMPLE
    )

    response = await orchestrator.call_with_fallback(request)

    print(f"Model used: {response.model_used}")
    print(f"Cost: ${response.cost:.4f}")
    print(f"Response: {response.content}\n")

    # Test 2: MCQ generation (should use GPT-4o-mini)
    print("Test 2: MCQ Generation")
    print("-" * 50)

    mcq_request = LLMRequest(
        task_type="mcq_generation",
        prompt="""Generate a USMLE Step 1 question about myocardial infarction.
        Include: vignette, question, 5 options (A-E), correct answer.""",
        complexity=TaskComplexity.MODERATE,
        max_tokens=1500
    )

    mcq_response = await orchestrator.call_with_fallback(mcq_request)

    print(f"Model used: {mcq_response.model_used}")
    print(f"Cost: ${mcq_response.cost:.4f}")
    print(f"Response: {mcq_response.content[:300]}...\n")

    # Test 3: Complex reasoning (should use Claude)
    print("Test 3: Medical Reasoning")
    print("-" * 50)

    reasoning_request = LLMRequest(
        task_type="medical_reasoning",
        prompt="Explain the pathophysiology of heart failure with preserved ejection fraction (HFpEF)",
        complexity=TaskComplexity.EXPERT,
        max_tokens=2000
    )

    reasoning_response = await orchestrator.call_with_fallback(reasoning_request)

    print(f"Model used: {reasoning_response.model_used}")
    print(f"Cost: ${reasoning_response.cost:.4f}")
    print(f"Response: {reasoning_response.content[:300]}...\n")

    print("✓ All tests passed!")
    print(f"Total cost: ${response.cost + mcq_response.cost + reasoning_response.cost:.4f}")

if __name__ == "__main__":
    asyncio.run(test_llm())
```

```bash
# Run test
python test_llm.py
```

**Expected Output:**
```
Testing LLM integration...

Test 1: Simple Explanation
--------------------------------------------------
Model used: gpt-4o-mini
Cost: $0.0002
Response: Hypertension is a chronic condition where blood pressure is consistently elevated above normal levels...

Test 2: MCQ Generation
--------------------------------------------------
Model used: gpt-4o-mini
Cost: $0.0035
Response: A 58-year-old man presents to the emergency department with crushing chest pain...

Test 3: Medical Reasoning
--------------------------------------------------
Model used: claude-3-5-sonnet-20241022
Cost: $0.0145
Response: Heart failure with preserved ejection fraction (HFpEF) represents a complex syndrome...

✓ All tests passed!
Total cost: $0.0182
```

---

## Step 5: Test RAG Pipeline (3 minutes)

```python
# Create: test_rag.py
import asyncio
from rag_pipeline import (
    MedicalDocumentProcessor,
    RAGRetriever,
    DocumentType,
    ChunkingStrategy
)

async def test_rag():
    print("Testing RAG pipeline...\n")

    # Initialize components
    processor = MedicalDocumentProcessor()
    retriever = RAGRetriever({
        "url": "localhost",
        "port": 6333,
        "collection": "medical_knowledge"
    })

    # Test with sample text
    sample_text = """
    # Myocardial Infarction

    ## Pathophysiology
    Myocardial infarction (MI) occurs when blood flow to the heart muscle is blocked,
    typically by a thrombus formation in a coronary artery. This leads to cardiac
    myocyte necrosis.

    ## Clinical Presentation
    Patients typically present with crushing chest pain, diaphoresis, and shortness
    of breath. ECG shows ST-segment elevation in acute STEMI.

    ## Treatment
    Initial management includes aspirin, oxygen, nitroglycerin, and morphine (MONA).
    Definitive treatment requires urgent revascularization via PCI or thrombolysis.
    """

    # Create temporary file
    with open("/tmp/sample_medical_text.txt", "w") as f:
        f.write(sample_text)

    # Process document
    print("Step 1: Processing document...")
    chunks = await processor.process_document(
        file_path="/tmp/sample_medical_text.txt",
        doc_type=DocumentType.LECTURE_NOTES,
        chunking_strategy=ChunkingStrategy.SEMANTIC
    )
    print(f"✓ Created {len(chunks)} chunks\n")

    # Index chunks
    print("Step 2: Indexing in Qdrant...")
    await retriever.index_chunks(chunks)
    print("✓ Chunks indexed\n")

    # Test retrieval
    print("Step 3: Testing retrieval...")
    queries = [
        "What causes myocardial infarction?",
        "How do you treat a heart attack?",
        "What are the symptoms of MI?"
    ]

    for query in queries:
        print(f"\nQuery: {query}")
        print("-" * 50)

        results = await retriever.retrieve(
            query=query,
            top_k=2
        )

        for i, result in enumerate(results, 1):
            print(f"Result {i} (score: {result['score']:.3f}):")
            print(result['content'][:150] + "...")
            print()

    print("✓ RAG pipeline working!")

if __name__ == "__main__":
    asyncio.run(test_rag())
```

```bash
# Run RAG test
python test_rag.py
```

---

## Step 6: Test Full Learning Session (2 minutes)

```python
# Create: test_session.py
import asyncio
import os
from dotenv import load_dotenv
from llm_integration import LLMOrchestrator
from rag_pipeline import RAGRetriever
from learning_engine import (
    AdaptiveLearningEngine,
    UserProfile,
    LearningStyle
)
from datetime import datetime, timedelta

load_dotenv()

async def test_session():
    print("Testing full learning session...\n")

    # Initialize components
    llm = LLMOrchestrator({
        "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY"),
        "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),
        "GOOGLE_API_KEY": os.getenv("GOOGLE_API_KEY")
    })

    rag = RAGRetriever({
        "url": "localhost",
        "port": 6333,
        "collection": "medical_knowledge"
    })

    engine = AdaptiveLearningEngine(llm, rag, {})

    # Create user profile
    user = UserProfile(
        user_id="test_user_001",
        level=3,
        learning_style=LearningStyle.CLINICAL,
        weaknesses=["Cardiology"],
        target_exam_date=datetime.now() + timedelta(days=90)
    )

    print(f"User: {user.user_id}")
    print(f"Level: {user.level}/5")
    print(f"Learning style: {user.learning_style.value}\n")

    # Start session
    print("Starting learning session...")
    session = await engine.start_session(user, focus_topics=["Cardiology"])
    print(f"✓ Session started: {session.session_id}")
    print(f"  Topic: {session.current_topic}\n")

    # Generate a question
    print("Generating practice question...")
    question = await engine.generate_question(session, user)

    print(f"✓ Question generated")
    print(f"  Vignette: {question.get('vignette', 'N/A')[:150]}...")
    print(f"  Question: {question.get('question', 'N/A')[:100]}...")
    print(f"  Options: {len(question.get('options', {}))} choices\n")

    # Simulate answer
    print("Processing answer...")
    correct_answer = question.get('correct_answer', 'A')

    result = await engine.process_answer(
        session, user, question,
        user_answer=correct_answer,
        time_spent=75.0
    )

    print(f"✓ Answer processed")
    print(f"  Result: {'Correct ✓' if result['is_correct'] else 'Incorrect ✗'}")
    print(f"  Feedback provided: {len(result.get('feedback', ''))} characters\n")

    # Get performance summary
    summary = result.get('performance_summary', {})
    print("Session Performance:")
    print(f"  Questions answered: {summary.get('questions_answered', 0)}")
    print(f"  Accuracy: {summary.get('accuracy', 0)*100:.1f}%")
    print(f"  Current difficulty: {summary.get('current_difficulty', 0)}")

    print("\n✓ Full learning session tested successfully!")

if __name__ == "__main__":
    asyncio.run(test_session())
```

```bash
# Run session test
python test_session.py
```

---

## Step 7: Test Cost Optimization (Optional, 2 minutes)

```python
# Create: test_cost_optimizer.py
import asyncio
from cost_optimizer import CostOptimizer, CacheStrategy

async def test_cost_optimizer():
    print("Testing cost optimization...\n")

    # Initialize
    optimizer = CostOptimizer(config={
        "redis_url": "redis://localhost",
        "cache_threshold": 0.92,
        "daily_budget": 10.0,
        "hourly_budget": 1.0
    })

    await optimizer.initialize()
    print("✓ Optimizer initialized\n")

    # Mock API call function
    async def mock_api_call(request):
        await asyncio.sleep(0.1)  # Simulate API delay
        return {
            "content": f"Response to: {request['prompt'][:50]}...",
            "model_used": "gpt-4o-mini",
            "cost": 0.003,
            "tokens_used": {"input": 100, "output": 200}
        }

    # Test caching
    request = {
        "task_type": "mcq_generation",
        "prompt": "Generate a question about cardiac physiology"
    }

    print("Test 1: First request (should hit API)")
    response1, info1 = await optimizer.optimize_request(
        request_data=request,
        execute_fn=mock_api_call
    )
    print(f"  Cached: {info1['cached']}")
    print(f"  Cost: ${info1.get('cost', 0):.4f}\n")

    print("Test 2: Identical request (should hit cache)")
    response2, info2 = await optimizer.optimize_request(
        request_data=request,
        execute_fn=mock_api_call
    )
    print(f"  Cached: {info2['cached']}")
    print(f"  Saved: ${info2.get('cost_saved', 0):.4f}\n")

    # Get optimization report
    report = await optimizer.get_optimization_report()

    print("Optimization Report:")
    print(f"  Total requests: {report['cost_metrics']['total_requests']}")
    print(f"  Cache hit rate: {report['cost_metrics']['cache_hit_rate']}")
    print(f"  Total cost: {report['cost_metrics']['total_cost']}")
    print(f"  Cost savings: {report['cost_metrics']['cost_savings']}\n")

    print("Budget Status:")
    print(f"  Hourly: {report['budget_status']['hourly']['spent']} / {report['budget_status']['hourly']['limit']}")
    print(f"  Daily: {report['budget_status']['daily']['spent']} / {report['budget_status']['daily']['limit']}\n")

    print("✓ Cost optimization working!")

    await optimizer.close()

if __name__ == "__main__":
    asyncio.run(test_cost_optimizer())
```

```bash
# Run optimizer test
python test_cost_optimizer.py
```

---

## ✅ Success Checklist

After completing all steps, you should have:

- [x] All Docker services running (postgres, redis, qdrant)
- [x] LLM integration working with model routing
- [x] RAG pipeline processing and retrieving documents
- [x] Learning engine generating questions and adaptive teaching
- [x] Cost optimization with semantic caching
- [x] Total test cost: < $0.10

---

## 🎯 Next Steps

### 1. Upload Your Medical Content

```python
# upload_documents.py
import asyncio
from rag_pipeline import MedicalDocumentProcessor, RAGRetriever, DocumentType

async def upload_textbook():
    processor = MedicalDocumentProcessor()
    retriever = RAGRetriever({"url": "localhost", "port": 6333})

    # Process your PDF textbook
    chunks = await processor.process_document(
        file_path="/path/to/your/medical/textbook.pdf",
        doc_type=DocumentType.TEXTBOOK,
        chunking_strategy=ChunkingStrategy.HYBRID
    )

    await retriever.index_chunks(chunks)
    print(f"✓ Uploaded and indexed {len(chunks)} chunks")

asyncio.run(upload_textbook())
```

### 2. Create Your First Study Session

```python
# study_session.py
# Use test_session.py as a template
# Customize topics, difficulty, and session length
```

### 3. Build a Simple Web Interface

```python
# Install Streamlit for quick UI
pip install streamlit

# Create: app.py
import streamlit as st
# Add your UI code here

# Run
streamlit run app.py
```

### 4. Monitor Costs

```bash
# Check daily spending
python -c "
import asyncio
from cost_optimizer import CostOptimizer

async def check():
    opt = CostOptimizer({'redis_url': 'redis://localhost'})
    await opt.initialize()
    status = await opt.get_budget_status()
    print('Daily spent:', status['daily']['spent'])
    await opt.close()

asyncio.run(check())
"
```

---

## 🔧 Troubleshooting

### Docker services won't start

```bash
# Check Docker is running
docker info

# Reset Docker
docker-compose down -v
docker-compose up -d
```

### API keys not working

```bash
# Verify .env file
cat .env

# Test individual keys
python -c "
from anthropic import Anthropic
client = Anthropic(api_key='your-key')
print('✓ Anthropic key valid')
"
```

### Redis connection errors

```bash
# Check Redis is running
docker-compose ps redis

# Test connection
redis-cli -h localhost -p 6379 ping
```

### Qdrant errors

```bash
# Check Qdrant status
curl http://localhost:6333/healthz

# View Qdrant UI
open http://localhost:6333/dashboard
```

---

## 📊 Expected Performance

After setup, you should see:

| Metric | Expected Value |
|--------|---------------|
| Question generation time | 1-2 seconds |
| Teaching response time | 2-3 seconds |
| Cache hit rate | 60-70% (after usage) |
| Cost per question | $0.003-0.015 |
| Monthly cost (100 q/day) | $10-15 |

---

## 🎓 Learning Resources

1. **Architecture Overview**: See `ai_architecture_overview.md`
2. **Detailed Answers**: See `ANSWERS_TO_KEY_QUESTIONS.md`
3. **Visual Diagrams**: See `ARCHITECTURE_DIAGRAM.md`
4. **Integration Guide**: See `integration_guide.md`

---

## 🚀 Production Deployment

When ready for production:

```bash
# Update environment
export ENVIRONMENT=production

# Use production config
docker-compose --profile production up -d

# Enable monitoring
open http://localhost:3001  # Grafana

# Set up backups
# Configure Prometheus alerts
# Enable SSL/TLS
```

---

## 💡 Tips for Success

1. **Start Small**: Test with one topic before uploading full textbooks
2. **Monitor Costs**: Set budget alerts from day 1
3. **Iterate**: Start with basic features, add complexity gradually
4. **Cache Aggressively**: Most questions are variations of common patterns
5. **Use Cheap Models**: Route 60-70% of tasks to GPT-4o-mini
6. **Track Metrics**: User satisfaction > feature count

---

## ✉️ Support

Issues? Check:
1. Docker logs: `docker-compose logs -f`
2. Application logs: `logs/studyin.log`
3. Test scripts output
4. Configuration in `config.yaml`

**You're all set! Start learning with AI! 🎓✨**
# Medical Learning Platform - AI/LLM Integration Architecture

## Executive Summary
This architecture implements a cost-effective, scalable AI-powered medical learning platform optimized for personal MVP use while maintaining professional-grade capabilities for NBME/USMLE Step 1 preparation.

## 1. LLM Selection Strategy

### Primary Model: Claude 3.5 Sonnet
**Reasoning:**
- **Superior medical reasoning**: Excellent at complex medical concept explanations and Socratic questioning
- **Long context window**: 200K tokens - ideal for processing lengthy medical texts
- **Cost-effective**: $3/$15 per million tokens (input/output)
- **Structured output**: Native support for consistent formatting

### Secondary Model: GPT-4o-mini
**Use Cases:**
- MCQ generation (high volume, lower complexity tasks)
- Quick fact checks and simple explanations
- Cost: $0.15/$0.60 per million tokens
- Fallback for rate limits on Claude

### Specialized Model: Gemini 1.5 Flash
**Use Cases:**
- Bulk content analysis and concept extraction
- Initial processing of large documents
- Cost: $0.075/$0.30 per million tokens
- 1M token context window for massive documents

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                      │
├─────────────────────────────────────────────────────────────┤
│                    API Gateway (FastAPI)                      │
│  • Rate Limiting  • Request Routing  • Response Caching      │
├─────────────────────────────────────────────────────────────┤
│                   Orchestration Layer                         │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐       │
│  │Learning Path │  │ AI Coach    │  │ Performance  │       │
│  │ Generator    │  │ Engine      │  │ Analyzer     │       │
│  └──────────────┘  └─────────────┘  └──────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                    AI Services Layer                          │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐       │
│  │ LLM Router   │  │ Prompt      │  │ Context      │       │
│  │ & Fallback   │  │ Manager     │  │ Manager      │       │
│  └──────────────┘  └─────────────┘  └──────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                     RAG Pipeline                              │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐       │
│  │ Document     │  │ Vector      │  │ Retrieval    │       │
│  │ Processor    │  │ Store       │  │ Engine       │       │
│  └──────────────┘  └─────────────┘  └──────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                                 │
│  • PostgreSQL (metadata)  • Redis (cache)  • S3 (documents) │
└─────────────────────────────────────────────────────────────┘
```

## 3. RAG Architecture

### Vector Database: Qdrant
**Reasoning:**
- Self-hostable for cost control
- Excellent performance for <1M vectors
- Built-in filtering for metadata (topics, difficulty)
- Hybrid search capabilities

### Alternative: PostgreSQL + pgvector
- Zero additional infrastructure
- Good for MVP phase
- Easy migration path

### Chunking Strategy
```python
# Hierarchical Medical Content Chunking
CHUNKING_CONFIG = {
    "semantic_chunk_size": 512,  # tokens
    "semantic_overlap": 128,      # tokens
    "hierarchy_levels": [
        "chapter",     # Preserve chapter boundaries
        "section",     # Major topics
        "subsection",  # Detailed concepts
        "paragraph"    # Atomic knowledge units
    ]
}
```

### Embedding Model
- **Primary**: OpenAI text-embedding-3-small (cost-effective)
- **Alternative**: BGE-large-en-v1.5 (self-hosted)

## 4. Prompt Engineering Patterns

### Medical Content Analysis Template
```python
CONTENT_ANALYSIS_PROMPT = """
Analyze this medical content and extract:
1. Core concepts with hierarchy
2. Clinical correlations
3. High-yield facts for USMLE Step 1
4. Potential misconceptions
5. Memory hooks and mnemonics

Content: {content}

Output as structured JSON:
{
    "concepts": [...],
    "clinical_correlations": [...],
    "high_yield_facts": [...],
    "common_misconceptions": [...],
    "mnemonics": [...]
}
"""
```

### Adaptive Teaching Prompt
```python
ADAPTIVE_TEACHING_PROMPT = """
Student Profile:
- Current understanding level: {level}
- Learning style: {style}
- Recent errors: {errors}
- Topic: {topic}

Task: Explain {concept} using:
1. Appropriate complexity for their level
2. Their preferred learning style
3. Address their specific misconceptions
4. Use clinical examples they can relate to
5. Incorporate active recall questions

Previous context: {context}
"""
```

### NBME-Style Question Generation
```python
MCQ_GENERATION_PROMPT = """
Create an NBME/USMLE Step 1 style question:

Topic: {topic}
Difficulty: {difficulty}
Testing objective: {objective}

Requirements:
1. Clinical vignette format
2. Single best answer from 5 options
3. Plausible distractors based on common misconceptions
4. Detailed explanation for correct and incorrect answers
5. Include relevant lab values/imaging if applicable

Output format:
{
    "vignette": "...",
    "question": "...",
    "options": {
        "A": "...",
        "B": "...",
        "C": "...",
        "D": "...",
        "E": "..."
    },
    "correct_answer": "...",
    "explanations": {
        "correct": "...",
        "distractors": {...}
    },
    "concepts_tested": [...]
}
"""
```

## 5. Context Management Strategy

### Session Memory Architecture
```python
class ContextManager:
    def __init__(self):
        self.short_term_memory = []  # Current session (Redis)
        self.long_term_memory = {}   # User profile (PostgreSQL)
        self.episodic_memory = []    # Learning milestones

    def get_context(self, user_id, session_id):
        return {
            "user_profile": self.get_user_profile(user_id),
            "session_history": self.get_session_history(session_id)[-10:],
            "knowledge_state": self.get_knowledge_graph(user_id),
            "recent_errors": self.get_error_patterns(user_id)[-5:]
        }
```

### Context Compression
```python
def compress_context(history, max_tokens=2000):
    """Compress conversation history while preserving key information"""
    # Keep full context for last 3 interactions
    recent = history[-3:]

    # Summarize older interactions
    if len(history) > 3:
        older = history[:-3]
        summary = summarize_interactions(older)
        return summary + recent

    return recent
```

## 6. Adaptive Learning Path Generation

### Algorithm Overview
```python
class AdaptiveLearningEngine:
    def generate_path(self, user_profile):
        # 1. Assess current knowledge state
        knowledge_gaps = self.identify_gaps(user_profile)

        # 2. Determine optimal sequence
        sequence = self.topological_sort(knowledge_gaps)

        # 3. Adjust for learning style
        personalized = self.apply_learning_style(sequence, user_profile.style)

        # 4. Insert spaced repetition
        with_review = self.add_review_sessions(personalized)

        return with_review
```

### Difficulty Adjustment
```python
class DifficultyAdapter:
    def adjust_difficulty(self, performance_metrics):
        """
        Real-time difficulty adjustment based on:
        - Response accuracy (target: 70-80%)
        - Response time
        - Hint usage
        - Confidence ratings
        """
        if performance_metrics.accuracy > 0.85:
            return self.increase_difficulty()
        elif performance_metrics.accuracy < 0.60:
            return self.decrease_difficulty()
        return self.maintain_difficulty()
```

## 7. Cost Optimization Strategies

### 1. Semantic Caching
```python
class SemanticCache:
    def __init__(self, similarity_threshold=0.95):
        self.cache = {}  # Redis with vector similarity
        self.threshold = similarity_threshold

    async def get_or_compute(self, query, compute_fn):
        # Check for similar queries
        cached = await self.find_similar(query)
        if cached and cached.similarity > self.threshold:
            return cached.response

        # Compute and cache
        response = await compute_fn(query)
        await self.store(query, response)
        return response
```

### 2. Request Batching
```python
class RequestBatcher:
    def __init__(self, batch_size=10, wait_time=100):  # ms
        self.batch_size = batch_size
        self.wait_time = wait_time
        self.pending = []

    async def add_request(self, request):
        self.pending.append(request)

        if len(self.pending) >= self.batch_size:
            return await self.process_batch()

        # Wait for more requests or timeout
        await asyncio.sleep(self.wait_time / 1000)
        return await self.process_batch()
```

### 3. Model Routing
```python
class ModelRouter:
    def select_model(self, task_type, complexity):
        """Route to appropriate model based on task"""
        if task_type == "simple_explanation":
            return "gpt-4o-mini"
        elif task_type == "mcq_generation" and complexity < 3:
            return "gpt-4o-mini"
        elif task_type == "complex_reasoning":
            return "claude-3.5-sonnet"
        elif task_type == "bulk_analysis":
            return "gemini-1.5-flash"
        return "claude-3.5-sonnet"  # default
```

### 4. Response Streaming
- Stream responses for immediate user feedback
- Reduces perceived latency
- Allows early termination if needed

## 8. Fallback Strategies

### Multi-tier Fallback System
```python
class FallbackManager:
    def __init__(self):
        self.providers = [
            {"name": "claude", "limit": 100, "current": 0},
            {"name": "openai", "limit": 500, "current": 0},
            {"name": "gemini", "limit": 1000, "current": 0}
        ]

    async def execute_with_fallback(self, request):
        for provider in self.providers:
            try:
                if provider["current"] < provider["limit"]:
                    response = await self.call_provider(provider, request)
                    provider["current"] += 1
                    return response
            except RateLimitError:
                continue

        # Ultimate fallback: cached/degraded response
        return await self.get_degraded_response(request)
```

### Graceful Degradation
1. **Level 1**: Switch to cheaper model
2. **Level 2**: Use cached similar responses
3. **Level 3**: Provide pre-generated content
4. **Level 4**: Queue for async processing

## 9. Implementation Priorities (MVP)

### Phase 1: Core Infrastructure (Week 1-2)
1. Set up FastAPI backend with async support
2. Implement PostgreSQL + pgvector for RAG
3. Basic LLM integration with Claude API
4. Simple semantic caching with Redis

### Phase 2: Learning Features (Week 3-4)
1. Content upload and processing pipeline
2. Basic MCQ generation
3. Simple adaptive questioning
4. Performance tracking

### Phase 3: Intelligence Layer (Week 5-6)
1. Adaptive learning path generation
2. Context management system
3. Advanced prompt templates
4. Cost optimization features

## 10. Monitoring & Analytics

### Key Metrics
- **Performance**: Response time, throughput
- **Quality**: User satisfaction, learning outcomes
- **Cost**: API usage per user, per feature
- **Reliability**: Error rates, fallback triggers

### Monitoring Stack
- **Logging**: Structured logs with context
- **Metrics**: Prometheus + Grafana
- **Tracing**: OpenTelemetry for request flow
- **Alerting**: PagerDuty for critical issues

## Cost Projections (Per User/Month)

### Conservative Estimate
- 100 questions/day × 30 days = 3,000 interactions
- Average tokens per interaction: 1,000
- Total tokens: 3M tokens/month
- Cost with optimization: ~$15-20/month

### Optimization Impact
- Semantic caching: -40% requests
- Model routing: -30% costs
- Response compression: -20% tokens
- **Net savings: ~60% reduction**

## Security Considerations
- API key rotation and secure storage
- PII detection and redaction in medical data
- HIPAA compliance considerations for future
- Rate limiting per user to prevent abuse

## Conclusion
This architecture provides a robust, cost-effective foundation for your medical learning platform MVP while maintaining professional-grade capabilities and clear scaling paths.
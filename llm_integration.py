"""
Medical Learning Platform - LLM Integration Layer
Handles multi-model orchestration, fallback strategies, and cost optimization
"""

import asyncio
import json
import hashlib
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import numpy as np
from pydantic import BaseModel, Field

# LLM Provider Imports (install with: pip install anthropic openai google-generativeai)
from anthropic import AsyncAnthropic
from openai import AsyncOpenAI
import google.generativeai as genai

# For caching and rate limiting
import redis.asyncio as redis
from functools import wraps
import backoff


class ModelType(Enum):
    """Available LLM models with their characteristics"""
    CLAUDE_35_SONNET = "claude-3-5-sonnet-20241022"
    GPT_4O_MINI = "gpt-4o-mini"
    GPT_4O = "gpt-4o"
    GEMINI_15_FLASH = "gemini-1.5-flash"
    GEMINI_15_PRO = "gemini-1.5-pro"


@dataclass
class ModelConfig:
    """Configuration for each model"""
    name: str
    provider: str
    input_cost: float  # per 1M tokens
    output_cost: float  # per 1M tokens
    max_tokens: int
    rate_limit: int  # requests per minute
    complexity_threshold: float  # 0-1, higher = more complex tasks
    use_cases: List[str] = field(default_factory=list)


class TaskComplexity(Enum):
    """Task complexity levels for model routing"""
    SIMPLE = 1      # Basic explanations, fact checks
    MODERATE = 2    # MCQ generation, simple reasoning
    COMPLEX = 3     # Socratic teaching, complex analysis
    EXPERT = 4      # Medical reasoning, adaptive learning


# Model configurations
MODEL_CONFIGS = {
    ModelType.CLAUDE_35_SONNET: ModelConfig(
        name="Claude 3.5 Sonnet",
        provider="anthropic",
        input_cost=3.0,
        output_cost=15.0,
        max_tokens=200000,
        rate_limit=50,
        complexity_threshold=0.6,
        use_cases=["medical_reasoning", "socratic_teaching", "complex_analysis"]
    ),
    ModelType.GPT_4O_MINI: ModelConfig(
        name="GPT-4o-mini",
        provider="openai",
        input_cost=0.15,
        output_cost=0.60,
        max_tokens=128000,
        rate_limit=500,
        complexity_threshold=0.3,
        use_cases=["mcq_generation", "simple_explanations", "fact_checking"]
    ),
    ModelType.GEMINI_15_FLASH: ModelConfig(
        name="Gemini 1.5 Flash",
        provider="google",
        input_cost=0.075,
        output_cost=0.30,
        max_tokens=1000000,
        rate_limit=100,
        complexity_threshold=0.4,
        use_cases=["bulk_analysis", "document_processing", "concept_extraction"]
    )
}


class LLMRequest(BaseModel):
    """Standard request format for LLM calls"""
    task_type: str
    prompt: str
    context: Optional[Dict[str, Any]] = None
    max_tokens: Optional[int] = 2000
    temperature: Optional[float] = 0.7
    complexity: TaskComplexity = TaskComplexity.MODERATE
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class LLMResponse(BaseModel):
    """Standard response format from LLM calls"""
    content: str
    model_used: str
    tokens_used: Dict[str, int]  # {"input": x, "output": y}
    latency_ms: float
    cost: float
    cached: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SemanticCache:
    """Semantic caching for similar queries"""

    def __init__(self, redis_client: redis.Redis, similarity_threshold: float = 0.92):
        self.redis = redis_client
        self.threshold = similarity_threshold
        self.embedding_model = None  # Initialize with embedding model

    def _generate_cache_key(self, prompt: str, task_type: str) -> str:
        """Generate cache key from prompt and task type"""
        content = f"{task_type}:{prompt}"
        return hashlib.sha256(content.encode()).hexdigest()

    async def get(self, request: LLMRequest) -> Optional[LLMResponse]:
        """Retrieve cached response if available"""
        cache_key = self._generate_cache_key(request.prompt, request.task_type)

        cached = await self.redis.get(f"llm_cache:{cache_key}")
        if cached:
            response = LLMResponse.parse_raw(cached)
            response.cached = True
            return response

        # For semantic similarity, we'd need to:
        # 1. Generate embedding for current prompt
        # 2. Search similar embeddings in vector store
        # 3. Return if similarity > threshold

        return None

    async def set(self, request: LLMRequest, response: LLMResponse, ttl: int = 3600):
        """Store response in cache"""
        cache_key = self._generate_cache_key(request.prompt, request.task_type)
        await self.redis.setex(
            f"llm_cache:{cache_key}",
            ttl,
            response.json()
        )


class ModelRouter:
    """Intelligent routing to appropriate models based on task"""

    def __init__(self):
        self.usage_tracker = {}  # Track usage per model
        self.performance_history = {}  # Track model performance

    def select_model(self, request: LLMRequest) -> ModelType:
        """Select optimal model based on task characteristics"""

        # Task-specific routing
        task_model_map = {
            "mcq_generation": ModelType.GPT_4O_MINI,
            "socratic_teaching": ModelType.CLAUDE_35_SONNET,
            "bulk_analysis": ModelType.GEMINI_15_FLASH,
            "medical_reasoning": ModelType.CLAUDE_35_SONNET,
            "simple_explanation": ModelType.GPT_4O_MINI,
            "concept_extraction": ModelType.GEMINI_15_FLASH,
        }

        # Check if we have a specific model for this task
        if request.task_type in task_model_map:
            return task_model_map[request.task_type]

        # Complexity-based routing
        if request.complexity == TaskComplexity.EXPERT:
            return ModelType.CLAUDE_35_SONNET
        elif request.complexity == TaskComplexity.SIMPLE:
            return ModelType.GPT_4O_MINI
        elif request.complexity == TaskComplexity.MODERATE:
            # Balance between cost and quality
            return ModelType.GPT_4O_MINI

        return ModelType.CLAUDE_35_SONNET  # Default to most capable

    def get_fallback_sequence(self, primary_model: ModelType) -> List[ModelType]:
        """Get fallback model sequence"""
        fallback_map = {
            ModelType.CLAUDE_35_SONNET: [
                ModelType.GPT_4O,
                ModelType.GEMINI_15_PRO,
                ModelType.GPT_4O_MINI
            ],
            ModelType.GPT_4O_MINI: [
                ModelType.GEMINI_15_FLASH,
                ModelType.CLAUDE_35_SONNET
            ],
            ModelType.GEMINI_15_FLASH: [
                ModelType.GPT_4O_MINI,
                ModelType.CLAUDE_35_SONNET
            ]
        }
        return fallback_map.get(primary_model, [ModelType.GPT_4O_MINI])


class LLMOrchestrator:
    """Main orchestration class for LLM operations"""

    def __init__(self, config: Dict[str, str]):
        # Initialize providers
        self.anthropic = AsyncAnthropic(api_key=config.get("ANTHROPIC_API_KEY"))
        self.openai = AsyncOpenAI(api_key=config.get("OPENAI_API_KEY"))
        genai.configure(api_key=config.get("GOOGLE_API_KEY"))

        # Initialize components
        self.router = ModelRouter()
        self.cache = None  # Initialize with Redis connection
        self.rate_limiters = {}  # Per-model rate limiters

    @backoff.on_exception(
        backoff.expo,
        Exception,
        max_tries=3,
        max_time=30
    )
    async def call_with_fallback(self, request: LLMRequest) -> LLMResponse:
        """Execute request with automatic fallback on failure"""

        # Check cache first
        if self.cache:
            cached_response = await self.cache.get(request)
            if cached_response:
                return cached_response

        # Select primary model
        primary_model = self.router.select_model(request)
        models_to_try = [primary_model] + self.router.get_fallback_sequence(primary_model)

        last_error = None
        for model in models_to_try:
            try:
                response = await self._call_model(model, request)

                # Cache successful response
                if self.cache:
                    await self.cache.set(request, response)

                return response

            except Exception as e:
                last_error = e
                print(f"Model {model} failed: {str(e)}, trying fallback...")
                continue

        # All models failed, return degraded response
        return self._get_degraded_response(request, last_error)

    async def _call_model(self, model: ModelType, request: LLMRequest) -> LLMResponse:
        """Call specific model with request"""
        start_time = datetime.now()
        config = MODEL_CONFIGS[model]

        if config.provider == "anthropic":
            response = await self._call_anthropic(model, request)
        elif config.provider == "openai":
            response = await self._call_openai(model, request)
        elif config.provider == "google":
            response = await self._call_gemini(model, request)
        else:
            raise ValueError(f"Unknown provider: {config.provider}")

        # Calculate metrics
        latency_ms = (datetime.now() - start_time).total_seconds() * 1000
        cost = self._calculate_cost(response, config)

        response.latency_ms = latency_ms
        response.cost = cost
        response.model_used = model.value

        return response

    async def _call_anthropic(self, model: ModelType, request: LLMRequest) -> LLMResponse:
        """Call Anthropic Claude API"""
        response = await self.anthropic.messages.create(
            model=model.value,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            messages=[
                {"role": "user", "content": request.prompt}
            ]
        )

        return LLMResponse(
            content=response.content[0].text,
            model_used=model.value,
            tokens_used={
                "input": response.usage.input_tokens,
                "output": response.usage.output_tokens
            },
            latency_ms=0,  # Will be set by caller
            cost=0,  # Will be calculated by caller
            metadata={"stop_reason": response.stop_reason}
        )

    async def _call_openai(self, model: ModelType, request: LLMRequest) -> LLMResponse:
        """Call OpenAI API"""
        response = await self.openai.chat.completions.create(
            model=model.value,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            messages=[
                {"role": "user", "content": request.prompt}
            ]
        )

        return LLMResponse(
            content=response.choices[0].message.content,
            model_used=model.value,
            tokens_used={
                "input": response.usage.prompt_tokens,
                "output": response.usage.completion_tokens
            },
            latency_ms=0,
            cost=0,
            metadata={"finish_reason": response.choices[0].finish_reason}
        )

    async def _call_gemini(self, model: ModelType, request: LLMRequest) -> LLMResponse:
        """Call Google Gemini API"""
        gemini_model = genai.GenerativeModel(model.value)
        response = await gemini_model.generate_content_async(
            request.prompt,
            generation_config={
                "temperature": request.temperature,
                "max_output_tokens": request.max_tokens,
            }
        )

        # Estimate token counts for Gemini (not provided directly)
        input_tokens = len(request.prompt.split()) * 1.3  # Rough estimate
        output_tokens = len(response.text.split()) * 1.3

        return LLMResponse(
            content=response.text,
            model_used=model.value,
            tokens_used={
                "input": int(input_tokens),
                "output": int(output_tokens)
            },
            latency_ms=0,
            cost=0,
            metadata={}
        )

    def _calculate_cost(self, response: LLMResponse, config: ModelConfig) -> float:
        """Calculate cost for the API call"""
        input_cost = (response.tokens_used["input"] / 1_000_000) * config.input_cost
        output_cost = (response.tokens_used["output"] / 1_000_000) * config.output_cost
        return round(input_cost + output_cost, 6)

    def _get_degraded_response(self, request: LLMRequest, error: Exception) -> LLMResponse:
        """Return degraded response when all models fail"""
        return LLMResponse(
            content="I'm currently experiencing high demand. Please try again in a moment or try a simpler question.",
            model_used="fallback",
            tokens_used={"input": 0, "output": 0},
            latency_ms=0,
            cost=0,
            metadata={
                "error": str(error),
                "degraded": True,
                "original_task": request.task_type
            }
        )


class RequestBatcher:
    """Batch multiple requests for efficiency"""

    def __init__(self, batch_size: int = 10, wait_time_ms: int = 100):
        self.batch_size = batch_size
        self.wait_time_ms = wait_time_ms
        self.pending_requests: List[LLMRequest] = []
        self.pending_futures: List[asyncio.Future] = []

    async def add_request(self, request: LLMRequest) -> LLMResponse:
        """Add request to batch and wait for response"""
        future = asyncio.Future()
        self.pending_requests.append(request)
        self.pending_futures.append(future)

        if len(self.pending_requests) >= self.batch_size:
            await self._process_batch()
        else:
            # Wait for more requests or timeout
            asyncio.create_task(self._timeout_batch())

        return await future

    async def _timeout_batch(self):
        """Process batch after timeout"""
        await asyncio.sleep(self.wait_time_ms / 1000)
        if self.pending_requests:
            await self._process_batch()

    async def _process_batch(self):
        """Process all pending requests"""
        if not self.pending_requests:
            return

        # Process batch (this would be optimized for your specific use case)
        requests = self.pending_requests.copy()
        futures = self.pending_futures.copy()

        self.pending_requests.clear()
        self.pending_futures.clear()

        # Here you'd combine requests efficiently
        # For now, we'll process individually
        for request, future in zip(requests, futures):
            # Process request and set future result
            pass  # Implementation depends on your orchestrator


# Example usage
async def main():
    """Example usage of the LLM integration system"""

    config = {
        "ANTHROPIC_API_KEY": "your-key",
        "OPENAI_API_KEY": "your-key",
        "GOOGLE_API_KEY": "your-key"
    }

    orchestrator = LLMOrchestrator(config)

    # Example: Generate MCQ
    mcq_request = LLMRequest(
        task_type="mcq_generation",
        prompt="Generate a USMLE Step 1 question about cardiac physiology",
        complexity=TaskComplexity.MODERATE,
        user_id="user123",
        session_id="session456"
    )

    response = await orchestrator.call_with_fallback(mcq_request)
    print(f"Model used: {response.model_used}")
    print(f"Cost: ${response.cost}")
    print(f"Response: {response.content}")


if __name__ == "__main__":
    asyncio.run(main())
"""
Medical Learning Platform - Cost Optimization System
Advanced caching, batching, and cost monitoring for API usage
"""

import asyncio
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict
import hashlib
import json
from enum import Enum

import redis.asyncio as redis
from sentence_transformers import SentenceTransformer
import numpy as np


class CacheStrategy(Enum):
    """Different caching strategies"""
    EXACT_MATCH = "exact"          # Exact prompt match
    SEMANTIC = "semantic"           # Semantic similarity
    PARAMETRIC = "parametric"       # Template-based with parameters
    HYBRID = "hybrid"               # Combination


@dataclass
class CostMetrics:
    """Cost tracking metrics"""
    total_requests: int = 0
    cached_requests: int = 0
    api_calls: int = 0
    total_cost: float = 0.0
    cost_by_model: Dict[str, float] = field(default_factory=dict)
    cost_by_task: Dict[str, float] = field(default_factory=dict)
    tokens_used: Dict[str, int] = field(default_factory=dict)
    cache_hit_rate: float = 0.0
    cost_savings: float = 0.0
    period_start: datetime = field(default_factory=datetime.now)

    def update(self, model: str, task: str, cost: float, tokens: int, cached: bool = False):
        """Update metrics with new request"""
        self.total_requests += 1

        if cached:
            self.cached_requests += 1
        else:
            self.api_calls += 1
            self.total_cost += cost

            if model not in self.cost_by_model:
                self.cost_by_model[model] = 0.0
            self.cost_by_model[model] += cost

            if task not in self.cost_by_task:
                self.cost_by_task[task] = 0.0
            self.cost_by_task[task] += cost

            if model not in self.tokens_used:
                self.tokens_used[model] = 0
            self.tokens_used[model] += tokens

        # Update cache hit rate
        self.cache_hit_rate = self.cached_requests / self.total_requests if self.total_requests > 0 else 0.0

    def get_report(self) -> Dict[str, Any]:
        """Generate cost report"""
        duration = (datetime.now() - self.period_start).total_seconds() / 3600  # hours

        return {
            "period_hours": duration,
            "total_requests": self.total_requests,
            "api_calls": self.api_calls,
            "cached_requests": self.cached_requests,
            "cache_hit_rate": f"{self.cache_hit_rate * 100:.2f}%",
            "total_cost": f"${self.total_cost:.4f}",
            "estimated_cost_without_cache": f"${self.total_cost / (1 - self.cache_hit_rate):.4f}" if self.cache_hit_rate < 1 else "N/A",
            "cost_savings": f"${self.cost_savings:.4f}",
            "cost_by_model": {k: f"${v:.4f}" for k, v in self.cost_by_model.items()},
            "cost_by_task": {k: f"${v:.4f}" for k, v in self.cost_by_task.items()},
            "tokens_by_model": self.tokens_used,
            "avg_cost_per_request": f"${self.total_cost / self.api_calls:.4f}" if self.api_calls > 0 else "$0.00",
            "requests_per_hour": self.total_requests / duration if duration > 0 else 0
        }


class AdvancedSemanticCache:
    """Advanced caching with semantic similarity and embedding-based retrieval"""

    def __init__(
        self,
        redis_client: redis.Redis,
        similarity_threshold: float = 0.92,
        ttl: int = 3600,
        max_cache_size: int = 10000
    ):
        self.redis = redis_client
        self.threshold = similarity_threshold
        self.ttl = ttl
        self.max_cache_size = max_cache_size

        # Initialize embedding model for semantic search
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')

        # Cache statistics
        self.hits = 0
        self.misses = 0

    async def get(
        self,
        prompt: str,
        task_type: str,
        strategy: CacheStrategy = CacheStrategy.HYBRID
    ) -> Optional[Dict[str, Any]]:
        """Retrieve from cache using specified strategy"""

        if strategy == CacheStrategy.EXACT_MATCH:
            return await self._get_exact(prompt, task_type)
        elif strategy == CacheStrategy.SEMANTIC:
            return await self._get_semantic(prompt, task_type)
        elif strategy == CacheStrategy.PARAMETRIC:
            return await self._get_parametric(prompt, task_type)
        else:  # HYBRID
            # Try exact first, then semantic
            result = await self._get_exact(prompt, task_type)
            if result:
                return result
            return await self._get_semantic(prompt, task_type)

    async def _get_exact(self, prompt: str, task_type: str) -> Optional[Dict[str, Any]]:
        """Exact match caching"""
        cache_key = self._generate_cache_key(prompt, task_type)
        cached = await self.redis.get(f"cache:exact:{cache_key}")

        if cached:
            self.hits += 1
            data = json.loads(cached)
            data["cache_type"] = "exact"
            return data
        else:
            self.misses += 1
            return None

    async def _get_semantic(self, prompt: str, task_type: str) -> Optional[Dict[str, Any]]:
        """Semantic similarity caching"""
        # Generate embedding for query
        query_embedding = self.embedder.encode(prompt)

        # Search for similar cached prompts
        # In production, use a vector database for this
        # For now, we'll use a simplified approach with Redis

        # Get all cached keys for this task type
        pattern = f"cache:semantic:{task_type}:*"
        keys = []
        async for key in self.redis.scan_iter(match=pattern, count=100):
            keys.append(key)

        if not keys:
            self.misses += 1
            return None

        # Compare embeddings
        best_similarity = 0.0
        best_key = None

        for key in keys[:100]:  # Limit to avoid performance issues
            # Retrieve stored embedding
            cached_data = await self.redis.get(key)
            if cached_data:
                data = json.loads(cached_data)
                cached_embedding = np.array(data.get("embedding", []))

                if len(cached_embedding) > 0:
                    # Calculate cosine similarity
                    similarity = np.dot(query_embedding, cached_embedding) / (
                        np.linalg.norm(query_embedding) * np.linalg.norm(cached_embedding)
                    )

                    if similarity > best_similarity:
                        best_similarity = similarity
                        best_key = key

        # Check if similarity exceeds threshold
        if best_similarity >= self.threshold and best_key:
            self.hits += 1
            cached = await self.redis.get(best_key)
            data = json.loads(cached)
            data["cache_type"] = "semantic"
            data["similarity"] = float(best_similarity)
            return data
        else:
            self.misses += 1
            return None

    async def _get_parametric(self, prompt: str, task_type: str) -> Optional[Dict[str, Any]]:
        """Parametric caching for template-based prompts"""
        # Extract parameters from template
        # This is simplified - in production, use more sophisticated parsing
        template = self._extract_template(prompt)
        template_key = self._generate_cache_key(template, task_type)

        cached = await self.redis.get(f"cache:parametric:{template_key}")
        if cached:
            self.hits += 1
            data = json.loads(cached)
            # Substitute parameters
            data["cache_type"] = "parametric"
            return data
        else:
            self.misses += 1
            return None

    def _extract_template(self, prompt: str) -> str:
        """Extract template from prompt by removing specific values"""
        # Simplified implementation - replace numbers, names, etc.
        import re
        template = re.sub(r'\b\d+\b', '{NUM}', prompt)
        template = re.sub(r'\b[A-Z][a-z]+\b', '{NAME}', template)
        return template

    async def set(
        self,
        prompt: str,
        task_type: str,
        response: Dict[str, Any],
        strategy: CacheStrategy = CacheStrategy.HYBRID
    ):
        """Store in cache"""

        # Store exact match
        exact_key = self._generate_cache_key(prompt, task_type)
        await self.redis.setex(
            f"cache:exact:{exact_key}",
            self.ttl,
            json.dumps(response)
        )

        # Store semantic (with embedding)
        if strategy in [CacheStrategy.SEMANTIC, CacheStrategy.HYBRID]:
            embedding = self.embedder.encode(prompt).tolist()
            semantic_data = {**response, "embedding": embedding}

            semantic_key = f"cache:semantic:{task_type}:{exact_key}"
            await self.redis.setex(
                semantic_key,
                self.ttl,
                json.dumps(semantic_data)
            )

        # Store parametric template
        if strategy in [CacheStrategy.PARAMETRIC, CacheStrategy.HYBRID]:
            template = self._extract_template(prompt)
            template_key = self._generate_cache_key(template, task_type)
            await self.redis.setex(
                f"cache:parametric:{template_key}",
                self.ttl,
                json.dumps(response)
            )

    def _generate_cache_key(self, content: str, task_type: str) -> str:
        """Generate cache key"""
        combined = f"{task_type}:{content}"
        return hashlib.sha256(combined.encode()).hexdigest()

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total = self.hits + self.misses
        hit_rate = self.hits / total if total > 0 else 0.0

        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": f"{hit_rate * 100:.2f}%",
            "total_queries": total
        }

    async def clear(self, task_type: Optional[str] = None):
        """Clear cache"""
        if task_type:
            pattern = f"cache:*:{task_type}:*"
        else:
            pattern = "cache:*"

        keys = []
        async for key in self.redis.scan_iter(match=pattern):
            keys.append(key)

        if keys:
            await self.redis.delete(*keys)


class RequestCoalescer:
    """Coalesce similar requests to reduce API calls"""

    def __init__(self, window_ms: int = 100):
        self.window_ms = window_ms
        self.pending_requests: Dict[str, List[Tuple[asyncio.Future, Dict]]] = defaultdict(list)
        self.processing_locks: Dict[str, asyncio.Lock] = {}

    async def coalesce(
        self,
        request_key: str,
        request_data: Dict[str, Any],
        execute_fn: callable
    ) -> Any:
        """Coalesce similar requests"""

        # Check if this request is already being processed
        if request_key in self.processing_locks:
            # Wait for existing request to complete
            future = asyncio.Future()
            self.pending_requests[request_key].append((future, request_data))
            return await future

        # Create lock for this request
        lock = asyncio.Lock()
        self.processing_locks[request_key] = lock

        async with lock:
            # Execute the request
            try:
                result = await execute_fn(request_data)

                # Notify any waiting requests
                if request_key in self.pending_requests:
                    for future, _ in self.pending_requests[request_key]:
                        if not future.done():
                            future.set_result(result)
                    del self.pending_requests[request_key]

                return result

            finally:
                # Clean up lock
                if request_key in self.processing_locks:
                    del self.processing_locks[request_key]


class CostOptimizer:
    """Main cost optimization orchestrator"""

    def __init__(
        self,
        redis_url: str = "redis://localhost",
        config: Optional[Dict[str, Any]] = None
    ):
        self.config = config or {}
        self.redis_client = None
        self.cache = None
        self.coalescer = RequestCoalescer()
        self.metrics = CostMetrics()

        # Budget limits
        self.daily_budget = self.config.get("daily_budget", 10.0)  # $10/day default
        self.hourly_budget = self.config.get("hourly_budget", 1.0)  # $1/hour default

    async def initialize(self):
        """Initialize connections"""
        self.redis_client = await redis.from_url(
            self.config.get("redis_url", "redis://localhost"),
            encoding="utf-8",
            decode_responses=True
        )
        self.cache = AdvancedSemanticCache(
            redis_client=self.redis_client,
            similarity_threshold=self.config.get("cache_threshold", 0.92)
        )

    async def optimize_request(
        self,
        request_data: Dict[str, Any],
        execute_fn: callable,
        cache_strategy: CacheStrategy = CacheStrategy.HYBRID
    ) -> Tuple[Any, Dict[str, Any]]:
        """Optimize a request with caching and coalescing"""

        task_type = request_data.get("task_type", "unknown")
        prompt = request_data.get("prompt", "")

        # Check cache first
        cached_response = await self.cache.get(prompt, task_type, cache_strategy)

        if cached_response:
            # Update metrics for cached request
            self.metrics.update(
                model=cached_response.get("model_used", "unknown"),
                task=task_type,
                cost=0.0,
                tokens=0,
                cached=True
            )

            optimization_info = {
                "cached": True,
                "cache_type": cached_response.get("cache_type"),
                "cost_saved": cached_response.get("cost", 0.0),
                "similarity": cached_response.get("similarity", 1.0)
            }

            return cached_response, optimization_info

        # Check budget before making API call
        if not await self._check_budget():
            raise Exception("Budget limit exceeded")

        # Generate request key for coalescing
        request_key = hashlib.md5(f"{task_type}:{prompt}".encode()).hexdigest()

        # Execute with coalescing
        response = await self.coalescer.coalesce(
            request_key=request_key,
            request_data=request_data,
            execute_fn=execute_fn
        )

        # Store in cache
        await self.cache.set(prompt, task_type, response, cache_strategy)

        # Update metrics
        self.metrics.update(
            model=response.get("model_used", "unknown"),
            task=task_type,
            cost=response.get("cost", 0.0),
            tokens=response.get("tokens_used", {}).get("input", 0) + response.get("tokens_used", {}).get("output", 0),
            cached=False
        )

        optimization_info = {
            "cached": False,
            "coalesced": len(self.coalescer.pending_requests.get(request_key, [])) > 0,
            "cost": response.get("cost", 0.0)
        }

        return response, optimization_info

    async def _check_budget(self) -> bool:
        """Check if budget limits are exceeded"""
        # Get current hour's spending
        hour_key = f"budget:hour:{datetime.now().strftime('%Y%m%d%H')}"
        hour_spending = await self.redis_client.get(hour_key)
        hour_spending = float(hour_spending) if hour_spending else 0.0

        if hour_spending >= self.hourly_budget:
            return False

        # Get today's spending
        day_key = f"budget:day:{datetime.now().strftime('%Y%m%d')}"
        day_spending = await self.redis_client.get(day_key)
        day_spending = float(day_spending) if day_spending else 0.0

        if day_spending >= self.daily_budget:
            return False

        return True

    async def record_spending(self, cost: float):
        """Record spending for budget tracking"""
        hour_key = f"budget:hour:{datetime.now().strftime('%Y%m%d%H')}"
        day_key = f"budget:day:{datetime.now().strftime('%Y%m%d')}"

        # Increment hourly spending
        await self.redis_client.incrbyfloat(hour_key, cost)
        await self.redis_client.expire(hour_key, 3600)  # Expire after 1 hour

        # Increment daily spending
        await self.redis_client.incrbyfloat(day_key, cost)
        await self.redis_client.expire(day_key, 86400)  # Expire after 24 hours

    async def get_budget_status(self) -> Dict[str, Any]:
        """Get current budget status"""
        hour_key = f"budget:hour:{datetime.now().strftime('%Y%m%d%H')}"
        day_key = f"budget:day:{datetime.now().strftime('%Y%m%d')}"

        hour_spending = await self.redis_client.get(hour_key)
        hour_spending = float(hour_spending) if hour_spending else 0.0

        day_spending = await self.redis_client.get(day_key)
        day_spending = float(day_spending) if day_spending else 0.0

        return {
            "hourly": {
                "spent": f"${hour_spending:.4f}",
                "limit": f"${self.hourly_budget:.4f}",
                "remaining": f"${max(0, self.hourly_budget - hour_spending):.4f}",
                "percentage": f"{(hour_spending / self.hourly_budget * 100):.1f}%"
            },
            "daily": {
                "spent": f"${day_spending:.4f}",
                "limit": f"${self.daily_budget:.4f}",
                "remaining": f"${max(0, self.daily_budget - day_spending):.4f}",
                "percentage": f"{(day_spending / self.daily_budget * 100):.1f}%"
            }
        }

    async def get_optimization_report(self) -> Dict[str, Any]:
        """Generate comprehensive optimization report"""
        cost_report = self.metrics.get_report()
        cache_stats = await self.cache.get_stats()
        budget_status = await self.get_budget_status()

        return {
            "cost_metrics": cost_report,
            "cache_performance": cache_stats,
            "budget_status": budget_status,
            "recommendations": await self._generate_recommendations()
        }

    async def _generate_recommendations(self) -> List[str]:
        """Generate optimization recommendations"""
        recommendations = []

        # Check cache hit rate
        if self.metrics.cache_hit_rate < 0.3:
            recommendations.append(
                "Cache hit rate is low (<30%). Consider increasing cache TTL or using more semantic caching."
            )
        elif self.metrics.cache_hit_rate > 0.7:
            recommendations.append(
                "Excellent cache performance (>70% hit rate). Current caching strategy is effective."
            )

        # Check cost by model
        if self.metrics.cost_by_model:
            most_expensive = max(self.metrics.cost_by_model, key=self.metrics.cost_by_model.get)
            recommendations.append(
                f"Most expensive model: {most_expensive}. Consider routing simpler tasks to cheaper models."
            )

        # Check budget usage
        budget_status = await self.get_budget_status()
        daily_pct = float(budget_status["daily"]["percentage"].rstrip('%'))

        if daily_pct > 80:
            recommendations.append(
                "WARNING: Daily budget usage exceeds 80%. Consider implementing stricter rate limiting."
            )

        return recommendations

    async def close(self):
        """Clean up connections"""
        if self.redis_client:
            await self.redis_client.close()


# Example usage
async def main():
    """Example usage of cost optimizer"""

    optimizer = CostOptimizer(config={
        "redis_url": "redis://localhost",
        "cache_threshold": 0.92,
        "daily_budget": 10.0,
        "hourly_budget": 1.0
    })

    await optimizer.initialize()

    # Example optimized request
    async def mock_api_call(request):
        # Simulate API call
        await asyncio.sleep(0.1)
        return {
            "content": f"Response to: {request['prompt']}",
            "model_used": "claude-3.5-sonnet",
            "cost": 0.015,
            "tokens_used": {"input": 100, "output": 200}
        }

    request = {
        "task_type": "mcq_generation",
        "prompt": "Generate a question about cardiac physiology"
    }

    # First call - will hit API
    response1, info1 = await optimizer.optimize_request(
        request_data=request,
        execute_fn=mock_api_call
    )
    print(f"First call - Cached: {info1['cached']}, Cost: {info1.get('cost', 0)}")

    # Second call - should hit cache
    response2, info2 = await optimizer.optimize_request(
        request_data=request,
        execute_fn=mock_api_call
    )
    print(f"Second call - Cached: {info2['cached']}, Saved: ${info2.get('cost_saved', 0)}")

    # Get optimization report
    report = await optimizer.get_optimization_report()
    print("\nOptimization Report:")
    print(json.dumps(report, indent=2))

    await optimizer.close()


if __name__ == "__main__":
    asyncio.run(main())
"""Performance testing suite for StudyIn application.

Tests API response times, database performance, caching efficiency,
and overall system throughput against defined performance budgets.
"""

import asyncio
import time
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any

import pytest
import httpx
from faker import Faker

from app.config import settings
from app.services.performance_monitor import PerformanceBudget


fake = Faker()


class PerformanceTestResults:
    """Container for performance test results."""

    def __init__(self):
        self.api_response_times: List[float] = []
        self.db_query_times: List[float] = []
        self.cache_hit_rates: List[float] = []
        self.throughput_rps: float = 0
        self.error_count: int = 0
        self.total_requests: int = 0

    def calculate_percentiles(self, times: List[float]) -> Dict[str, float]:
        """Calculate percentiles from response times."""
        if not times:
            return {"p50": 0, "p95": 0, "p99": 0}

        sorted_times = sorted(times)
        n = len(sorted_times)
        return {
            "p50": sorted_times[int(n * 0.5)],
            "p95": sorted_times[int(n * 0.95)],
            "p99": sorted_times[int(n * 0.99)],
        }

    def get_summary(self) -> Dict[str, Any]:
        """Get test results summary."""
        api_percentiles = self.calculate_percentiles(self.api_response_times)
        db_percentiles = self.calculate_percentiles(self.db_query_times)

        avg_cache_hit_rate = (
            sum(self.cache_hit_rates) / len(self.cache_hit_rates)
            if self.cache_hit_rates
            else 0
        )

        error_rate = self.error_count / max(1, self.total_requests)

        return {
            "api": {
                "p50_ms": api_percentiles["p50"],
                "p95_ms": api_percentiles["p95"],
                "p99_ms": api_percentiles["p99"],
                "throughput_rps": self.throughput_rps,
                "error_rate": error_rate,
            },
            "database": {
                "p50_ms": db_percentiles["p50"],
                "p95_ms": db_percentiles["p95"],
                "p99_ms": db_percentiles["p99"],
            },
            "cache": {
                "hit_rate": avg_cache_hit_rate,
            },
        }


@pytest.fixture
def performance_budget():
    """Performance budget fixture."""
    return PerformanceBudget(
        api_p50_max=200,
        api_p95_max=500,
        api_p99_max=1000,
        db_query_p95_max=100,
        cache_hit_rate_min=0.8,
        error_rate_max=0.01,
    )


@pytest.fixture
def test_results():
    """Test results container."""
    return PerformanceTestResults()


@pytest.mark.asyncio
async def test_api_response_time(performance_budget, test_results):
    """Test API response times against performance budget."""
    base_url = "http://localhost:8000"
    endpoints = [
        ("/health/ready", "GET", None),
        ("/api/materials", "GET", None),
        ("/api/analytics/summary", "GET", None),
    ]

    async with httpx.AsyncClient() as client:
        # Warm up
        await client.get(f"{base_url}/health/ready")

        # Run performance tests
        for endpoint, method, data in endpoints * 10:  # 10 iterations per endpoint
            start_time = time.perf_counter()

            try:
                if method == "GET":
                    response = await client.get(f"{base_url}{endpoint}")
                elif method == "POST":
                    response = await client.post(f"{base_url}{endpoint}", json=data)

                response_time_ms = (time.perf_counter() - start_time) * 1000
                test_results.api_response_times.append(response_time_ms)
                test_results.total_requests += 1

                if response.status_code >= 500:
                    test_results.error_count += 1

            except Exception:
                test_results.error_count += 1
                test_results.total_requests += 1

    # Validate against budget
    percentiles = test_results.calculate_percentiles(test_results.api_response_times)

    assert percentiles["p50"] <= performance_budget.api_p50_max, \
        f"P50 response time ({percentiles['p50']:.2f}ms) exceeds budget ({performance_budget.api_p50_max}ms)"

    assert percentiles["p95"] <= performance_budget.api_p95_max, \
        f"P95 response time ({percentiles['p95']:.2f}ms) exceeds budget ({performance_budget.api_p95_max}ms)"

    assert percentiles["p99"] <= performance_budget.api_p99_max, \
        f"P99 response time ({percentiles['p99']:.2f}ms) exceeds budget ({performance_budget.api_p99_max}ms)"


@pytest.mark.asyncio
async def test_concurrent_load(performance_budget, test_results):
    """Test system performance under concurrent load."""
    base_url = "http://localhost:8000"
    concurrent_users = 50
    requests_per_user = 20

    async def user_session():
        """Simulate a user session."""
        async with httpx.AsyncClient() as client:
            for _ in range(requests_per_user):
                start_time = time.perf_counter()

                try:
                    # Simulate various API calls
                    endpoints = [
                        "/health/ready",
                        "/api/materials",
                        "/api/analytics/summary",
                    ]
                    endpoint = fake.random_element(endpoints)

                    response = await client.get(f"{base_url}{endpoint}")
                    response_time_ms = (time.perf_counter() - start_time) * 1000

                    test_results.api_response_times.append(response_time_ms)
                    test_results.total_requests += 1

                    if response.status_code >= 500:
                        test_results.error_count += 1

                    # Small delay between requests
                    await asyncio.sleep(0.1)

                except Exception:
                    test_results.error_count += 1
                    test_results.total_requests += 1

    # Run concurrent user sessions
    start_time = time.time()
    tasks = [user_session() for _ in range(concurrent_users)]
    await asyncio.gather(*tasks)
    total_time = time.time() - start_time

    # Calculate throughput
    test_results.throughput_rps = test_results.total_requests / total_time

    # Validate results
    error_rate = test_results.error_count / max(1, test_results.total_requests)
    assert error_rate <= performance_budget.error_rate_max, \
        f"Error rate ({error_rate:.2%}) exceeds budget ({performance_budget.error_rate_max:.2%})"

    # Check that system maintains performance under load
    percentiles = test_results.calculate_percentiles(test_results.api_response_times)
    assert percentiles["p95"] <= performance_budget.api_p95_max * 1.5, \
        f"P95 under load ({percentiles['p95']:.2f}ms) exceeds 150% of budget"


@pytest.mark.asyncio
async def test_cache_efficiency(performance_budget, test_results):
    """Test cache hit rates and efficiency."""
    base_url = "http://localhost:8000"

    async with httpx.AsyncClient() as client:
        # First round - cache misses
        miss_times = []
        for i in range(10):
            start_time = time.perf_counter()
            response = await client.get(f"{base_url}/api/materials")
            miss_times.append((time.perf_counter() - start_time) * 1000)

        # Second round - cache hits
        hit_times = []
        for i in range(10):
            start_time = time.perf_counter()
            response = await client.get(f"{base_url}/api/materials")
            hit_times.append((time.perf_counter() - start_time) * 1000)

    # Cache hits should be significantly faster
    avg_miss_time = sum(miss_times) / len(miss_times)
    avg_hit_time = sum(hit_times) / len(hit_times)

    cache_speedup = avg_miss_time / avg_hit_time
    assert cache_speedup > 2, \
        f"Cache speedup ({cache_speedup:.2f}x) is too low. Expected >2x"

    # Estimate cache hit rate (simplified)
    estimated_hit_rate = 0.5  # 50% in this test (half hits, half misses)
    test_results.cache_hit_rates.append(estimated_hit_rate)


@pytest.mark.asyncio
async def test_document_processing_performance():
    """Test document processing performance."""
    from app.services.optimized_processor import OptimizedDocumentProcessor

    processor = OptimizedDocumentProcessor()

    # Create test PDF content (mock)
    test_content = b"Test PDF content" * 10000  # ~160KB

    start_time = time.perf_counter()

    # Process document
    chunks = []
    async for chunk, metadata in processor.process_document_stream(
        test_content, "text/plain"
    ):
        chunks.append((chunk, metadata))

    processing_time_ms = (time.perf_counter() - start_time) * 1000

    # Performance assertions
    assert processing_time_ms < 1000, \
        f"Document processing too slow ({processing_time_ms:.2f}ms)"

    assert len(chunks) > 0, "No chunks generated"

    # Check chunk sizes are within bounds
    for chunk, metadata in chunks:
        assert metadata.char_count >= processor.min_chunk_size, \
            f"Chunk too small ({metadata.char_count} chars)"
        assert metadata.char_count <= processor.max_chunk_size, \
            f"Chunk too large ({metadata.char_count} chars)"


@pytest.mark.asyncio
async def test_memory_usage():
    """Test memory usage stays within bounds."""
    import psutil
    import gc

    # Get initial memory usage
    process = psutil.Process()
    initial_memory_mb = process.memory_info().rss / 1024 / 1024

    # Perform memory-intensive operations
    base_url = "http://localhost:8000"
    async with httpx.AsyncClient() as client:
        # Simulate multiple large requests
        for _ in range(100):
            await client.get(f"{base_url}/api/materials")

    # Force garbage collection
    gc.collect()

    # Check memory after operations
    final_memory_mb = process.memory_info().rss / 1024 / 1024
    memory_increase_mb = final_memory_mb - initial_memory_mb

    # Memory increase should be reasonable
    assert memory_increase_mb < 100, \
        f"Memory usage increased by {memory_increase_mb:.2f}MB"


@pytest.mark.asyncio
async def test_database_query_performance(performance_budget, test_results):
    """Test database query performance."""
    from app.db.session import SessionLocal
    from sqlalchemy import text

    async with SessionLocal() as session:
        # Test various query patterns
        queries = [
            "SELECT * FROM users WHERE email = :email LIMIT 1",
            "SELECT * FROM materials WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 10",
            "SELECT COUNT(*) FROM material_chunks WHERE material_id = :material_id",
        ]

        for query in queries * 5:  # Run each query 5 times
            start_time = time.perf_counter()

            params = {
                "email": fake.email(),
                "user_id": fake.uuid4(),
                "material_id": fake.uuid4(),
            }

            result = await session.execute(text(query), params)
            result.fetchall()  # Ensure query is fully executed

            query_time_ms = (time.perf_counter() - start_time) * 1000
            test_results.db_query_times.append(query_time_ms)

    # Validate against budget
    percentiles = test_results.calculate_percentiles(test_results.db_query_times)

    assert percentiles["p95"] <= performance_budget.db_query_p95_max, \
        f"P95 query time ({percentiles['p95']:.2f}ms) exceeds budget ({performance_budget.db_query_p95_max}ms)"


def test_performance_summary(test_results, performance_budget):
    """Generate and validate overall performance summary."""
    summary = test_results.get_summary()

    print("\n" + "=" * 60)
    print("PERFORMANCE TEST SUMMARY")
    print("=" * 60)

    print("\nAPI Performance:")
    print(f"  P50: {summary['api']['p50_ms']:.2f}ms (budget: {performance_budget.api_p50_max}ms)")
    print(f"  P95: {summary['api']['p95_ms']:.2f}ms (budget: {performance_budget.api_p95_max}ms)")
    print(f"  P99: {summary['api']['p99_ms']:.2f}ms (budget: {performance_budget.api_p99_max}ms)")
    print(f"  Throughput: {summary['api']['throughput_rps']:.2f} RPS")
    print(f"  Error Rate: {summary['api']['error_rate']:.2%} (budget: {performance_budget.error_rate_max:.2%})")

    print("\nDatabase Performance:")
    print(f"  P50: {summary['database']['p50_ms']:.2f}ms")
    print(f"  P95: {summary['database']['p95_ms']:.2f}ms (budget: {performance_budget.db_query_p95_max}ms)")
    print(f"  P99: {summary['database']['p99_ms']:.2f}ms")

    print("\nCache Performance:")
    print(f"  Hit Rate: {summary['cache']['hit_rate']:.2%} (budget: {performance_budget.cache_hit_rate_min:.2%})")

    print("\n" + "=" * 60)

    # Overall pass/fail
    passed = all([
        summary['api']['p50_ms'] <= performance_budget.api_p50_max,
        summary['api']['p95_ms'] <= performance_budget.api_p95_max,
        summary['api']['p99_ms'] <= performance_budget.api_p99_max,
        summary['api']['error_rate'] <= performance_budget.error_rate_max,
        summary['database']['p95_ms'] <= performance_budget.db_query_p95_max,
        summary['cache']['hit_rate'] >= performance_budget.cache_hit_rate_min,
    ])

    if passed:
        print("✅ ALL PERFORMANCE BUDGETS MET")
    else:
        print("❌ PERFORMANCE BUDGETS EXCEEDED")

    print("=" * 60 + "\n")

    assert passed, "Performance budgets not met"
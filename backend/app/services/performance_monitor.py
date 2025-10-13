"""Performance monitoring service for comprehensive application metrics.

Tracks API performance, database queries, cache efficiency, and system resources
with automatic alerting and performance budget enforcement.
"""

from __future__ import annotations

import asyncio
import logging
import os
import psutil
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import event, text
from sqlalchemy.engine import Engine
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.services.cache import cache_service

logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetrics:
    """Container for performance metrics."""

    # API Metrics
    api_response_times: deque = field(default_factory=lambda: deque(maxlen=1000))
    api_error_rates: Dict[str, int] = field(default_factory=dict)
    api_throughput: float = 0.0

    # Database Metrics
    db_query_times: deque = field(default_factory=lambda: deque(maxlen=1000))
    db_connection_pool_stats: Dict[str, int] = field(default_factory=dict)
    slow_queries: List[Dict[str, Any]] = field(default_factory=list)

    # Cache Metrics
    cache_hit_rate: float = 0.0
    cache_miss_rate: float = 0.0
    cache_eviction_rate: float = 0.0

    # System Metrics
    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    disk_io: Dict[str, float] = field(default_factory=dict)
    network_io: Dict[str, float] = field(default_factory=dict)

    # Application Metrics
    active_users: int = 0
    active_sessions: int = 0
    document_processing_times: deque = field(default_factory=lambda: deque(maxlen=100))

    # Calculated Metrics
    p50_response_time: float = 0.0
    p95_response_time: float = 0.0
    p99_response_time: float = 0.0
    avg_db_query_time: float = 0.0


@dataclass
class PerformanceBudget:
    """Performance budget thresholds."""

    # Response time budgets (milliseconds)
    api_p50_max: float = 200
    api_p95_max: float = 500
    api_p99_max: float = 1000

    # Database budgets
    db_query_p95_max: float = 100
    db_connection_pool_min_available: int = 2

    # Cache budgets
    cache_hit_rate_min: float = 0.8

    # System budgets
    cpu_usage_max: float = 80.0
    memory_usage_max: float = 85.0

    # Error rate budgets
    error_rate_max: float = 0.01  # 1%


class PerformanceMonitor:
    """Comprehensive performance monitoring service."""

    def __init__(self):
        """Initialize performance monitor."""
        self.metrics = PerformanceMetrics()
        self.budget = PerformanceBudget()
        self._start_time = time.time()
        self._request_count = 0
        self._error_count = 0
        self._monitoring_task: Optional[asyncio.Task] = None
        self._alert_callbacks = []

    async def start(self) -> None:
        """Start background monitoring."""
        if not self._monitoring_task:
            self._monitoring_task = asyncio.create_task(self._monitor_loop())
            logger.info("Performance monitoring started")

    async def stop(self) -> None:
        """Stop background monitoring."""
        if self._monitoring_task:
            self._monitoring_task.cancel()
            try:
                await self._monitoring_task
            except asyncio.CancelledError:
                pass
            self._monitoring_task = None
            logger.info("Performance monitoring stopped")

    async def _monitor_loop(self) -> None:
        """Background monitoring loop."""
        while True:
            try:
                await self._collect_system_metrics()
                await self._calculate_derived_metrics()
                await self._check_performance_budgets()
                await asyncio.sleep(10)  # Collect metrics every 10 seconds
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")

    async def _collect_system_metrics(self) -> None:
        """Collect system-level metrics."""
        try:
            # CPU usage
            self.metrics.cpu_usage = psutil.cpu_percent(interval=1)

            # Memory usage
            memory = psutil.virtual_memory()
            self.metrics.memory_usage = memory.percent

            # Disk I/O
            disk_io = psutil.disk_io_counters()
            if disk_io:
                self.metrics.disk_io = {
                    "read_bytes_per_sec": disk_io.read_bytes,
                    "write_bytes_per_sec": disk_io.write_bytes,
                    "read_count": disk_io.read_count,
                    "write_count": disk_io.write_count,
                }

            # Network I/O
            net_io = psutil.net_io_counters()
            if net_io:
                self.metrics.network_io = {
                    "bytes_sent_per_sec": net_io.bytes_sent,
                    "bytes_recv_per_sec": net_io.bytes_recv,
                    "packets_sent": net_io.packets_sent,
                    "packets_recv": net_io.packets_recv,
                }

            # Cache metrics
            cache_metrics = await cache_service.get_metrics()
            total_requests = cache_metrics.hits + cache_metrics.misses
            if total_requests > 0:
                self.metrics.cache_hit_rate = cache_metrics.hits / total_requests
                self.metrics.cache_miss_rate = cache_metrics.misses / total_requests

        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")

    async def _calculate_derived_metrics(self) -> None:
        """Calculate derived metrics from raw data."""
        try:
            # API response time percentiles
            if self.metrics.api_response_times:
                sorted_times = sorted(self.metrics.api_response_times)
                n = len(sorted_times)
                self.metrics.p50_response_time = sorted_times[int(n * 0.5)]
                self.metrics.p95_response_time = sorted_times[int(n * 0.95)]
                self.metrics.p99_response_time = sorted_times[int(n * 0.99)]

            # Average database query time
            if self.metrics.db_query_times:
                self.metrics.avg_db_query_time = sum(self.metrics.db_query_times) / len(self.metrics.db_query_times)

            # Throughput
            elapsed = time.time() - self._start_time
            if elapsed > 0:
                self.metrics.api_throughput = self._request_count / elapsed

        except Exception as e:
            logger.error(f"Error calculating derived metrics: {e}")

    async def _check_performance_budgets(self) -> None:
        """Check if performance budgets are exceeded."""
        violations = []

        # Check response time budgets
        if self.metrics.p50_response_time > self.budget.api_p50_max:
            violations.append(f"P50 response time ({self.metrics.p50_response_time:.2f}ms) exceeds budget ({self.budget.api_p50_max}ms)")

        if self.metrics.p95_response_time > self.budget.api_p95_max:
            violations.append(f"P95 response time ({self.metrics.p95_response_time:.2f}ms) exceeds budget ({self.budget.api_p95_max}ms)")

        if self.metrics.p99_response_time > self.budget.api_p99_max:
            violations.append(f"P99 response time ({self.metrics.p99_response_time:.2f}ms) exceeds budget ({self.budget.api_p99_max}ms)")

        # Check cache hit rate
        if self.metrics.cache_hit_rate < self.budget.cache_hit_rate_min:
            violations.append(f"Cache hit rate ({self.metrics.cache_hit_rate:.2%}) below minimum ({self.budget.cache_hit_rate_min:.2%})")

        # Check system resources
        if self.metrics.cpu_usage > self.budget.cpu_usage_max:
            violations.append(f"CPU usage ({self.metrics.cpu_usage:.1f}%) exceeds maximum ({self.budget.cpu_usage_max}%)")

        if self.metrics.memory_usage > self.budget.memory_usage_max:
            violations.append(f"Memory usage ({self.metrics.memory_usage:.1f}%) exceeds maximum ({self.budget.memory_usage_max}%)")

        # Check error rate
        if self._request_count > 0:
            error_rate = self._error_count / self._request_count
            if error_rate > self.budget.error_rate_max:
                violations.append(f"Error rate ({error_rate:.2%}) exceeds maximum ({self.budget.error_rate_max:.2%})")

        # Send alerts for violations
        if violations:
            await self._send_alerts(violations)

    async def _send_alerts(self, violations: List[str]) -> None:
        """Send performance budget violation alerts."""
        for violation in violations:
            logger.warning(f"Performance budget violation: {violation}")

        # Call registered alert callbacks
        for callback in self._alert_callbacks:
            try:
                await callback(violations)
            except Exception as e:
                logger.error(f"Error in alert callback: {e}")

    def track_api_request(
        self,
        endpoint: str,
        method: str,
        response_time_ms: float,
        status_code: int,
    ) -> None:
        """Track API request metrics.

        Args:
            endpoint: API endpoint path
            method: HTTP method
            response_time_ms: Response time in milliseconds
            status_code: HTTP status code
        """
        self._request_count += 1
        self.metrics.api_response_times.append(response_time_ms)

        if status_code >= 500:
            self._error_count += 1
            error_key = f"{method}:{endpoint}"
            self.metrics.api_error_rates[error_key] = self.metrics.api_error_rates.get(error_key, 0) + 1

    def track_db_query(
        self,
        query: str,
        duration_ms: float,
        params: Optional[Dict] = None,
    ) -> None:
        """Track database query metrics.

        Args:
            query: SQL query
            duration_ms: Query duration in milliseconds
            params: Query parameters
        """
        self.metrics.db_query_times.append(duration_ms)

        # Track slow queries
        if duration_ms > 100:  # Queries slower than 100ms
            self.metrics.slow_queries.append({
                "query": query[:500],  # Truncate long queries
                "duration_ms": duration_ms,
                "params": params,
                "timestamp": datetime.utcnow().isoformat(),
            })

            # Keep only last 100 slow queries
            if len(self.metrics.slow_queries) > 100:
                self.metrics.slow_queries = self.metrics.slow_queries[-100:]

    def track_document_processing(
        self,
        document_id: str,
        processing_time_ms: float,
        chunk_count: int,
    ) -> None:
        """Track document processing metrics.

        Args:
            document_id: Document identifier
            processing_time_ms: Processing time in milliseconds
            chunk_count: Number of chunks generated
        """
        self.metrics.document_processing_times.append(processing_time_ms)

        logger.info(
            f"Document {document_id} processed in {processing_time_ms:.2f}ms "
            f"({chunk_count} chunks)"
        )

    def register_alert_callback(self, callback) -> None:
        """Register callback for performance alerts.

        Args:
            callback: Async function to call on performance violations
        """
        self._alert_callbacks.append(callback)

    async def get_health_status(self) -> Dict[str, Any]:
        """Get current health status.

        Returns:
            Health status dictionary
        """
        return {
            "healthy": self._is_healthy(),
            "uptime_seconds": time.time() - self._start_time,
            "metrics": {
                "api": {
                    "p50_ms": self.metrics.p50_response_time,
                    "p95_ms": self.metrics.p95_response_time,
                    "p99_ms": self.metrics.p99_response_time,
                    "throughput_rps": self.metrics.api_throughput,
                    "error_rate": (self._error_count / max(1, self._request_count)),
                },
                "database": {
                    "avg_query_time_ms": self.metrics.avg_db_query_time,
                    "slow_queries_count": len(self.metrics.slow_queries),
                },
                "cache": {
                    "hit_rate": self.metrics.cache_hit_rate,
                    "miss_rate": self.metrics.cache_miss_rate,
                },
                "system": {
                    "cpu_percent": self.metrics.cpu_usage,
                    "memory_percent": self.metrics.memory_usage,
                },
            },
        }

    def _is_healthy(self) -> bool:
        """Check if system is healthy based on budgets.

        Returns:
            True if healthy, False otherwise
        """
        # Check critical metrics
        if self.metrics.p99_response_time > self.budget.api_p99_max * 2:
            return False

        if self.metrics.cpu_usage > 95:
            return False

        if self.metrics.memory_usage > 95:
            return False

        if self._request_count > 100:  # Only check after some requests
            error_rate = self._error_count / self._request_count
            if error_rate > 0.05:  # 5% error rate is critical
                return False

        return True


# Global performance monitor instance
performance_monitor = PerformanceMonitor()


# SQLAlchemy query profiling
@event.listens_for(Engine, "before_execute")
def before_execute(conn, clauseelement, multiparams, params, execution_options):
    """Track query start time."""
    conn.info["query_start_time"] = time.time()


@event.listens_for(Engine, "after_execute")
def after_execute(conn, clauseelement, multiparams, params, execution_options, result):
    """Track query execution time."""
    if "query_start_time" in conn.info:
        duration_ms = (time.time() - conn.info["query_start_time"]) * 1000
        performance_monitor.track_db_query(
            str(clauseelement),
            duration_ms,
            params,
        )
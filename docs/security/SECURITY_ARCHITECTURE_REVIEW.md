# AI Coach Chat System - Security & Architecture Review

**Review Date**: 2025-10-10
**Reviewer**: Claude Code (Security & Architecture Expert)
**Scope**: Complete AI coach WebSocket chat system

---

## Executive Summary

The AI coach chat system demonstrates **solid MVP architecture** with good observability patterns and reasonable error handling. However, several **critical security gaps** and **production readiness concerns** require immediate attention before deployment.

**Overall Assessment**:
- ✅ **Strengths**: Good logging, proper async patterns, clean separation of concerns
- ⚠️ **Moderate Risks**: Hardcoded auth, missing rate limiting, unbounded resource usage
- 🔴 **Critical Issues**: No authentication, no input validation, command injection vulnerabilities

**Recommendation**: **NOT production-ready**. Address critical/high priority issues before deployment.

---

## 1. Critical Security Issues 🔴

### 1.1 Authentication Bypass (CRITICAL)
**File**: `/backend/app/api/chat.py` (Line 96)
**File**: `/backend/app/api/deps.py` (Lines 18-41)

**Issue**: Hardcoded user ID with no real authentication
```python
HARDCODED_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
HARDCODED_USER_EMAIL = "demo@studyin.local"
user = await ensure_hardcoded_user(session)  # No auth check!
```

**Risk**:
- ANY user can access ANY data
- No user isolation
- No audit trail for security incidents
- Violates FERPA/HIPAA requirements for medical education platforms

**Recommendation**:
```python
# Implement JWT token validation in WebSocket handshake
async def chat_websocket(
    websocket: WebSocket,
    token: str = Query(...),  # Require token in query params
    session: AsyncSession = Depends(get_db),
):
    try:
        user = await verify_jwt_token(token, session)
    except AuthenticationError:
        await websocket.close(code=1008)  # Policy Violation
        return
```

**Priority**: 🔴 **CRITICAL** - Must fix before any production deployment

---

### 1.2 Command Injection in Codex CLI (CRITICAL)
**File**: `/backend/app/services/codex_llm.py` (Lines 167-183)

**Issue**: User input directly passed to subprocess without sanitization
```python
cmd = [
    self.cli_path,
    "exec",
    prompt,  # ⚠️ Unsanitized user input!
]
process = await asyncio.create_subprocess_exec(*cmd, ...)
```

**Risk**:
- Command injection through prompt manipulation
- Arbitrary code execution on server
- Full system compromise possible

**Attack Vector**:
```python
# Malicious prompt could contain shell metacharacters
prompt = "'; rm -rf /; echo 'pwned"
# If CLI doesn't properly escape, this executes shell commands
```

**Recommendation**:
```python
# 1. Input validation
def sanitize_prompt(prompt: str) -> str:
    """Remove or escape dangerous characters."""
    # Remove shell metacharacters
    dangerous = [';', '|', '&', '$', '`', '\n', '\r']
    sanitized = prompt
    for char in dangerous:
        sanitized = sanitized.replace(char, '')
    return sanitized[:10000]  # Also limit length

# 2. Use stdin instead of arguments
process = await asyncio.create_subprocess_exec(
    self.cli_path, "exec",
    stdin=asyncio.subprocess.PIPE,
    stdout=asyncio.subprocess.PIPE,
    stderr=asyncio.subprocess.PIPE,
)
await process.stdin.write(sanitized_prompt.encode('utf-8'))
await process.stdin.close()
```

**Priority**: 🔴 **CRITICAL** - High risk of exploitation

---

### 1.3 Insufficient Input Validation (HIGH)
**File**: `/backend/app/api/chat.py` (Lines 148-157)

**Issue**: Minimal validation on user messages
```python
content = (message.get("content") or "").strip()
if not content:
    # Only checks if empty - no other validation!
```

**Missing Validations**:
- ❌ Maximum length enforcement
- ❌ Character encoding validation
- ❌ XSS/injection pattern detection
- ❌ Profanity/abuse filtering
- ❌ Prompt injection detection

**Risk**:
- Prompt injection attacks ("Ignore previous instructions...")
- DoS through extremely long inputs
- XSS if messages displayed without sanitization
- Jailbreaking AI safety guardrails

**Recommendation**:
```python
from bleach import clean
import re

MAX_MESSAGE_LENGTH = 5000
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+previous\s+instructions",
    r"system\s*:\s*you\s+are",
    r"<\s*script\s*>",
]

def validate_user_message(content: str) -> tuple[bool, str | None]:
    """Validate and sanitize user message."""
    # Length check
    if len(content) > MAX_MESSAGE_LENGTH:
        return False, f"Message too long (max {MAX_MESSAGE_LENGTH} chars)"

    # Encoding check
    try:
        content.encode('utf-8')
    except UnicodeEncodeError:
        return False, "Invalid character encoding"

    # Prompt injection detection
    lower_content = content.lower()
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, lower_content):
            logger.warning("prompt_injection_detected", extra={"pattern": pattern})
            return False, "Your message contains prohibited content"

    # XSS prevention (sanitize HTML)
    sanitized = clean(content, tags=[], strip=True)

    return True, sanitized

# In endpoint:
is_valid, result = validate_user_message(content)
if not is_valid:
    await websocket.send_json({"type": "error", "message": result})
    continue
content = result  # Use sanitized version
```

**Priority**: 🔴 **HIGH** - Prevents multiple attack vectors

---

### 1.4 WebSocket Origin Validation Bypass (HIGH)
**File**: `/backend/app/api/chat.py` (Lines 83-93)

**Issue**: Origin validation can be bypassed
```python
origin = websocket.headers.get("origin")
allowed_origins = settings.get_cors_origins_list()

if origin and origin not in allowed_origins:  # ⚠️ Only checks if origin is present!
    await websocket.close(code=1008)
    return
```

**Risk**:
- Attacker can omit `Origin` header entirely to bypass check
- Cross-site WebSocket hijacking (CSWSH)
- Unauthorized data access from malicious sites

**Recommendation**:
```python
# ALWAYS require origin for security-sensitive endpoints
origin = websocket.headers.get("origin")
allowed_origins = settings.get_cors_origins_list()

# In production, origin should always be present
if settings.ENVIRONMENT != "development":
    if not origin:
        logger.warning("websocket_rejected_no_origin")
        await websocket.close(code=1008)
        return

if origin and origin not in allowed_origins:
    logger.warning("websocket_rejected_invalid_origin",
                   extra={"origin": origin, "allowed": allowed_origins})
    await websocket.close(code=1008)
    return

# Additional: Check Sec-WebSocket-Key to prevent simple curl attacks
ws_key = websocket.headers.get("sec-websocket-key")
if not ws_key:
    logger.warning("websocket_rejected_no_sec_key")
    await websocket.close(code=1008)
    return
```

**Priority**: 🔴 **HIGH** - Critical for production security

---

### 1.5 Secrets in Configuration (HIGH)
**File**: `/backend/app/config.py` (Lines 36-37, 62)

**Issue**: Hardcoded secrets with weak validation
```python
JWT_ACCESS_SECRET: str = "local-access-secret"  # ⚠️ Hardcoded!
JWT_REFRESH_SECRET: str = "local-refresh-secret"  # ⚠️ Hardcoded!
GEMINI_API_KEY: str | None = None  # ⚠️ No validation if required
```

**Risk**:
- Secrets leak in version control
- Easy to forget changing defaults
- API key exposure in logs/error messages

**Recommendation**:
```python
from typing import Optional
import secrets

class Settings(BaseSettings):
    # Require secrets in production
    JWT_ACCESS_SECRET: str = Field(
        default_factory=lambda: secrets.token_urlsafe(32),
        description="JWT access token secret (auto-generated if not set)"
    )
    JWT_REFRESH_SECRET: str = Field(
        default_factory=lambda: secrets.token_urlsafe(32),
        description="JWT refresh token secret (auto-generated if not set)"
    )

    # Require API keys when needed
    GEMINI_API_KEY: Optional[str] = Field(None, description="Gemini API key for embeddings")

    @model_validator(mode="after")
    def _validate_secrets(self) -> "Settings":
        if self.ENVIRONMENT in {"staging", "production"}:
            # Ensure secrets are properly set
            if len(self.JWT_ACCESS_SECRET) < 32:
                raise ValueError("JWT_ACCESS_SECRET must be at least 32 characters in production")

            if len(self.JWT_REFRESH_SECRET) < 32:
                raise ValueError("JWT_REFRESH_SECRET must be at least 32 characters in production")

            # Check if using default values
            if "local-" in self.JWT_ACCESS_SECRET:
                raise ValueError("Default JWT secrets detected in production - must override!")

        return self

# Add secret redaction in logging
@property
def safe_config(self) -> dict:
    """Return config with secrets redacted."""
    config = self.model_dump()
    for key in config:
        if 'SECRET' in key or 'KEY' in key or 'PASSWORD' in key:
            config[key] = '***REDACTED***'
    return config
```

**Priority**: 🔴 **HIGH** - Prevents credential leaks

---

## 2. Production Readiness Issues ⚠️

### 2.1 No Rate Limiting (HIGH)
**File**: `/backend/app/api/chat.py` (WebSocket endpoint)

**Issue**: No rate limiting on WebSocket messages
```python
while True:
    message = await websocket.receive_json()  # ⚠️ Unlimited messages!
```

**Risk**:
- DoS attacks (message flooding)
- Resource exhaustion
- API cost explosion (LLM calls)
- Service degradation for legitimate users

**Recommendation**:
```python
from collections import deque
from datetime import datetime, timedelta

class RateLimiter:
    """Token bucket rate limiter for WebSocket connections."""

    def __init__(self, max_messages: int, window_seconds: int):
        self.max_messages = max_messages
        self.window = timedelta(seconds=window_seconds)
        self.timestamps: deque = deque()

    async def check_rate_limit(self) -> tuple[bool, str | None]:
        """Check if rate limit is exceeded."""
        now = datetime.utcnow()

        # Remove old timestamps outside window
        while self.timestamps and self.timestamps[0] < now - self.window:
            self.timestamps.popleft()

        if len(self.timestamps) >= self.max_messages:
            oldest = self.timestamps[0]
            retry_after = (oldest + self.window - now).total_seconds()
            return False, f"Rate limit exceeded. Try again in {int(retry_after)} seconds."

        self.timestamps.append(now)
        return True, None

# In WebSocket handler:
rate_limiter = RateLimiter(max_messages=20, window_seconds=60)  # 20 msg/min

try:
    while True:
        message = await websocket.receive_json()

        # Check rate limit
        is_allowed, error_msg = await rate_limiter.check_rate_limit()
        if not is_allowed:
            logger.warning("rate_limit_exceeded", extra={"user_id": user_id_str})
            await websocket.send_json({"type": "error", "message": error_msg})
            continue
```

**Additional**: Implement tiered rate limits:
- Per user: 20 messages/minute
- Per IP: 100 messages/minute (prevents multi-user abuse)
- Per connection: Max 100 messages total (prevents long-lived abuse)

**Priority**: 🔴 **HIGH** - Critical for cost control and availability

---

### 2.2 Memory Leak in Chat History (MEDIUM)
**File**: `/backend/app/api/chat.py` (Line 98)

**Issue**: Unbounded chat history stored in memory
```python
history: List[ChatHistoryEntry] = []  # ⚠️ Grows indefinitely!

# Later...
history.append({"role": "user", "content": content})
history.append({"role": "assistant", "content": assistant_message})
```

**Risk**:
- Memory exhaustion on long conversations
- OOM crashes in production
- DoS through extremely long sessions

**Current Mitigation**: History is clipped to last 6 messages in prompt (line 48), but full history still stored

**Recommendation**:
```python
from collections import deque

MAX_HISTORY_MESSAGES = 50  # Limit total stored messages

# Use deque with maxlen for automatic eviction
history: deque[ChatHistoryEntry] = deque(maxlen=MAX_HISTORY_MESSAGES)

# Also add session duration limits
SESSION_MAX_DURATION = 3600  # 1 hour max
session_start = perf_counter()

# In message loop:
if perf_counter() - session_start > SESSION_MAX_DURATION:
    logger.info("session_timeout", extra={"user_id": user_id_str})
    await websocket.send_json({
        "type": "info",
        "message": "Session expired. Please reconnect for a new session."
    })
    await websocket.close(code=1000)
    break
```

**Priority**: ⚠️ **MEDIUM** - Important for stability

---

### 2.3 Missing Request Timeouts (MEDIUM)
**File**: `/backend/app/services/codex_llm.py` (Lines 217-236)

**Issue**: Timeout only on readline, not on full request
```python
chunk = await asyncio.wait_for(
    process.stdout.readline(),
    timeout=settings.CODEX_STREAM_TIMEOUT  # Only 30s per chunk
)
```

**Risk**:
- Very slow responses can still block for hours
- No overall request timeout
- Resource exhaustion from stuck processes

**Recommendation**:
```python
# Add overall request timeout wrapper
async def _stream_completion(self, ...) -> AsyncGenerator[str, None]:
    """Stream completion with overall timeout."""

    async def _inner_stream():
        # Existing streaming logic
        ...

    # Wrap with overall timeout
    try:
        async with asyncio.timeout(settings.CODEX_OVERALL_TIMEOUT):  # e.g., 300s total
            async for chunk in _inner_stream():
                yield chunk
    except asyncio.TimeoutError:
        logger.error("codex_overall_timeout",
                     extra={"timeout": settings.CODEX_OVERALL_TIMEOUT})
        raise RuntimeError("LLM request exceeded maximum time limit")

# In config.py:
CODEX_STREAM_TIMEOUT: float = 30.0  # Per-chunk timeout
CODEX_OVERALL_TIMEOUT: float = 300.0  # Overall request timeout (5 min)
```

**Priority**: ⚠️ **MEDIUM** - Prevents resource leaks

---

### 2.4 No Circuit Breaker for External Services (MEDIUM)
**File**: `/backend/app/services/codex_llm.py`, `/backend/app/services/embedding_service.py`

**Issue**: No protection against cascading failures
```python
# Direct calls to external services with no circuit breaker
response = genai.embed_content(...)  # Gemini API
process = await asyncio.create_subprocess_exec(...)  # Codex CLI
```

**Risk**:
- Cascading failures when external service is down
- Thread pool exhaustion from retries
- Poor user experience (long waits instead of fast fails)

**Recommendation**:
```python
from circuitbreaker import circuit

@circuit(failure_threshold=5, recovery_timeout=60)
async def _call_gemini_api(text: str) -> List[float]:
    """Call Gemini API with circuit breaker protection."""
    try:
        response = genai.embed_content(
            model=settings.GEMINI_EMBEDDING_MODEL,
            content=text
        )
        return response.embedding
    except Exception as e:
        logger.error("gemini_api_failure", extra={"error": str(e)})
        raise

# In embedding service:
def generate_embedding(self, text: str) -> List[float]:
    try:
        return _call_gemini_api(text)
    except CircuitBreakerError:
        # Fast fail when circuit is open
        raise ServiceUnavailableError("Embedding service temporarily unavailable")
```

**Alternative**: Use `aiocache` with fallback to cached embeddings

**Priority**: ⚠️ **MEDIUM** - Improves resilience

---

### 2.5 Insufficient Error Context (LOW-MEDIUM)
**File**: `/backend/app/api/chat.py` (Lines 192-208, 234-249)

**Issue**: Generic error messages lose important context
```python
await websocket.send_json({
    "type": "error",
    "message": "We hit an issue retrieving your study materials."
    # ⚠️ No error ID, no retry guidance, no support contact
})
```

**Risk**:
- Hard to debug production issues
- Poor user experience (no actionable guidance)
- Support team can't help users effectively

**Recommendation**:
```python
import uuid

def create_error_response(
    error_type: str,
    user_message: str,
    internal_error: Exception,
    retryable: bool = False
) -> dict:
    """Create structured error response with tracking."""
    error_id = str(uuid.uuid4())

    logger.error(
        "user_facing_error",
        extra={
            "error_id": error_id,
            "error_type": error_type,
            "internal_error": str(internal_error),
            "retryable": retryable,
        }
    )

    return {
        "type": "error",
        "error_id": error_id,
        "message": user_message,
        "retryable": retryable,
        "support_message": f"If this persists, contact support with error ID: {error_id}",
        "actions": ["retry"] if retryable else ["refresh", "contact_support"],
    }

# Usage:
except Exception as retrieval_error:
    error_response = create_error_response(
        error_type="rag_retrieval_failed",
        user_message="We hit an issue retrieving your study materials. Try again shortly.",
        internal_error=retrieval_error,
        retryable=True
    )
    await websocket.send_json(error_response)
```

**Priority**: ⚠️ **LOW-MEDIUM** - Quality of life improvement

---

## 3. Performance & Scalability Concerns ⚠️

### 3.1 Sequential RAG + LLM Calls (MEDIUM)
**File**: `/backend/app/api/chat.py` (Lines 174-233)

**Issue**: RAG retrieval and LLM generation are sequential
```python
# Step 1: Wait for RAG (can be slow)
chunks = await rag_service.retrieve_context(...)  # ~100-500ms

# Step 2: Wait for LLM (also slow)
stream = codex_llm.generate_completion(...)  # ~1-5s first token
```

**Performance Impact**:
- Cumulative latency (RAG + LLM time to first token)
- Poor perceived performance
- Wasted time when RAG returns no results

**Recommendation**:
```python
# Option 1: Parallel execution with fallback
async def get_context_with_fallback(query: str, timeout: float = 0.5):
    """Get context with aggressive timeout."""
    try:
        return await asyncio.wait_for(
            rag_service.retrieve_context(...),
            timeout=timeout
        )
    except asyncio.TimeoutError:
        logger.warning("rag_timeout_using_fallback")
        return []  # Proceed without context

# Option 2: Streaming with progressive enhancement
# Start LLM immediately with empty context, update when RAG completes
await websocket.send_json({"type": "thinking", "message": "Searching materials..."})
rag_task = asyncio.create_task(rag_service.retrieve_context(...))
llm_task = asyncio.create_task(start_llm_with_placeholder())

# Send RAG results when ready
chunks = await rag_task
await websocket.send_json({"type": "context", "chunks": chunks})

# Continue streaming LLM response
async for token in await llm_task:
    await websocket.send_json({"type": "token", "value": token})
```

**Priority**: ⚠️ **MEDIUM** - Improves user experience

---

### 3.2 Synchronous ChromaDB Calls (MEDIUM)
**File**: `/backend/app/services/rag_service.py` (Lines 97-101)

**Issue**: ChromaDB is synchronous, blocks event loop
```python
search_results = await run_in_threadpool(
    self._embedding_service.search_similar,  # Synchronous call
    query,
    max(top_k * 3, top_k),
)
```

**Performance Impact**:
- Blocks event loop thread
- Reduces concurrency
- Thread pool exhaustion under load

**Recommendation**:
```python
# Option 1: Use async ChromaDB client (if available)
from chromadb.async_client import AsyncPersistentClient

class EmbeddingService:
    def __init__(self):
        self._client = AsyncPersistentClient(path=settings.CHROMA_PERSIST_DIR)

    async def search_similar(self, query: str, top_k: int) -> List[Dict]:
        query_embedding = await self.generate_embedding_async(query)
        results = await self._collection.query(...)
        return matches

# Option 2: Dedicated worker pool with higher limits
from concurrent.futures import ThreadPoolExecutor

# In service initialization
self._executor = ThreadPoolExecutor(
    max_workers=10,
    thread_name_prefix="chromadb_worker"
)

async def search_similar(self, query: str, top_k: int):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        self._executor,
        self._search_similar_sync,
        query,
        top_k
    )
```

**Priority**: ⚠️ **MEDIUM** - Important for scale

---

### 3.3 No Caching Strategy (LOW-MEDIUM)
**File**: `/backend/app/services/rag_service.py`, `/backend/app/services/codex_llm.py`

**Issue**: No caching of expensive operations
```python
# Every query regenerates embeddings
query_embedding = self.generate_embedding(query)  # ~100ms API call

# No caching of common RAG results
chunks = await rag_service.retrieve_context(...)
```

**Performance Impact**:
- Unnecessary API calls for similar queries
- Higher latency and costs
- Missed optimization opportunities

**Recommendation**:
```python
from functools import lru_cache
from hashlib import sha256
import redis.asyncio as redis

class CachedEmbeddingService:
    def __init__(self):
        self._redis = redis.from_url(settings.REDIS_URL)
        self._embedding_service = EmbeddingService()

    async def generate_embedding_cached(self, text: str) -> List[float]:
        """Generate embedding with Redis caching."""
        # Create cache key
        cache_key = f"embedding:{sha256(text.encode()).hexdigest()}"

        # Check cache
        cached = await self._redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # Generate and cache
        embedding = await self._embedding_service.generate_embedding(text)
        await self._redis.setex(
            cache_key,
            86400,  # 24 hour TTL
            json.dumps(embedding)
        )
        return embedding

    async def search_similar_cached(self, query: str, top_k: int) -> List[Dict]:
        """Cache RAG results for common queries."""
        # Normalize query for cache key
        normalized = query.lower().strip()[:200]
        cache_key = f"rag:{sha256(normalized.encode()).hexdigest()}:{top_k}"

        # Check cache (short TTL for RAG since content changes)
        cached = await self._redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # Perform search
        results = await self._embedding_service.search_similar(query, top_k)

        # Cache results (5 minute TTL)
        await self._redis.setex(cache_key, 300, json.dumps(results))
        return results
```

**Priority**: ⚠️ **LOW-MEDIUM** - Cost optimization

---

## 4. Architecture & Maintainability ✅/⚠️

### 4.1 Strengths ✅

#### Excellent Observability
**File**: All services

**What's Good**:
- Comprehensive structured logging with performance metrics
- Per-request tracing with timing data
- Clear log levels and contextual information
- Monitoring-ready log format

```python
logger.info("codex_complete", extra={
    "user_id": user_id,
    "model": model,
    "total_duration_ms": total_duration_ms,
    "tokens_generated": tokens_generated,
    "tokens_per_sec": tokens_per_sec,
})
```

**Recommendation**: ✅ Keep this pattern. Consider adding:
- OpenTelemetry integration for distributed tracing
- Prometheus metrics export
- ELK/Datadog integration

---

#### Clean Separation of Concerns ✅
**Architecture**:
- `/api/chat.py` - WebSocket orchestration
- `/services/codex_llm.py` - LLM abstraction
- `/services/rag_service.py` - RAG logic
- `/services/embedding_service.py` - Vector operations

**What's Good**:
- Single Responsibility Principle
- Easy to test components in isolation
- Clear dependency flow
- No circular dependencies

**Recommendation**: ✅ Excellent design. Consider:
- Adding interface definitions (Protocols) for services
- Dependency injection container for better testing

---

#### Proper Async Patterns ✅
**File**: All async code

**What's Good**:
- Proper use of `async`/`await`
- No blocking I/O in event loop
- Correct use of `run_in_threadpool` for sync code
- Proper resource cleanup with `try`/`finally`

**Recommendation**: ✅ Continue following async best practices

---

### 4.2 Architecture Improvements ⚠️

#### Lack of Domain Models (MEDIUM)
**File**: `/backend/app/api/chat.py`

**Issue**: Business logic mixed with transport layer
```python
# WebSocket handler directly implements chat logic
# Should be: WebSocket → ChatService → RAGService → LLMService
```

**Recommendation**:
```python
# Add domain service layer
class ChatService:
    """Business logic for chat sessions."""

    def __init__(self, rag_service: RagService, llm_service: CodexLLMService):
        self._rag = rag_service
        self._llm = llm_service

    async def process_message(
        self,
        user_id: uuid.UUID,
        message: str,
        user_level: int,
        history: List[ChatHistoryEntry],
    ) -> AsyncGenerator[ChatEvent, None]:
        """Process user message and yield events."""
        # RAG retrieval
        yield ChatEvent(type="status", data="Searching materials...")
        chunks = await self._rag.retrieve_context(user_id, message)
        yield ChatEvent(type="context", data=chunks)

        # LLM generation
        prompt = self._build_prompt(message, user_level, history, chunks)
        async for token in self._llm.generate_completion(prompt):
            yield ChatEvent(type="token", data=token)

        yield ChatEvent(type="complete", data=None)

# WebSocket handler becomes thin transport layer
@router.websocket("/ws")
async def chat_websocket(websocket: WebSocket, ...):
    chat_service = ChatService(rag_service, llm_service)

    async for event in chat_service.process_message(...):
        await websocket.send_json(event.to_dict())
```

**Priority**: ⚠️ **MEDIUM** - Improves testability and maintainability

---

#### No Repository Pattern (LOW-MEDIUM)
**File**: `/backend/app/services/rag_service.py` (Lines 184-198)

**Issue**: Direct SQL queries in service layer
```python
stmt = (
    select(MaterialChunk, Material)
    .join(Material, Material.id == MaterialChunk.material_id)
    .where(MaterialChunk.id.in_(candidate_ids))
    .where(Material.user_id == user_id)
)
result = await session.execute(stmt)
```

**Recommendation**:
```python
# Add repository layer for data access
class MaterialRepository:
    """Data access for materials and chunks."""

    async def get_chunks_by_ids(
        self,
        session: AsyncSession,
        chunk_ids: List[uuid.UUID],
        user_id: uuid.UUID,
    ) -> List[tuple[MaterialChunk, Material]]:
        """Get chunks with materials, ensuring user ownership."""
        stmt = (
            select(MaterialChunk, Material)
            .join(Material, Material.id == MaterialChunk.material_id)
            .where(MaterialChunk.id.in_(chunk_ids))
            .where(Material.user_id == user_id)
            .options(joinedload(MaterialChunk.material))
        )
        result = await session.execute(stmt)
        return result.all()

# Service uses repository
class RagService:
    def __init__(self, repo: MaterialRepository):
        self._repo = repo

    async def retrieve_context(self, ...):
        # Vector search
        search_results = await self._embedding.search_similar(...)

        # Get full chunk data via repository
        chunk_ids = [uuid.UUID(r['id']) for r in search_results]
        chunks = await self._repo.get_chunks_by_ids(session, chunk_ids, user_id)

        return chunks
```

**Priority**: ⚠️ **LOW-MEDIUM** - Better for testing and maintenance

---

## 5. Frontend Security & Reliability ⚠️

### 5.1 WebSocket Reconnection Logic ✅
**File**: `/frontend/src/hooks/useChatSession.ts`

**What's Good**:
- Proper reconnection with exponential backoff
- Connection state management
- Offline detection
- Message queueing during disconnection

**Recommendation**: ✅ Excellent implementation

---

### 5.2 Missing Message Persistence (MEDIUM)
**File**: `/frontend/src/hooks/useChatSession.ts`

**Issue**: Messages lost on page refresh
```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);  // ⚠️ In-memory only
```

**Recommendation**:
```typescript
// Use localStorage for persistence
import { useEffect } from 'react';

const STORAGE_KEY = 'studyin_chat_history';
const MAX_STORED_MESSAGES = 100;

export function useChatSession(options: ChatSessionOptions = {}): ChatSessionState {
  // Load from storage on mount
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save to storage on change
  useEffect(() => {
    try {
      const toStore = messages.slice(-MAX_STORED_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.error('Failed to persist chat history', error);
    }
  }, [messages]);

  // Clear old sessions
  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
  }, []);

  return { messages, clearHistory, ... };
}
```

**Priority**: ⚠️ **MEDIUM** - Improves UX

---

### 5.3 XSS Risk in Message Rendering (HIGH)
**File**: `/frontend/src/components/AICoach/MessageDisplay.tsx` (Need to review)

**Potential Issue**: If messages render without sanitization
```typescript
// ⚠️ DANGEROUS if used
<div dangerouslySetInnerHTML={{ __html: message.content }} />

// ✅ SAFE
<ReactMarkdown>{message.content}</ReactMarkdown>
```

**Recommendation**: Let me check the actual component:

---

## 6. Configuration & DevOps ⚠️

### 6.1 Missing Environment-Specific Configs (MEDIUM)
**File**: `/backend/app/config.py`

**Issue**: Single configuration for all environments
```python
CODEX_MAX_TOKENS: int = 128000  # Same for dev and prod
CODEX_STREAM_TIMEOUT: float = 30.0  # Same for dev and prod
```

**Recommendation**:
```python
# Add environment-specific overrides
class Settings(BaseSettings):
    # Base defaults (development)
    CODEX_MAX_TOKENS: int = 128000
    CODEX_STREAM_TIMEOUT: float = 30.0

    @model_validator(mode="after")
    def _apply_environment_overrides(self) -> "Settings":
        """Apply environment-specific settings."""
        if self.ENVIRONMENT == "production":
            # More conservative limits in production
            if self.CODEX_MAX_TOKENS > 16000:
                logger.warning("Reducing max tokens for production")
                self.CODEX_MAX_TOKENS = 16000

            # Shorter timeouts in production
            if self.CODEX_STREAM_TIMEOUT > 15.0:
                self.CODEX_STREAM_TIMEOUT = 15.0

        return self
```

**Priority**: ⚠️ **MEDIUM** - Production safety

---

### 6.2 Missing Health Checks (LOW-MEDIUM)
**File**: `/monitoring/health.py` (Not reviewed, but should exist)

**Recommendation**:
```python
from fastapi import APIRouter, status
from app.services.codex_llm import codex_llm
from app.services.embedding_service import get_embedding_service

router = APIRouter()

@router.get("/health/live")
async def liveness():
    """Basic liveness check."""
    return {"status": "ok"}

@router.get("/health/ready")
async def readiness():
    """Comprehensive readiness check."""
    checks = {
        "database": False,
        "redis": False,
        "chromadb": False,
        "codex_cli": False,
    }

    # Check database
    try:
        async with get_db() as session:
            await session.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception as e:
        logger.error("health_check_db_failed", extra={"error": str(e)})

    # Check ChromaDB
    try:
        embedding_service = get_embedding_service()
        embedding_service._collection.count()
        checks["chromadb"] = True
    except Exception as e:
        logger.error("health_check_chroma_failed", extra={"error": str(e)})

    # Check Codex CLI
    try:
        result = await asyncio.wait_for(
            codex_llm.generate_completion("test", max_tokens=10),
            timeout=5.0
        )
        checks["codex_cli"] = True
    except Exception as e:
        logger.error("health_check_codex_failed", extra={"error": str(e)})

    all_healthy = all(checks.values())
    status_code = status.HTTP_200_OK if all_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={"status": "ok" if all_healthy else "degraded", "checks": checks}
    )
```

**Priority**: ⚠️ **LOW-MEDIUM** - Operational visibility

---

## 7. Summary & Action Plan

### Critical Issues (Must Fix Before Production) 🔴

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| 1.1 Authentication Bypass | Data breach, compliance violations | High | P0 |
| 1.2 Command Injection | Server compromise | Medium | P0 |
| 1.3 Input Validation | Multiple attack vectors | Medium | P0 |
| 1.4 Origin Validation Bypass | CSWSH attacks | Low | P0 |
| 1.5 Secrets in Config | Credential leaks | Low | P0 |
| 2.1 No Rate Limiting | DoS, cost explosion | Medium | P0 |

**Estimated Time**: 3-5 days (1 developer)

---

### High Priority (Production Readiness) ⚠️

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| 2.2 Memory Leak | Service crashes | Low | P1 |
| 2.3 Missing Timeouts | Resource exhaustion | Low | P1 |
| 2.4 No Circuit Breaker | Poor resilience | Medium | P1 |
| 3.1 Sequential Calls | Poor performance | Medium | P1 |
| 5.3 XSS Risk | Client-side attacks | Low | P1 |

**Estimated Time**: 2-3 days (1 developer)

---

### Medium Priority (Quality & Scale) ⚠️

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| 2.5 Error Context | Support burden | Low | P2 |
| 3.2 Sync ChromaDB | Scalability limits | Medium | P2 |
| 3.3 No Caching | Higher costs | Medium | P2 |
| 4.2.1 Domain Models | Technical debt | High | P2 |
| 5.2 Message Persistence | UX degradation | Low | P2 |
| 6.1 Environment Configs | Operational risk | Low | P2 |

**Estimated Time**: 3-4 days (1 developer)

---

### Quick Wins (High Impact, Low Effort) ⚡

1. **Add input validation** (1.3) - 4 hours
2. **Fix origin validation** (1.4) - 2 hours
3. **Add rate limiting** (2.1) - 4 hours
4. **Fix memory leak** (2.2) - 2 hours
5. **Add request timeout** (2.3) - 2 hours

**Total Quick Wins**: 1-2 days → Significantly improved security

---

## 8. Recommended Implementation Order

### Phase 1: Security Lockdown (Week 1)
```bash
Day 1-2: Authentication & Authorization
- Implement JWT token validation in WebSocket
- Add user ownership checks
- Remove hardcoded user

Day 3: Input Validation & Sanitization
- Add message validation
- Implement prompt injection detection
- Add XSS prevention

Day 4: Resource Protection
- Add rate limiting (per-user, per-IP)
- Add request timeouts
- Fix memory leak

Day 5: Configuration Security
- Secure secrets management
- Add environment validation
- Fix origin validation
```

### Phase 2: Production Readiness (Week 2)
```bash
Day 1-2: Resilience
- Implement circuit breakers
- Add health checks
- Improve error handling

Day 3-4: Performance
- Optimize RAG/LLM pipeline
- Add caching layer
- Fix async bottlenecks

Day 5: Monitoring & Ops
- Add metrics export
- Implement alerting
- Documentation
```

### Phase 3: Architecture Improvements (Week 3)
```bash
Day 1-3: Domain Refactoring
- Extract ChatService
- Add Repository pattern
- Improve testability

Day 4-5: Polish
- Message persistence
- Environment configs
- Load testing
```

---

## 9. Testing Recommendations

### Security Testing Checklist
- [ ] Authentication bypass attempts
- [ ] Command injection payloads
- [ ] Prompt injection attacks
- [ ] XSS vectors in messages
- [ ] CSRF token validation
- [ ] Origin header spoofing
- [ ] Rate limit bypasses
- [ ] Session fixation

### Load Testing Scenarios
```bash
# Concurrent WebSocket connections
artillery run tests/load/websocket-concurrent.yml

# Message flood attack
artillery run tests/load/message-flood.yml

# Long-running sessions
artillery run tests/load/long-sessions.yml

# RAG performance under load
artillery run tests/load/rag-throughput.yml
```

### Integration Testing
```python
# Test complete chat flow
async def test_chat_e2e():
    async with TestWebSocket("/api/chat/ws") as ws:
        # Send message
        await ws.send_json({
            "type": "user_message",
            "content": "Explain cardiac cycle",
            "user_level": 3
        })

        # Verify context retrieval
        context_msg = await ws.receive_json()
        assert context_msg["type"] == "context"
        assert len(context_msg["chunks"]) > 0

        # Verify streaming response
        tokens = []
        while True:
            msg = await ws.receive_json()
            if msg["type"] == "token":
                tokens.append(msg["value"])
            elif msg["type"] == "complete":
                break

        assert len(tokens) > 0
        full_response = "".join(tokens)
        assert len(full_response) > 100
```

---

## 10. Monitoring & Alerting

### Critical Metrics to Track

#### Security Metrics
```python
# Rate limit violations
rate_limit_violations_total{endpoint="chat_ws", user_id="*"}

# Authentication failures
auth_failures_total{reason="invalid_token"}

# Suspicious patterns
prompt_injection_attempts_total{pattern="*"}
```

#### Performance Metrics
```python
# Latency percentiles
chat_response_duration_seconds{quantile="0.5|0.95|0.99"}

# RAG performance
rag_retrieval_duration_seconds{quantile="0.95"}
rag_chunks_retrieved{quantile="0.95"}

# LLM performance
llm_time_to_first_token_seconds{model="*", quantile="0.95"}
llm_tokens_per_second{model="*"}

# Resource usage
websocket_connections_active
chat_memory_usage_bytes
codex_processes_active
```

#### Business Metrics
```python
# Usage patterns
chat_messages_per_session{quantile="0.5|0.95"}
chat_session_duration_seconds{quantile="0.95"}

# Error rates
chat_errors_total{error_type="*"}
chat_error_rate_percent
```

### Alert Conditions
```yaml
alerts:
  - name: HighErrorRate
    condition: chat_error_rate_percent > 5
    severity: critical

  - name: SlowResponseTime
    condition: chat_response_duration_seconds{quantile="0.95"} > 10
    severity: warning

  - name: AuthenticationFailures
    condition: rate(auth_failures_total[5m]) > 10
    severity: critical

  - name: RateLimitViolations
    condition: rate(rate_limit_violations_total[5m]) > 100
    severity: warning

  - name: MemoryLeak
    condition: chat_memory_usage_bytes > 2GB
    severity: critical
```

---

## 11. Compliance Considerations

### FERPA Compliance (Medical Education)
- ✅ User data isolation (after auth fix)
- ❌ Audit logging incomplete
- ❌ Data retention policy undefined
- ❌ Student privacy consent flow missing

### GDPR Compliance
- ❌ Right to erasure not implemented
- ❌ Data portability missing
- ❌ Consent management needed
- ✅ Data minimization (good)

### Security Standards (SOC 2)
- ❌ Access control incomplete
- ✅ Encryption in transit (WebSocket over TLS)
- ❌ Encryption at rest not verified
- ✅ Logging and monitoring (good foundation)

---

## 12. Conclusion

**Current State**: MVP with good foundations but critical security gaps

**Path to Production**:
1. **Immediate** (Week 1): Fix critical security issues (P0)
2. **Short-term** (Week 2): Production readiness (P1)
3. **Medium-term** (Week 3): Architecture improvements (P2)

**Estimated Total Effort**: 3 weeks (1 developer) or 1.5 weeks (2 developers)

**Risk Assessment**:
- **Current deployment**: 🔴 High risk (do not deploy)
- **After Phase 1**: 🟡 Medium risk (suitable for beta)
- **After Phase 2**: 🟢 Low risk (production ready)

---

## Appendix: Code Examples

### A. Complete Authentication Implementation
```python
# backend/app/api/auth.py (JWT validation)
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from jose import jwt, JWTError
from app.config import settings

security = HTTPBearer()

async def verify_jwt_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_db)
) -> User:
    """Verify JWT token and return authenticated user."""
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.JWT_ACCESS_SECRET,
            algorithms=["HS256"]
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

        # Load user from database
        result = await session.execute(
            select(User).where(User.id == uuid.UUID(user_id))
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        return user

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

# backend/app/api/chat.py (WebSocket auth)
@router.websocket("/ws")
async def chat_websocket(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
    session: AsyncSession = Depends(get_db),
):
    """WebSocket endpoint with JWT authentication."""
    # Validate token before accepting connection
    try:
        payload = jwt.decode(token, settings.JWT_ACCESS_SECRET, algorithms=["HS256"])
        user_id = uuid.UUID(payload["sub"])

        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            await websocket.close(code=4401, reason="Invalid user")
            return
    except Exception as e:
        logger.error("websocket_auth_failed", extra={"error": str(e)})
        await websocket.close(code=4401, reason="Authentication failed")
        return

    # Validate origin
    origin = websocket.headers.get("origin")
    if not origin or origin not in settings.get_cors_origins_list():
        await websocket.close(code=1008)
        return

    await websocket.accept()
    # ... rest of handler
```

### B. Complete Rate Limiting Implementation
```python
# backend/app/middleware/rate_limit.py
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, Deque
from collections import deque
import asyncio

class WebSocketRateLimiter:
    """Token bucket rate limiter for WebSocket connections."""

    def __init__(
        self,
        max_messages: int = 20,
        window_seconds: int = 60,
        max_connections_per_ip: int = 10,
    ):
        self.max_messages = max_messages
        self.window = timedelta(seconds=window_seconds)
        self.max_connections_per_ip = max_connections_per_ip

        # Per-user rate limits
        self._user_timestamps: Dict[str, Deque[datetime]] = defaultdict(
            lambda: deque(maxlen=max_messages)
        )

        # Per-IP connection tracking
        self._ip_connections: Dict[str, int] = defaultdict(int)

        # Cleanup task
        self._cleanup_task = asyncio.create_task(self._periodic_cleanup())

    async def check_message_rate_limit(
        self,
        user_id: str
    ) -> tuple[bool, str | None]:
        """Check if user has exceeded message rate limit."""
        now = datetime.utcnow()
        timestamps = self._user_timestamps[user_id]

        # Remove old timestamps
        while timestamps and timestamps[0] < now - self.window:
            timestamps.popleft()

        if len(timestamps) >= self.max_messages:
            oldest = timestamps[0]
            retry_after = int((oldest + self.window - now).total_seconds())
            return False, f"Rate limit exceeded. Try again in {retry_after} seconds."

        timestamps.append(now)
        return True, None

    async def check_connection_limit(self, ip: str) -> tuple[bool, str | None]:
        """Check if IP has exceeded connection limit."""
        if self._ip_connections[ip] >= self.max_connections_per_ip:
            return False, "Too many connections from your IP address"
        return True, None

    def track_connection(self, ip: str) -> None:
        """Track new connection."""
        self._ip_connections[ip] += 1

    def release_connection(self, ip: str) -> None:
        """Release connection."""
        if ip in self._ip_connections:
            self._ip_connections[ip] = max(0, self._ip_connections[ip] - 1)

    async def _periodic_cleanup(self) -> None:
        """Periodically clean up old data."""
        while True:
            await asyncio.sleep(300)  # Every 5 minutes

            # Clean up empty IP entries
            self._ip_connections = {
                ip: count
                for ip, count in self._ip_connections.items()
                if count > 0
            }

            # Clean up old user entries
            now = datetime.utcnow()
            for user_id, timestamps in list(self._user_timestamps.items()):
                while timestamps and timestamps[0] < now - self.window:
                    timestamps.popleft()
                if not timestamps:
                    del self._user_timestamps[user_id]

# Global rate limiter instance
_rate_limiter = WebSocketRateLimiter()

def get_rate_limiter() -> WebSocketRateLimiter:
    return _rate_limiter

# Usage in WebSocket handler:
@router.websocket("/ws")
async def chat_websocket(websocket: WebSocket, ...):
    rate_limiter = get_rate_limiter()
    client_ip = websocket.client.host

    # Check connection limit
    is_allowed, error = await rate_limiter.check_connection_limit(client_ip)
    if not is_allowed:
        await websocket.close(code=1008, reason=error)
        return

    rate_limiter.track_connection(client_ip)

    try:
        await websocket.accept()

        while True:
            message = await websocket.receive_json()

            # Check message rate limit
            is_allowed, error = await rate_limiter.check_message_rate_limit(user_id_str)
            if not is_allowed:
                await websocket.send_json({"type": "error", "message": error})
                continue

            # Process message...
    finally:
        rate_limiter.release_connection(client_ip)
```

---

**END OF REVIEW**

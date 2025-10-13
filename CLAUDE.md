# Claude Code Workflows

> **Living Document**: Track how we use Claude Code and Codex CLI for this project

Last Updated: 2025-10-12

---

## 🎯 Project Context (READ THIS FIRST!)

**This is a PERSONAL project, but it needs to WORK reliably.**

### Key Facts:
- **Owner**: Single developer (kyin) building a real medical education platform
- **Purpose**: Functional learning tool for personal use + portfolio piece
- **Scale**: Personal use initially, but built with production quality
- **Standards**: It has to actually work - no cutting corners on functionality

### What This Means for Claude Code:
- ✅ **Production-quality code** - security, performance, reliability matter
- ✅ **Focus on what works** - pragmatic solutions over theoretical perfection
- ✅ **Real-world testing** - features need to actually function end-to-end
- ✅ **Smart priorities** - fix critical issues, optimize high-impact areas
- ⚖️ **Balance formality with practicality** - no bureaucracy, but don't skip important stuff
- ❌ **Don't overwhelm with process** - skip ROI analyses, org charts, stakeholder sign-offs
- ❌ **Don't over-engineer** - solve actual problems, not hypothetical ones

### The Right Approach:
- **Security issues that break functionality** → Fix them (they matter)
- **Performance issues users will feel** → Fix them (they matter)
- **Tests for critical paths** → Write them (they matter)
- **Enterprise bureaucracy** → Skip it (doesn't matter for solo dev)
- **Theoretical edge cases** → Defer unless they actually happen

---

## Claude Code vs Codex CLI

### Claude Code (This Tool)
- **What**: Interactive CLI for development
- **Use For**: Planning, architecture, code review, guidance
- **Access**: Available now, running in terminal

### Codex CLI (For Production)
- **What**: AI-powered code execution with OAuth
- **Use For**: LLM integration in the app (RAG, question generation, AI coach)
- **Access**: `codex` command after OAuth sign-in

**Key Difference**: Claude Code helps you BUILD. Codex CLI runs INSIDE your app.

---

## Current Project Setup

### Authentication
```bash
# Codex CLI uses OAuth (no API keys!)
codex

# Sign in with ChatGPT account
# Authentication persists across sessions
# Stored locally, no need to re-auth
```

### Workspace
```
/Users/kyin/Projects/Studyin/
├── backend/         # FastAPI + Python
├── frontend/        # Next.js + React
├── docs/            # Documentation (this file)
└── [all .md files]  # Living documents
```

---

## Claude Code Usage Patterns

### 1. Planning & Architecture

**When**: Before implementing features
**How**: Ask Claude to design/review approach

**Example**:
```
"I'm implementing authentication. Review this approach:
- JWT with access + refresh tokens
- Redis for token blacklist
- bcrypt for password hashing

Any security concerns or improvements?"
```

**Agents to Invoke**: backend-architect, security-auditor

---

### 2. Code Generation

**When**: Need boilerplate or starting point
**How**: Ask for specific code patterns

**Example**:
```
"Generate FastAPI endpoint for file upload with:
- Max 50MB file size
- PDF/DOCX validation
- Async processing
- Progress tracking
- Error handling"
```

**Agents to Invoke**: python-pro, backend-architect

---

### 3. Code Review

**When**: Before merging to main
**How**: Share code and ask for review

**Example**:
```
"Review this authentication endpoint:
[paste code]

Check for:
- Security vulnerabilities
- Performance issues
- Best practices
- Edge cases"
```

**Agents to Invoke**: code-reviewer, security-auditor

---

### 4. Debugging

**When**: Stuck on errors or bugs
**How**: Share error + context

**Example**:
```
"Getting this error:
[error message]

In this code:
[code snippet]

Expected: User logs in successfully
Actual: 401 Unauthorized

What's wrong?"
```

**Agents to Invoke**: debugger, python-pro

---

### 5. Optimization

**When**: Performance issues
**How**: Share metrics + code

**Example**:
```
"This endpoint is slow (2.5s):
[code]

Goal: < 500ms
Current: 2.5s

How to optimize?"
```

**Agents to Invoke**: performance-engineer, database-optimizer

---

### 6. Learning & Guidance

**When**: Unsure about patterns or best practices
**How**: Ask for explanation + examples

**Example**:
```
"Explain Next.js 15 Server Components vs Client Components.
When to use each?
Show examples for this project."
```

**Agents to Invoke**: frontend-developer, typescript-pro

---

## Codex CLI Integration (In Your App)

### Where Codex CLI is Used

#### Phase 2: Document Processing
```python
# backend/app/services/embedder.py
# Uses Codex CLI to generate embeddings

from anthropic import Anthropic

client = Anthropic()  # Uses OAuth, no API key needed

async def generate_embedding(text: str) -> List[float]:
    """Generate embeddings via Codex CLI"""
    response = await client.embeddings.create(
        input=text,
        model="voyage-2"  # Or similar
    )
    return response.data[0].embedding
```

#### Phase 3: AI Coach
```python
# backend/app/services/ai_coach/coach.py
# Uses Codex CLI for teaching

async def generate_teaching_response(
    context: str,
    question: str,
    user_level: int
) -> str:
    """Generate Socratic teaching response"""
    response = await client.messages.create(
        model="claude-3-5-sonnet-20241022",
        messages=[{
            "role": "user",
            "content": prompt_template.substitute(
                context=context,
                question=question,
                level=user_level
            )
        }],
        stream=True  # Stream for better UX
    )
    return response
```

#### Phase 4: Question Generation
```python
# backend/app/services/question_generator/generator.py
# Uses Codex CLI for MCQ generation

async def generate_mcqs(
    content: str,
    difficulty: int,
    num_questions: int
) -> List[Question]:
    """Generate NBME-style questions"""
    response = await client.messages.create(
        model="claude-3-5-sonnet-20241022",
        messages=[{
            "role": "user",
            "content": mcq_prompt.substitute(
                content=content,
                difficulty=difficulty,
                num=num_questions
            )
        }]
    )
    return parse_questions(response)
```

---

## Workflow: Implementing a Feature

### Step-by-Step Example: AI Coach (Phase 3)

#### 1. Planning with Claude Code
```
You: "I'm implementing AI coach with WebSocket for real-time chat.
Use Codex CLI for LLM. Review this approach:

[Share your plan]

What should I consider?"

Claude Code: [Invokes ai-engineer, backend-architect]
- Suggests RAG integration
- WebSocket best practices
- Streaming response patterns
- Context management strategy
```

#### 2. Implementation
```bash
# Write code yourself or with Claude's help
# Use agents for specific patterns

# Example: Ask for WebSocket pattern
You: "Show me FastAPI WebSocket pattern for streaming LLM responses"

Claude Code: [Invokes python-pro]
[Provides code example]
```

#### 3. Integration with Codex CLI
```python
# You write this in your app
# Codex CLI runs inside it

client = Anthropic()  # OAuth, no API key!

async def stream_response(prompt: str):
    async with client.messages.stream(
        model="claude-3-5-sonnet-20241022",
        messages=[{"role": "user", "content": prompt}]
    ) as stream:
        async for text in stream.text_stream:
            yield text
```

#### 4. Testing
```
You: "How do I test WebSocket + streaming responses?"

Claude Code: [Invokes test-automator]
[Provides test examples]
```

#### 5. Review Before Merge
```
You: "Review my AI coach implementation:
[Share code]"

Claude Code: [Invokes code-reviewer, security-auditor]
[Provides review feedback]
```

---

## Best Practices

### With Claude Code

#### ✅ Do:
- Ask for planning before coding
- Use agents for specialized tasks
- Request code reviews before merge
- Ask for explanations, not just code
- Iterate on agent feedback

#### ❌ Don't:
- Blindly copy-paste without understanding
- Skip planning phase
- Ignore agent warnings
- Use wrong agent for task
- Forget to update living documents

### With Codex CLI

#### ✅ Do:
- Use OAuth (already set up)
- Stream responses for better UX
- Cache common requests
- Handle rate limits gracefully
- Monitor token usage

#### ❌ Don't:
- Hardcode API keys (use OAuth!)
- Block on synchronous calls
- Ignore error handling
- Skip caching strategy
- Forget to test edge cases

---

## Dynamic Configuration

### Backend Config (No Hardcoding!)
```python
# backend/app/config.py

class Settings(BaseSettings):
    # Codex CLI settings (dynamic!)
    CODEX_MODEL: str = "claude-3-5-sonnet-20241022"
    CODEX_MAX_TOKENS: int = 4096
    CODEX_TEMPERATURE: float = 0.7

    # Can change via environment variables
    class Config:
        env_file = ".env"
```

### Usage
```python
from app.config import settings

# Dynamic model selection
model = settings.CODEX_MODEL  # From config, not hardcoded!

response = await client.messages.create(
    model=model,  # Dynamic
    max_tokens=settings.CODEX_MAX_TOKENS,  # Dynamic
    temperature=settings.CODEX_TEMPERATURE,  # Dynamic
    messages=messages
)
```

---

## Common Workflows

### Workflow 1: "I'm stuck on a bug"
```
1. Share error message + code with Claude Code
2. Invoke: debugger agent
3. Get diagnosis and fix suggestion
4. Implement fix
5. Test
6. Ask for review if complex
```

### Workflow 2: "How do I implement X?"
```
1. Ask Claude Code for approach
2. Invoke: relevant architect agent
3. Get architecture design
4. Ask for code patterns
5. Invoke: relevant pro agent (python-pro, typescript-pro)
6. Implement with guidance
7. Review with code-reviewer
```

### Workflow 3: "Is this code good?"
```
1. Share code with Claude Code
2. Invoke: code-reviewer
3. Get feedback on:
   - Best practices
   - Security
   - Performance
   - Bugs
4. Iterate based on feedback
5. Re-review if significant changes
```

### Workflow 4: "Design feature X"
```
1. Describe feature to Claude Code
2. Invoke: backend-architect or frontend-developer
3. Get architecture design
4. Ask for implementation plan
5. Break into todos
6. Implement phase by phase
7. Review before merge
```

---

## Integration Points

### Claude Code Helps You:
- Plan architecture
- Review code
- Debug issues
- Learn patterns
- Make decisions
- Optimize performance

### Codex CLI Powers Your App:
- Document embeddings
- AI coach responses
- Question generation
- Semantic search
- Content analysis
- Personalization

### They Work Together:
1. Claude Code: "Design the RAG pipeline"
2. You: Implement with Codex CLI
3. Claude Code: "Review the implementation"
4. You: Deploy to production

---

## Phase-Specific Guidance

### Phase 0-1: Foundation
**Claude Code**: Architecture, setup guidance, config design
**Codex CLI**: Not used yet

### Phase 2: Document Processing
**Claude Code**: RAG architecture, chunking strategy
**Codex CLI**: Generate embeddings for chunks

### Phase 3: AI Coach
**Claude Code**: WebSocket design, streaming patterns
**Codex CLI**: Generate teaching responses, learning paths

### Phase 4: Questions
**Claude Code**: Question generation approach
**Codex CLI**: Generate NBME-style MCQs

### Phase 5-8: Features & Deploy
**Claude Code**: Optimization, testing, deployment
**Codex CLI**: Ongoing AI features

---

## Prompting Tips

### For Claude Code

**Be Specific**:
❌ "Help with auth"
✅ "Review JWT implementation with Redis token blacklist"

**Provide Context**:
❌ "Fix this error: [error]"
✅ "Getting [error] in [file] when [action]. Expected [X], got [Y]. Code: [snippet]"

**Use Agents**:
❌ "Make this better"
✅ "Invoke code-reviewer to check for security issues"

**Iterate**:
❌ Accept first response
✅ Ask follow-ups, request alternatives, dig deeper

### For Codex CLI (In Your App)

**Be Clear**:
❌ "Teach me about the heart"
✅ "Explain cardiac cycle phases with focus on: [specific aspects]. User level: medical student year 2."

**Provide Context**:
```python
# Include relevant context from RAG
context = retrieve_relevant_chunks(topic)

prompt = f"""Context: {context}

User question: {question}
User level: {user_level}

Provide Socratic teaching response."""
```

**Stream for UX**:
```python
# Always stream long responses
async for chunk in stream_response(prompt):
    await websocket.send_text(chunk)
```

---

## Debugging Checklist

### When Things Break

#### 1. Check Authentication
```bash
# Codex CLI authenticated?
codex status  # Or similar command

# Re-authenticate if needed
codex logout
codex
```

#### 2. Check Configuration
```python
# All config from env?
from app.config import settings
print(settings.model_dump())  # Should show all settings from .env
```

#### 3. Check Error Messages
```
Share with Claude Code:
- Full error message
- Stack trace
- Code snippet
- Expected vs actual behavior
```

#### 4. Invoke Debugger
```
"I'm getting [error]. Here's the context: [details]"
Invoke: debugger agent
```

---

## Performance Monitoring

### What to Track
- Codex CLI API call latency
- Token usage per request
- Cache hit rates
- Error rates
- User response time

### How to Monitor
```python
# backend/app/middleware/monitoring.py

@app.middleware("http")
async def monitor_codex(request, call_next):
    if "codex" in request.url.path:
        start = time.time()
        response = await call_next(request)
        duration = time.time() - start

        # Log metrics
        logger.info(f"Codex call: {duration}s")

        return response
```

---

## Living Document Updates

### When to Update This File
- Discover new patterns
- Find better workflows
- Encounter issues
- Learn from mistakes
- Add new integrations

### How to Update
1. Add section with date
2. Document pattern/learning
3. Provide examples
4. Update relevant sections
5. Note in Changelog

---

## Changelog

### 2025-10-09
- Initial Claude Code workflow documentation
- Codex CLI integration patterns
- Phase-specific guidance
- Debugging checklist
- Best practices

---

**Next Update**: After Phase 0 complete (add actual learnings)

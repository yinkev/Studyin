# Agents Reference

> **Living Document**: Update as we discover new agent usage patterns

Last Updated: 2025-10-09

---

## Quick Reference

### By Task Type

| Task | Primary Agent | Secondary | When to Use |
|------|---------------|-----------|-------------|
| API Design | backend-architect | architect-review | Before building endpoints |
| Python Code | python-pro | debugger | All backend work |
| React/Next.js | frontend-developer | typescript-pro | All frontend work |
| AI/LLM Integration | ai-engineer | prompt-engineer | RAG, Codex CLI, embeddings |
| Database Schema | database-architect | database-optimizer | Before creating models |
| Security | security-auditor | backend-architect | Auth, API security |
| Performance | performance-engineer | database-optimizer | When optimizing |
| Testing | test-automator | code-reviewer | Before merge |
| UI/UX | ui-ux-designer | frontend-developer | Design decisions |
| Deployment | deployment-engineer | cloud-architect | CI/CD, production |
| Debugging | debugger | error-detective | When stuck |

---

## Core Agents (Use Frequently)

### 1. **python-pro**
**Purpose**: Modern Python development, async patterns, best practices

**Use For**:
- FastAPI implementation
- Async/await patterns
- Pydantic models and validation
- Python 3.11+ features
- Type hints and mypy
- Code optimization

**Example Invocation**:
```
"Review this FastAPI endpoint and optimize for async performance"
"Implement SM-2 spaced repetition algorithm in Python"
"Create Pydantic model for dynamic configuration"
```

**Current Project Uses**:
- [ ] Phase 0: Setup FastAPI structure
- [ ] Phase 1: Auth endpoints
- [ ] Phase 2: Document processing
- [ ] Phase 4: Quiz logic
- [ ] Phase 5: SM-2 algorithm

---

### 2. **frontend-developer**
**Purpose**: React 19, Next.js 15, modern frontend patterns

**Use For**:
- Next.js App Router
- Server Components vs Client Components
- React hooks and state management
- WebSocket client implementation
- Streaming UI updates
- Animations with Framer Motion

**Example Invocation**:
```
"Build skill tree component with React Server Components"
"Implement WebSocket client for AI coach chat"
"Create streaming response display with Suspense"
```

**Current Project Uses**:
- [ ] Phase 0: Next.js setup
- [ ] Phase 1: Auth UI, dashboard
- [ ] Phase 3: Skill tree, chat UI
- [ ] Phase 6: Gamification UI

---

### 3. **ai-engineer**
**Purpose**: LLM integration, RAG, vector databases, AI systems

**Use For**:
- Codex CLI integration
- RAG pipeline architecture
- Vector database (Qdrant) setup
- Embedding generation
- Semantic search
- Context management
- AI coach implementation

**Example Invocation**:
```
"Design RAG pipeline for medical document processing"
"Implement Codex CLI integration with OAuth"
"Build semantic search with Qdrant"
```

**Current Project Uses**:
- [ ] Phase 2: RAG pipeline, embeddings
- [ ] Phase 3: AI coach, learning paths
- [ ] Phase 4: Question generation

---

### 4. **backend-architect**
**Purpose**: API design, service architecture, system design

**Use For**:
- REST + WebSocket API design
- Service layer architecture
- Repository pattern
- Data flow design
- Microservices boundaries (future)
- Integration patterns

**Example Invocation**:
```
"Design WebSocket API for real-time learning sessions"
"Create repository pattern for data access"
"Review service architecture for learning path generation"
```

**Current Project Uses**:
- [ ] Phase 1: API structure
- [ ] Phase 3: WebSocket design
- [ ] Phase 7: Architecture review

---

### 5. **code-reviewer**
**Purpose**: Code quality, best practices, pre-merge reviews

**Use For**:
- Before merging features
- After implementing complex logic
- Security review
- Performance review
- Best practices enforcement

**Example Invocation**:
```
"Review authentication implementation before merge"
"Check for security vulnerabilities in file upload"
"Review database queries for N+1 issues"
```

**Current Project Uses**:
- [ ] End of every phase
- [ ] Before merging to main
- [ ] After major features

---

## Specialized Agents

### **database-architect**
**When**: Schema design, relationship modeling
**Use For**:
- PostgreSQL schema design
- Relationship design (1:M, M:M)
- Index strategy
- Migration planning

**Current Uses**:
- [ ] Phase 1: Initial schema
- [ ] Phase 2: Material/chunk relationships
- [ ] Phase 5: Progress tracking schema

---

### **database-optimizer**
**When**: Performance issues, slow queries
**Use For**:
- Query optimization
- Index creation
- N+1 query prevention
- Connection pooling
- Aggregation optimization

**Current Uses**:
- [ ] Phase 5: Analytics queries
- [ ] Phase 7: Performance optimization

---

### **security-auditor**
**When**: Auth, security features, before production
**Use For**:
- JWT implementation review
- Password security
- API security
- CORS configuration
- Input validation
- OWASP compliance

**Current Uses**:
- [ ] Phase 1: Auth implementation
- [ ] Phase 7: Security audit
- [ ] Phase 8: Pre-production review

---

### **prompt-engineer**
**When**: Creating LLM prompts
**Use For**:
- Medical education prompts
- Socratic questioning
- NBME-style question generation
- Context-aware teaching
- Prompt template design

**Current Uses**:
- [ ] Phase 3: AI coach prompts
- [ ] Phase 4: Question generation prompts

---

### **performance-engineer**
**When**: Optimization needed
**Use For**:
- API response time optimization
- Frontend bundle optimization
- Caching strategy
- Load time improvement
- Async processing optimization

**Current Uses**:
- [ ] Phase 2: Document processing
- [ ] Phase 7: Overall optimization

---

### **test-automator**
**When**: Writing tests, test strategy
**Use For**:
- Test automation setup
- Pytest patterns
- E2E tests (Playwright)
- Test coverage
- Integration tests

**Current Uses**:
- [ ] Phase 7: Comprehensive testing
- [ ] Ongoing: Unit tests

---

### **ui-ux-designer**
**When**: Design decisions, UX flows
**Use For**:
- Soft Kawaii UI design
- User flows
- Component design
- Accessibility
- Design system

**Current Uses**:
- [ ] Phase 0: Design system
- [ ] Phase 6: Gamification design

---

### **deployment-engineer**
**When**: CI/CD, deployment
**Use For**:
- GitHub Actions workflows
- Deployment automation
- Environment setup
- Rollback procedures

**Current Uses**:
- [ ] Phase 8: Deployment

---

### **observability-engineer**
**When**: Monitoring, logging
**Use For**:
- Prometheus + Grafana
- Logging strategy
- Error tracking (Sentry)
- Performance monitoring

**Current Uses**:
- [ ] Phase 8: Monitoring setup

---

### **debugger**
**When**: Stuck on bugs, errors
**Use For**:
- Error investigation
- Stack trace analysis
- Root cause identification
- Debugging complex issues

**Current Uses**:
- [ ] Ongoing: When stuck

---

## Agent Workflows

### Feature Development Workflow

#### 1. Planning Phase
```
backend-architect → Design approach
database-architect → Schema design (if needed)
architect-review → Validate decisions
```

#### 2. Implementation Phase
```
python-pro OR frontend-developer → Write code
ai-engineer → LLM integration (if needed)
debugger → Fix issues as they arise
```

#### 3. Quality Phase
```
code-reviewer → Review code
security-auditor → Security check (if auth/sensitive)
test-automator → Ensure test coverage
```

#### 4. Merge
```
Git commit and merge to main
```

---

### AI Feature Workflow

#### Example: Implementing AI Coach (Phase 3)

```
Step 1: Design
- ai-engineer: "Design RAG + LLM pipeline for AI coach"
- backend-architect: "Design WebSocket API for real-time chat"
- prompt-engineer: "Create medical education teaching prompts"

Step 2: Implement
- python-pro: "Implement WebSocket handlers with async"
- frontend-developer: "Build chat UI with streaming responses"
- ai-engineer: "Integrate Codex CLI with OAuth"

Step 3: Optimize
- performance-engineer: "Optimize streaming response performance"

Step 4: Review
- code-reviewer: "Review AI coach implementation"
- security-auditor: "Check WebSocket security"

Step 5: Test
- test-automator: "Write tests for AI coach"
```

---

## Agent Best Practices

### ✅ Do:
- Use agents **before** you're stuck
- Chain multiple agents for complex tasks
- Review agent output critically
- Document agent recommendations
- Use agents for planning, not just coding

### ❌ Don't:
- Blindly accept agent output
- Use wrong agent for task
- Skip quality agents before merge
- Ignore agent warnings
- Use agents as replacement for thinking

---

## Agent Invocation Templates

### For Planning:
```
"I'm about to implement [feature]. Review the approach:
[Your plan]

Suggest improvements for:
- Architecture
- Performance
- Security
- Best practices"
```

### For Code Review:
```
"Review this [component/endpoint/function]:
[Code]

Check for:
- Best practices
- Security issues
- Performance problems
- Potential bugs"
```

### For Debugging:
```
"I'm encountering this error:
[Error message]

In this code:
[Code snippet]

Expected: [Expected behavior]
Actual: [Actual behavior]

Help debug and fix."
```

### For Optimization:
```
"This [endpoint/component] is slow:
[Code]

Current performance: [metrics]
Target: [target metrics]

Optimize for performance."
```

---

## Current Phase Agent Plan

### Phase 0: Foundation
**Primary**: dx-optimizer, python-pro, frontend-developer
**Secondary**: backend-architect, security-auditor
**Usage**: Setup, configuration, initial structure

### Phase 1: Core Infrastructure
**Primary**: backend-architect, database-architect, security-auditor
**Secondary**: python-pro, frontend-developer
**Usage**: Auth, database, API structure

### Phase 2: Document Processing
**Primary**: ai-engineer, python-pro, performance-engineer
**Secondary**: backend-architect
**Usage**: RAG pipeline, embeddings, processing

### Phase 3: AI Coach
**Primary**: ai-engineer, prompt-engineer, backend-architect
**Secondary**: frontend-developer, performance-engineer
**Usage**: LLM integration, WebSocket, UI

### Phase 4-6: Features
**Primary**: python-pro, frontend-developer, ui-ux-designer
**Secondary**: ai-engineer, performance-engineer
**Usage**: Implementation, optimization

### Phase 7: Polish
**Primary**: performance-engineer, test-automator, code-reviewer
**Secondary**: security-auditor, database-optimizer
**Usage**: Optimization, testing, quality

### Phase 8: Deploy
**Primary**: deployment-engineer, observability-engineer
**Secondary**: cloud-architect, security-auditor
**Usage**: CI/CD, monitoring, production

---

## Notes

- **Update this document** as we discover new patterns
- **Track successful invocations** for reference
- **Document failures** to avoid repeating mistakes
- **Share learnings** across phases

---

## Changelog

### 2025-10-09
- Initial agent reference created
- Mapped agents to all 8 phases
- Created workflow templates
- Added best practices

---

**Remember**: Agents are tools. Use strategically, review critically, iterate continuously.

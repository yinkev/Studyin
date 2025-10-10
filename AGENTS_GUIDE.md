# Agent Usage Guide - Studyin Project

## Agents You'll Need for This Project

Based on the phase-based plan and architecture, here's which agents to use for different tasks:

---

## Phase 0: Foundation Setup

### **python-pro**
- **When**: Setting up FastAPI backend structure
- **Use for**:
  - Creating modern Python project structure
  - Implementing Pydantic Settings for config
  - Setting up async patterns
  - Best practices for Python 3.11+

### **typescript-pro**
- **When**: Setting up Next.js frontend
- **Use for**:
  - TypeScript configuration and types
  - Advanced type inference
  - Generic patterns for components

### **dx-optimizer**
- **When**: Setting up development environment
- **Use for**:
  - Optimizing development workflow
  - Setting up tooling (ESLint, Prettier, etc.)
  - Improving developer experience

---

## Phase 1: Core Infrastructure

### **backend-architect**
- **When**: Designing API structure and services
- **Use for**:
  - API endpoint design (REST + WebSocket)
  - Service architecture decisions
  - Data flow patterns
  - Repository pattern implementation

### **database-architect**
- **When**: Designing database schema
- **Use for**:
  - PostgreSQL schema design
  - Relationship modeling
  - Index strategy
  - Migration planning

### **security-auditor**
- **When**: Implementing authentication
- **Use for**:
  - JWT implementation review
  - Password hashing best practices
  - Security middleware
  - CORS configuration

### **frontend-developer**
- **When**: Building React components
- **Use for**:
  - Next.js 15 App Router patterns
  - Server Components vs Client Components
  - Authentication UI
  - State management with Zustand

---

## Phase 2: Document Processing & RAG

### **python-pro**
- **When**: Building document processing pipeline
- **Use for**:
  - Async file processing
  - PDF/DOCX parsing
  - Chunking algorithms
  - Background job patterns

### **ai-engineer**
- **When**: Integrating Codex CLI and RAG
- **Use for**:
  - RAG pipeline architecture
  - Vector database integration (Qdrant)
  - Embedding generation with Codex CLI
  - Semantic search implementation

### **performance-engineer**
- **When**: Optimizing file processing
- **Use for**:
  - Async processing optimization
  - Caching strategy
  - Background job performance

---

## Phase 3: AI Coach & Learning Paths

### **ai-engineer**
- **When**: Building AI coach and learning path generation
- **Use for**:
  - Prompt engineering for medical education
  - Codex CLI integration patterns
  - Context management
  - Streaming responses
  - RAG context injection

### **prompt-engineer**
- **When**: Crafting medical education prompts
- **Use for**:
  - Medical education prompt templates
  - Socratic questioning patterns
  - NBME-style question generation prompts
  - Context-aware teaching strategies

### **backend-architect**
- **When**: Implementing WebSocket for real-time chat
- **Use for**:
  - WebSocket architecture
  - Real-time session management
  - Bi-directional communication patterns

### **frontend-developer**
- **When**: Building interactive learning UI
- **Use for**:
  - Skill tree visualization
  - WebSocket client implementation
  - Streaming response display
  - Real-time updates

---

## Phase 4: Question Generation & Assessment

### **ai-engineer**
- **When**: Building MCQ generation system
- **Use for**:
  - Question generation with Codex CLI
  - Quality scoring algorithms
  - Answer validation logic

### **python-pro**
- **When**: Implementing quiz logic
- **Use for**:
  - Quiz session state management
  - Answer evaluation algorithms
  - Statistics calculation

---

## Phase 5: Spaced Repetition & Progress

### **python-pro**
- **When**: Implementing SM-2 algorithm
- **Use for**:
  - SM-2 algorithm implementation
  - Progress calculation logic
  - Analytics aggregation

### **database-optimizer**
- **When**: Optimizing analytics queries
- **Use for**:
  - Query optimization
  - Index creation
  - Aggregation performance

### **frontend-developer**
- **When**: Building progress dashboard
- **Use for**:
  - Chart components (Recharts)
  - Data visualization
  - Progress indicators

---

## Phase 6: Gamification

### **frontend-developer**
- **When**: Building gamification UI
- **Use for**:
  - XP bars, level badges
  - Achievement showcase
  - Animations with Framer Motion
  - Mascot animations

### **ui-ux-designer**
- **When**: Designing gamification UX
- **Use for**:
  - Soft Kawaii UI design
  - Pixel art integration
  - Animation patterns
  - Reward feedback loops

---

## Phase 7: Polish & Optimization

### **performance-engineer**
- **When**: Optimizing performance
- **Use for**:
  - Frontend bundle optimization
  - API response time optimization
  - Caching strategy
  - Load time improvements

### **database-optimizer**
- **When**: Database performance tuning
- **Use for**:
  - Query optimization
  - Index tuning
  - N+1 query prevention
  - Connection pooling

### **test-automator**
- **When**: Writing tests
- **Use for**:
  - Test automation strategy
  - Pytest best practices
  - E2E test setup (Playwright)
  - Test coverage

### **security-auditor**
- **When**: Security audit
- **Use for**:
  - Vulnerability scanning
  - Security best practices
  - Penetration testing
  - OWASP compliance

### **code-reviewer**
- **When**: Code quality review
- **Use for**:
  - Code review before merging phases
  - Best practices enforcement
  - Performance issues
  - Security concerns

---

## Phase 8: Deployment

### **deployment-engineer**
- **When**: Setting up CI/CD
- **Use for**:
  - GitHub Actions workflows
  - Deployment automation
  - Staging/production environments

### **cloud-architect**
- **When**: Production infrastructure
- **Use for**:
  - VPS/Cloud setup
  - Database backups
  - SSL/HTTPS configuration
  - CDN setup

### **observability-engineer**
- **When**: Setting up monitoring
- **Use for**:
  - Prometheus + Grafana setup
  - Logging strategy
  - Alert configuration
  - Performance monitoring

---

## Ongoing Throughout All Phases

### **debugger**
- **When**: Encountering bugs or errors
- **Use for**:
  - Debugging issues
  - Error investigation
  - Stack trace analysis
  - Root cause identification

### **code-reviewer**
- **When**: After implementing features
- **Use for**:
  - Pre-merge code review
  - Quality assurance
  - Best practices check

### **architect-review**
- **When**: Making architectural decisions
- **Use for**:
  - Architecture validation
  - Design pattern review
  - Scalability considerations

---

## Psychology-First Development Agents

### **business-analyst**
- **When**: Validating learning science approaches
- **Use for**:
  - Analyzing learning effectiveness metrics
  - User engagement patterns
  - Feature impact analysis

### **ui-ux-designer**
- **When**: Implementing Soft Kawaii UI
- **Use for**:
  - Design system creation
  - Component design
  - User flow optimization
  - Accessibility

---

## Specialized Use Cases

### **mermaid-expert**
- **When**: Creating documentation diagrams
- **Use for**:
  - Architecture diagrams
  - Flowcharts for learning paths
  - Database ERD diagrams

### **api-documenter**
- **When**: Writing API documentation
- **Use for**:
  - OpenAPI documentation
  - API usage examples
  - Developer portal

### **tutorial-engineer**
- **When**: Creating onboarding content
- **Use for**:
  - User onboarding guides
  - Feature tutorials
  - Documentation

---

## Agent Invocation Patterns

### For Planning:
```
Use: backend-architect, database-architect, cloud-architect
Before implementing major features
```

### For Implementation:
```
Use: python-pro, frontend-developer, ai-engineer
During feature development
```

### For Quality:
```
Use: code-reviewer, security-auditor, test-automator
After feature completion, before merge
```

### For Optimization:
```
Use: performance-engineer, database-optimizer
When performance issues arise
```

### For Debugging:
```
Use: debugger, error-detective
When encountering errors or bugs
```

---

## How to Use Agents Effectively

### 1. **Before Starting a Phase**
- Use **architect-review** to validate approach
- Use **backend-architect** or **frontend-developer** for planning

### 2. **During Implementation**
- Use **python-pro** or **typescript-pro** for code quality
- Use **debugger** when stuck
- Use **ai-engineer** for LLM integration

### 3. **Before Completing a Phase**
- Use **code-reviewer** to review all changes
- Use **security-auditor** for security check
- Use **test-automator** to ensure test coverage

### 4. **When Making Decisions**
- Use **architect-review** for architecture decisions
- Use **database-architect** for schema decisions
- Use **ui-ux-designer** for design decisions

---

## Agent Priority by Phase

### Phase 0-1 (Setup):
1. **dx-optimizer** - Setup workflow
2. **backend-architect** - API design
3. **database-architect** - Schema design
4. **security-auditor** - Auth setup

### Phase 2-3 (Core Features):
1. **ai-engineer** - RAG & AI coach
2. **python-pro** - Backend logic
3. **frontend-developer** - UI components
4. **prompt-engineer** - LLM prompts

### Phase 4-6 (Features):
1. **ai-engineer** - Question generation
2. **python-pro** - Algorithms
3. **frontend-developer** - UI/UX
4. **ui-ux-designer** - Gamification design

### Phase 7-8 (Quality & Deploy):
1. **performance-engineer** - Optimization
2. **test-automator** - Testing
3. **security-auditor** - Security
4. **deployment-engineer** - CI/CD

---

## Tips

- **Use agents proactively** - Don't wait for problems
- **Chain agents** - Use multiple agents for complex tasks
- **Document decisions** - Agents help but you own the code
- **Review agent output** - Validate recommendations
- **Iterate** - Use agents multiple times as you refine

---

## Example Agent Usage Flow

### Implementing Authentication (Phase 1):

1. **backend-architect** - Design auth API endpoints
2. **security-auditor** - Review auth approach
3. **python-pro** - Implement JWT handling
4. **frontend-developer** - Build login UI
5. **test-automator** - Write auth tests
6. **code-reviewer** - Review before merge

### Building AI Coach (Phase 3):

1. **ai-engineer** - Design RAG + LLM pipeline
2. **prompt-engineer** - Create teaching prompts
3. **backend-architect** - Design WebSocket API
4. **python-pro** - Implement async handlers
5. **frontend-developer** - Build chat UI
6. **performance-engineer** - Optimize streaming
7. **code-reviewer** - Final review

---

**Remember**: Agents are tools to enhance your development. Use them strategically at each phase to maintain quality, security, and performance.

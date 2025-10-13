# Refactoring Quick Commands

**Quick reference for migration and testing**

---

## Git Workflow

### Commit New Structure
```bash
cd /Users/kyin/Projects/Studyin

# Add all new files
git add backend/app/constants.py
git add backend/app/schemas/
git add backend/app/core/security_utils.py
git add backend/app/core/__init__.py
git add backend/app/models/__init__.py

git add frontend/src/constants/
git add frontend/src/types/
git add frontend/src/lib/utils/
git add frontend/src/lib/api/index.ts
git add frontend/src/hooks/index.ts
git add frontend/src/components/*/index.ts

git add REFACTORING_PLAN.md MIGRATION_GUIDE.md REFACTORING_COMPLETE.md REFACTORING_COMMANDS.md

# Commit
git commit -m "feat: refactor - add centralized constants, types, and utilities

- Add backend constants module (app/constants.py)
- Add backend schemas package (app/schemas/)
- Add security utilities (app/core/security_utils.py)
- Add frontend constants (src/constants/index.ts)
- Add frontend types (src/types/index.ts)
- Add frontend utilities (src/lib/utils/index.ts)
- Add barrel exports across backend and frontend
- Add comprehensive migration documentation

No breaking changes - all new code is additive"
```

### View Changes
```bash
# See what was added
git status

# See file changes
git diff --stat

# See new files
git ls-files --others --exclude-standard
```

### Create Branch for Migration
```bash
# Create migration branch
git checkout -b refactor/module-organization

# Push to remote
git push -u origin refactor/module-organization
```

---

## Backend Testing

### Quick Test
```bash
cd /Users/kyin/Projects/Studyin/backend

# Test imports work
python -c "from app.constants import CSRF_COOKIE_NAME; print(CSRF_COOKIE_NAME)"
python -c "from app.schemas import UserPublic, MessageResponse; print('Schemas imported')"
python -c "from app.core import sanitize_prompt, validate_model_name; print('Security utils imported')"
```

### Full Test Suite
```bash
cd /Users/kyin/Projects/Studyin/backend

# Run all tests
pytest -v

# Run specific test file
pytest tests/test_auth.py -v

# Run with coverage
pytest --cov=app --cov-report=html
```

### Type Checking
```bash
cd /Users/kyin/Projects/Studyin/backend

# Check all files
mypy app/

# Check specific file
mypy app/api/auth.py
```

### Linting
```bash
cd /Users/kyin/Projects/Studyin/backend

# Run ruff (if installed)
ruff check app/

# Run black (if installed)
black --check app/
```

---

## Frontend Testing

### Quick Test
```bash
cd /Users/kyin/Projects/Studyin/frontend

# Test imports work
node -e "console.log('Testing constants import...'); require('./src/constants/index.ts')"

# Type check
npm run type-check
```

### Full Test Suite
```bash
cd /Users/kyin/Projects/Studyin/frontend

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Build Test
```bash
cd /Users/kyin/Projects/Studyin/frontend

# Build (catches import errors)
npm run build

# Build and serve
npm run preview
```

### Linting
```bash
cd /Users/kyin/Projects/Studyin/frontend

# Lint
npm run lint

# Lint and fix
npm run lint:fix
```

---

## Development Servers

### Backend
```bash
cd /Users/kyin/Projects/Studyin/backend

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run with logs
uvicorn app.main:app --reload --log-level debug
```

### Frontend
```bash
cd /Users/kyin/Projects/Studyin/frontend

# Run development server
npm run dev

# Run on specific port
npm run dev -- --port 3001
```

### Both (Parallel)
```bash
# In one terminal
cd /Users/kyin/Projects/Studyin/backend && uvicorn app.main:app --reload &

# In another terminal
cd /Users/kyin/Projects/Studyin/frontend && npm run dev
```

---

## Migration Commands

### Find Files to Update

#### Backend
```bash
cd /Users/kyin/Projects/Studyin/backend

# Find files using old constants
grep -r "CSRF_COOKIE_NAME = " app/ --include="*.py"

# Find files importing from old locations
grep -r "from app.middleware.csrf import" app/ --include="*.py"
grep -r "from app.services.codex_llm import _sanitize_prompt" app/ --include="*.py"

# Count magic strings
grep -rn "csrf_token" app/ --include="*.py" | wc -l
```

#### Frontend
```bash
cd /Users/kyin/Projects/Studyin/frontend

# Find files with magic values
grep -r "MAX_TOKEN_BUFFER = " src/ --include="*.ts" --include="*.tsx"
grep -r "const DEFAULT_WS_URL" src/ --include="*.ts" --include="*.tsx"

# Find files with inline type definitions
grep -r "export interface ChatMessage" src/ --include="*.ts" --include="*.tsx"
grep -r "export type ConnectionStatus" src/ --include="*.ts" --include="*.tsx"

# Count magic strings
grep -rn "'csrf_token'" src/ --include="*.ts" --include="*.tsx" | wc -l
```

### Batch Update Imports

#### Backend (Example)
```bash
cd /Users/kyin/Projects/Studyin/backend

# Replace imports in multiple files (use with caution!)
# Dry run first:
grep -l "from app.middleware.csrf import CSRF_COOKIE_NAME" app/**/*.py

# Then replace:
find app/ -name "*.py" -exec sed -i '' 's/from app.middleware.csrf import CSRF_COOKIE_NAME/from app.constants import CSRF_COOKIE_NAME/g' {} +
```

#### Frontend (Example)
```bash
cd /Users/kyin/Projects/Studyin/frontend

# Replace imports (use with caution!)
# Dry run first:
grep -l "from '@/hooks/useChatSession'" src/**/*.{ts,tsx}

# Then replace:
find src/ -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s|from '@/hooks/useChatSession'|from '@/hooks'|g"
```

---

## Verification Commands

### Backend

#### Check Constants
```bash
cd /Users/kyin/Projects/Studyin/backend

# List all constants
python -c "import app.constants; print([x for x in dir(app.constants) if not x.startswith('_')])"

# Verify no duplicates
grep -r "CSRF_COOKIE_NAME = " app/ --include="*.py"
# Should only find in constants.py
```

#### Check Schemas
```bash
cd /Users/kyin/Projects/Studyin/backend

# List all schemas
python -c "from app.schemas import *; import app.schemas; print(app.schemas.__all__)"

# Check schema usage
grep -r "UserPublic" app/ --include="*.py"
```

#### Check Security Utils
```bash
cd /Users/kyin/Projects/Studyin/backend

# Verify functions moved
grep -r "def sanitize_prompt" app/ --include="*.py"
# Should only find in security_utils.py

grep -r "def validate_model_name" app/ --include="*.py"
# Should only find in security_utils.py
```

### Frontend

#### Check Constants
```bash
cd /Users/kyin/Projects/Studyin/frontend

# List all constants
grep "^export const" src/constants/index.ts

# Verify no duplicates
grep -r "MAX_TOKEN_BUFFER" src/ --include="*.ts" --include="*.tsx"
# Should only find in constants/index.ts and usage sites
```

#### Check Types
```bash
cd /Users/kyin/Projects/Studyin/frontend

# List all types
grep "^export \(interface\|type\)" src/types/index.ts

# Verify no duplicate definitions
grep -r "export interface ChatMessage" src/ --include="*.ts" --include="*.tsx"
# Should only find in types/index.ts
```

#### Check Utilities
```bash
cd /Users/kyin/Projects/Studyin/frontend

# List all utilities
grep "^export function" src/lib/utils/index.ts

# Verify no duplicates
grep -r "function generateId" src/ --include="*.ts" --include="*.tsx"
# Should only find in utils/index.ts
```

---

## Rollback Commands

### Undo Last Commit
```bash
# Soft reset (keep changes)
git reset --soft HEAD~1

# Hard reset (discard changes)
git reset --hard HEAD~1
```

### Revert Specific Commit
```bash
# Find commit hash
git log --oneline

# Revert it
git revert <commit-hash>
```

### Stash Changes
```bash
# Stash current work
git stash save "WIP: refactoring migration"

# List stashes
git stash list

# Apply stash
git stash apply
```

---

## Debugging

### Import Errors

#### Backend
```bash
cd /Users/kyin/Projects/Studyin/backend

# Check Python path
python -c "import sys; print('\n'.join(sys.path))"

# Check if module can be imported
python -c "import app.constants"

# Check for circular imports
python -c "from app.api import auth"
```

#### Frontend
```bash
cd /Users/kyin/Projects/Studyin/frontend

# Check TypeScript compilation
npx tsc --noEmit

# Check specific import
node -e "import('./src/constants/index.ts').then(console.log)"

# Check module resolution
npx tsc --traceResolution | grep constants
```

### Runtime Errors

#### Backend
```bash
cd /Users/kyin/Projects/Studyin/backend

# Run with debug logging
LOG_LEVEL=DEBUG uvicorn app.main:app --reload

# Check for syntax errors
python -m py_compile app/**/*.py

# Interactive debugging
python -m pdb app/main.py
```

#### Frontend
```bash
cd /Users/kyin/Projects/Studyin/frontend

# Run with verbose output
npm run dev -- --debug

# Check bundle analysis
npm run build -- --analyze

# Check for unused exports
npx ts-prune
```

---

## Performance Checks

### Bundle Size (Frontend)
```bash
cd /Users/kyin/Projects/Studyin/frontend

# Analyze bundle
npm run build
du -sh dist/*

# Check for large dependencies
npx webpack-bundle-analyzer dist/stats.json
```

### Import Speed (Backend)
```bash
cd /Users/kyin/Projects/Studyin/backend

# Time imports
time python -c "from app.constants import *"
time python -c "from app.schemas import *"
time python -c "from app.core import *"
```

---

## Cleanup Commands

### Remove Old Files (After Migration)
```bash
# DON'T RUN YET - wait until migration is complete!

# Remove old duplicate definitions (examples)
# git rm app/api/auth.py.backup
# git rm frontend/src/hooks/useChatSession.ts.backup
```

### Remove __pycache__
```bash
cd /Users/kyin/Projects/Studyin/backend
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type f -name "*.pyc" -delete
```

### Remove node_modules (if needed)
```bash
cd /Users/kyin/Projects/Studyin/frontend
rm -rf node_modules
npm install
```

---

## Quick Reference

### Most Common Commands

```bash
# Start development
cd /Users/kyin/Projects/Studyin/backend && uvicorn app.main:app --reload
cd /Users/kyin/Projects/Studyin/frontend && npm run dev

# Run tests
cd /Users/kyin/Projects/Studyin/backend && pytest -v
cd /Users/kyin/Projects/Studyin/frontend && npm test

# Type check
cd /Users/kyin/Projects/Studyin/backend && mypy app/
cd /Users/kyin/Projects/Studyin/frontend && npm run type-check

# Commit changes
git add .
git commit -m "refactor: migrate X to use new structure"
git push
```

---

**Pro Tip**: Create shell aliases for common commands:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias studyin-be="cd /Users/kyin/Projects/Studyin/backend"
alias studyin-fe="cd /Users/kyin/Projects/Studyin/frontend"
alias studyin-test="cd /Users/kyin/Projects/Studyin && (cd backend && pytest -v) && (cd frontend && npm test)"
```

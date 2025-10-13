.PHONY: help start stop restart logs clean test reset db-migrate dev-backend dev-frontend chat

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Studyin Development Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Quick Start:$(NC) make start"
	@echo "$(YELLOW)Most Used:$(NC)  make dev, make logs, make restart"

# Development workflow
start: ## Start all services (Postgres, Redis, Backend, Frontend)
	@echo "$(BLUE)Starting all services...$(NC)"
	@./START_SERVERS.sh

stop: ## Stop all services
	@echo "$(RED)Stopping all services...$(NC)"
	@-kill $$(lsof -ti:8000) 2>/dev/null && echo "$(GREEN)✓ Backend stopped$(NC)" || echo "$(YELLOW)Backend not running$(NC)"
	@-kill $$(lsof -ti:5173) 2>/dev/null && echo "$(GREEN)✓ Frontend stopped$(NC)" || echo "$(YELLOW)Frontend not running$(NC)"
	@-kill $$(lsof -ti:8801) 2>/dev/null && echo "$(GREEN)✓ ChatMock stopped$(NC)" || echo "$(YELLOW)ChatMock not running$(NC)"
	@brew services stop postgresql@16 2>/dev/null || true
	@brew services stop redis 2>/dev/null || true
	@echo "$(GREEN)Done!$(NC)"

restart: stop start ## Restart all services

dev: ## Start development mode with logs in foreground
	@echo "$(BLUE)Starting development mode...$(NC)"
	@trap 'make stop' INT; make start && make logs

# Individual services
dev-backend: ## Start only backend (assumes DB/Redis running)
	@echo "$(BLUE)Starting backend...$(NC)"
	@cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000

dev-frontend: ## Start only frontend
	@echo "$(BLUE)Starting frontend...$(NC)"
	@cd frontend && npm run dev

# Logs
logs: ## Tail all logs (Ctrl+C to stop)
	@echo "$(BLUE)Showing logs (Ctrl+C to stop)...$(NC)"
	@tail -f /tmp/studyin-backend.log /tmp/studyin-frontend.log

logs-backend: ## Tail backend logs only
	@tail -f /tmp/studyin-backend.log

logs-frontend: ## Tail frontend logs only
	@tail -f /tmp/studyin-frontend.log

# Database operations
db-migrate: ## Run database migrations
	@echo "$(BLUE)Running migrations...$(NC)"
	@cd backend && source venv/bin/activate && alembic upgrade head
	@echo "$(GREEN)✓ Migrations complete$(NC)"

db-rollback: ## Rollback last migration
	@echo "$(YELLOW)Rolling back last migration...$(NC)"
	@cd backend && source venv/bin/activate && alembic downgrade -1

db-rev: ## Create new Alembic revision with autogenerate. Usage: make db-rev MSG="add table"
	@cd backend && source venv/bin/activate && alembic revision --autogenerate -m "$(MSG)"

db-up: ## Upgrade to latest head
	@cd backend && source venv/bin/activate && alembic upgrade head

db-down: ## Downgrade one revision
	@cd backend && source venv/bin/activate && alembic downgrade -1

db-stamp: ## Stamp current DB as head without applying migrations
	@cd backend && source venv/bin/activate && alembic stamp head

db-reset: ## Reset database (WARNING: deletes all data)
	@echo "$(RED)WARNING: This will delete ALL data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		make stop; \
		brew services start postgresql@16; \
		sleep 2; \
		dropdb studyin_dev --if-exists; \
		createdb studyin_dev; \
		make db-migrate; \
		echo "$(GREEN)✓ Database reset complete$(NC)"; \
	fi

# Testing
test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	@make test-backend
	@make test-frontend

test-backend: ## Run backend tests with coverage
	@echo "$(BLUE)Running backend tests...$(NC)"
	@cd backend && source venv/bin/activate && pytest --cov=app --cov-report=term-missing

test-frontend: ## Run frontend tests
	@echo "$(BLUE)Running frontend tests...$(NC)"
	@cd frontend && npm test

test-watch: ## Run frontend tests in watch mode
	@cd frontend && npm run test -- --watch

# Cleanup
clean: ## Clean build artifacts and caches
	@echo "$(BLUE)Cleaning...$(NC)"
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@rm -rf backend/.pytest_cache 2>/dev/null || true
	@rm -rf frontend/node_modules/.vite 2>/dev/null || true
	@rm -f /tmp/studyin-*.log 2>/dev/null || true
	@echo "$(GREEN)✓ Cleaned$(NC)"

reset: clean stop ## Full reset (clean + stop services)
	@echo "$(GREEN)✓ Full reset complete$(NC)"

# Quick utilities
chat: ## Open a quick test WebSocket chat connection
	@echo "$(BLUE)Testing WebSocket connection...$(NC)"
	@curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Host: localhost:8000" http://localhost:8000/ws/chat || echo "$(RED)WebSocket not available$(NC)"

status: ## Show service status
	@echo "$(BLUE)Service Status:$(NC)"
	@echo ""
	@lsof -ti:8000 > /dev/null 2>&1 && echo "  Backend:  $(GREEN)✓ Running on :8000$(NC)" || echo "  Backend:  $(RED)✗ Not running$(NC)"
	@lsof -ti:5173 > /dev/null 2>&1 && echo "  Frontend: $(GREEN)✓ Running on :5173$(NC)" || echo "  Frontend: $(RED)✗ Not running$(NC)"
	@lsof -ti:8801 > /dev/null 2>&1 && echo "  ChatMock: $(GREEN)✓ Running on :8801$(NC)" || echo "  ChatMock: $(YELLOW)⚠ Not running$(NC)"
	@redis-cli ping > /dev/null 2>&1 && echo "  Redis:    $(GREEN)✓ Running$(NC)" || echo "  Redis:    $(RED)✗ Not running$(NC)"
	@psql -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw studyin_dev && echo "  Postgres: $(GREEN)✓ Running (studyin_dev exists)$(NC)" || echo "  Postgres: $(YELLOW)⚠ Database not found$(NC)"
	@echo ""
	@echo "$(BLUE)Logs:$(NC)"
	@echo "  Backend:  tail -f /tmp/studyin-backend.log"
	@echo "  Frontend: tail -f /tmp/studyin-frontend.log"
	@echo "  ChatMock: tail -f $$HOME/.chatmock_server.log"

# Installation helpers
install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
	@cd frontend && npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

seed-minimal: ## Seed demo user, sample material, and (optionally) embeddings
	@echo "$(BLUE)Seeding minimal dataset...$(NC)"
	@cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && python scripts/seed_minimal.py
	@echo "$(GREEN)✓ Seed complete$(NC)"

ingest: ## Ingest a PDF: make ingest FILE=path/to/file.pdf [OCR=1]
	@if [ -z "$(FILE)" ]; then echo "Usage: make ingest FILE=/path/to/file.pdf [OCR=1]"; exit 1; fi
	@echo "$(BLUE)Ingesting $(FILE)...$(NC)"
	@cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && \
		python scripts/ingest_pdf.py "$(FILE)" $(if $(OCR),--enable-ocr,)
	@echo "$(GREEN)✓ Ingest complete$(NC)"

update: ## Update all dependencies
	@echo "$(BLUE)Updating dependencies...$(NC)"
	@cd backend && source venv/bin/activate && pip install --upgrade -r requirements.txt
	@cd frontend && npm update
	@echo "$(GREEN)✓ Dependencies updated$(NC)"

# Quick access URLs
urls: ## Show all service URLs
	@echo "$(BLUE)Service URLs:$(NC)"
	@echo "  Frontend:  http://localhost:5173"
	@echo "  Backend:   http://localhost:8000"
	@echo "  API Docs:  http://localhost:8000/docs"
	@echo "  ChatMock:  http://127.0.0.1:8801/v1"
	@echo "  Health:    http://localhost:8000/health/live"

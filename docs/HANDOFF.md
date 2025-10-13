# StudyIn – Engineering Handoff (2025-10-13)

This document summarizes the current state of the system, how to operate it locally, and how new engineers can get productive quickly. No placeholders are used; values are either real or left blank for local configuration.

## Overview

- Chat runtime: ChatMock (local), OpenAI-compatible chat API at `http://127.0.0.1:8801/v1`.
- Embeddings: Gemini text embeddings `gemini-embedding-001`, 1536‑dim, cosine, L2‑normalized.
- RAG vector store: Chroma (collection `material_chunks_1536`).
- OCR: PyMuPDF for native text; optional Tesseract OCR on low‑text pages.
- Reasoning levels: choose per request via model id (`gpt-5-minimal|low|medium|high`).

## Dev Environment

- macOS (Apple Silicon). Verified on M2 Max (12 cores, 96 GB RAM).
- Node 20+, Python 3.10+ (project venv), Homebrew.

### Ports
- Frontend (Vite): `5173`
- Backend (FastAPI/uvicorn): `8000`
- ChatMock (local OpenAI API): `8801`

## One‑Command Start

```
./START_SERVERS.sh
```

Starts: ChatMock → Backend (venv) → Frontend. Prints URLs and log paths.

### Individual Services
- Backend: `./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload`
- Frontend: `npm run dev` (in `frontend/`)
- ChatMock: `chatmock serve --host 127.0.0.1 --port 8801 --reasoning-effort high --reasoning-compat o3 --reasoning-summary none --expose-reasoning-models --enable-web-search`

## Configuration

Edit `backend/.env` (local only, do not commit secrets):

```
LLM_PROVIDER=openai_chatmock
OPENAI_BASE_URL=http://127.0.0.1:8801/v1
OPENAI_API_KEY=x

GEMINI_API_KEY=
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_EMBEDDING_DIM=1536

DATABASE_URL=postgresql+asyncpg://studyin_user:changeme@localhost:5432/studyin_dev
```

For the frontend, `VITE_API_URL` is intentionally empty in `.env.local` so the Vite dev proxy handles `/api` to the backend.

### WebSocket (Chat) behavior
- We intentionally disable auto‑connect/reconnect to avoid background reconnect noise.
- When you open the Chat view, click “Reconnect” to open the socket on demand.
- If the backend restarts, click “Reconnect” again to resume.

## Ingest Pipeline (PDF → Chroma)

Tool: `backend/scripts/ingest_pdf.py`

```
make ingest FILE="/absolute/path/to/lecture.pdf" OCR=1
```

- Extracts page text via PyMuPDF.
- Low‑text rule: if PyMuPDF text < 40 characters and `OCR=1`, render page at ~300 DPI and run Tesseract (`--oem 1 --psm 6 -l eng+equ`).
- Chunks per page (≈ ≤ 1200 chars), embeds with 1536‑dim Gemini embeddings, stores in Chroma collection `material_chunks_1536`.

Notes:
- Tesseract install (macOS): `brew install tesseract`.
- If a lecture is mostly images, enable `OCR=1`. We can add tunable flags later (`--ocr-threshold-chars`, `--ocr-dpi`, `--ocr-psm`).

## Chat Usage (Reasoning Levels)

The app sends `effort` from a UI dropdown. Backend maps it to model ids:

- `minimal` → `gpt-5-minimal`
- `low`     → `gpt-5-low`
- `medium`  → `gpt-5-medium`
- `high`    → `gpt-5-high`

No server restart is required. Default `gpt-5` follows the server’s `--reasoning-effort`.

## Database Migrations (Alembic CLI)

- Migrations live under `backend/migrations`.
- Run from `backend/` directory (Makefile wraps commands):
  - Create migration: `make db-rev MSG="add table/column"`
  - Upgrade to latest: `make db-up`
  - Downgrade one: `make db-down`
  - Stamp current DB to head: `make db-stamp`

## Troubleshooting

- 30s Axios timeout / Dashboard errors:
  - Ensure backend is running from the venv: `./START_SERVERS.sh` or manual uvicorn command above.
- WebSocket “connection restored” toasts on Dashboard:
  - We disabled auto‑connect/reconnect; socket opens only on Chat view. Use the “Reconnect” button there.
- “google‑genai not found” on backend startup:
  - The backend start script now installs deps and runs uvicorn from venv.
- “expected dimension 768, got 1536” in Chroma:
  - We write to `material_chunks_1536`. If you switch `GEMINI_EMBEDDING_DIM`, re‑ingest.

## Agent – Docs Architect

- Spec: `agents/docs-architect.yaml`
- Model: ChatMock `gpt-5-high` (`http://127.0.0.1:8801/v1`, key `x`).
- Scope: maintains `README.md`, `docs/HANDOFF.md`, `docs/OPERATIONS.md` in sync with code.

Usage idea (local): open the YAML in your agent runner or MCP client, point it at the repo root, and run the `refresh-handoff`, `ops-guide`, or `readme-sync` tasks. The model is ChatMock via `base_url` and `api_key: x`.

## Next Steps

- Optional OCR tunables (`--ocr-threshold-chars`, `--ocr-dpi`, `--ocr-psm`) and “only if page has images”.
- Rename `backend/alembic` → `backend/migrations` + update `alembic.ini` to restore Alembic CLI usage (today we create tables via code in dev).
- Image search (phase‑2): add a second Chroma collection using Vertex `multimodalembedding@001` for radiology/anatomy image ↔ text retrieval.

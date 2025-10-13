# Operations Guide

## Start / Stop / Status

- Start all (ChatMock, backend, frontend):
  - `./START_SERVERS.sh`
- Stop all:
  - `make stop`
- Status + URLs:
  - `make status` and `make urls`

## Logs
- Backend: `/tmp/studyin-backend.log`
- Frontend: `/tmp/studyin-frontend.log`
- ChatMock: `~/.chatmock_server.log`

## Health
- Backend: `GET http://127.0.0.1:8000/health/live` → `{ "status": "alive" }`
- ChatMock: `GET http://127.0.0.1:8801/v1/models`

## Ingest
- OCR installed (macOS): `brew install tesseract`
- Ingest PDF: `make ingest FILE="/abs/path/to/file.pdf" OCR=1`

## Reasoning Levels (per request)
- Map UI dropdown to:
  - minimal → `gpt-5-minimal`
  - low → `gpt-5-low`
  - medium → `gpt-5-medium`
  - high → `gpt-5-high`

## Troubleshooting
- 30s Axios timeout: verify backend venv server is running (`make start`, then `/health/live`).
- WS errors on Dashboard: socket is manual now; click Reconnect on Chat.
- Embeddings import errors: `./START_SERVERS.sh` ensures venv deps; backend must run from venv.

## Migrations 101 (Alembic)

- Create a migration from model changes:
  - `make db-rev MSG="add materials table column"`
- Apply latest migrations:
  - `make db-up`
- Roll back one revision:
  - `make db-down`
- Stamp current DB to head (baseline an existing DB):
  - `make db-stamp`

Notes:
- Scripts live at `backend/migrations`. The `alembic.ini` is configured for running commands from the `backend/` directory.

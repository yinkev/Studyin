#!/bin/bash
# StudyIn Dev Server Stop Script
# Gracefully stop backend (Uvicorn), frontend (Vite), and ChatMock by port.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-5173}
CHATMOCK_PORT=${CHATMOCK_PORT:-8801}

echo "================================="
echo "Stopping StudyIn Dev Servers"
echo "================================="
echo "Using ports: backend=$BACKEND_PORT, frontend=$FRONTEND_PORT, chatmock=$CHATMOCK_PORT"

kill_port() {
  local port="$1"; local name="$2"; local attempt=0;
  if lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo -e "${YELLOW}• Stopping $name on :$port${NC}"
    # Collect unique PIDs listening on the port
    pids=$(lsof -tiTCP:"$port" -sTCP:LISTEN | sort -u | xargs)
    # Shell no-op if empty
    if [ -n "${pids:-}" ]; then
      kill $pids 2>/dev/null || true
      # Wait up to ~2s
      for attempt in 1 2 3 4; do
        sleep 0.5
        if ! lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
          break
        fi
      done
      # Force kill if still around
      if lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
        echo -e "${YELLOW}  ↪ Force killing remaining $name processes${NC}"
        pkill -9 -P $(lsof -tiTCP:"$port" -sTCP:LISTEN) 2>/dev/null || true
        kill -9 $(lsof -tiTCP:"$port" -sTCP:LISTEN) 2>/dev/null || true
      fi
    fi
  else
    echo -e "${GREEN}• $name not running on :$port${NC}"
  fi
}

# Stop servers by port
kill_port "$BACKEND_PORT"  "Backend (Uvicorn)"
kill_port "$FRONTEND_PORT" "Frontend (Vite)"
kill_port "$CHATMOCK_PORT" "ChatMock"

echo ""
echo "Verification (listeners):"
for p in "$BACKEND_PORT" "$FRONTEND_PORT" "$CHATMOCK_PORT"; do
  if lsof -tiTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then
    echo -e "${RED}  • Port $p still in use${NC}"
    lsof -iTCP:"$p" -sTCP:LISTEN -Pn || true
  else
    echo -e "${GREEN}  • Port $p is free${NC}"
  fi
done

echo ""
echo -e "${GREEN}✓ All done${NC}"


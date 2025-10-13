#!/bin/bash
# StudyIn Development Server Startup Script
# This script starts both backend and frontend servers

set -e

echo "================================="
echo "StudyIn Development Server Startup"
echo "================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ChatMock configuration (local OpenAI-compatible API)
# You can override these via env before running this script, e.g.:
#   CHATMOCK_PORT=8802 CHATMOCK_REASONING=low ./START_SERVERS.sh
CHATMOCK_PORT=${CHATMOCK_PORT:-8801}
CHATMOCK_HOST=${CHATMOCK_HOST:-127.0.0.1}
CHATMOCK_REASONING=${CHATMOCK_REASONING:-low}  # Default to 'low' for faster responses
CHATMOCK_LOG=${CHATMOCK_LOG:-$HOME/.chatmock_server.log}
CHATMOCK_FLAGS=(
  --host "$CHATMOCK_HOST"
  --port "$CHATMOCK_PORT"
  --reasoning-effort "$CHATMOCK_REASONING"
  --reasoning-compat o3
  --reasoning-summary none
  --expose-reasoning-models
  --enable-web-search
)

# Check if PostgreSQL is running
echo "Checking PostgreSQL..."
if lsof -ti:5432 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}✗ PostgreSQL is not running${NC}"
    echo "Starting PostgreSQL..."
    brew services start postgresql@16
    sleep 2
fi

# Check if Redis is running
echo "Checking Redis..."
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "${RED}✗ Redis is not running${NC}"
    echo "Starting Redis..."
    brew services start redis
    sleep 2
fi

# Check if backend is already running
if lsof -ti:8000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Backend server is already running on port 8000${NC}"
    read -p "Kill existing backend and restart? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $(lsof -ti:8000)
        sleep 1
    else
        echo "Keeping existing backend server"
    fi
fi

# Check if frontend is already running
if lsof -ti:5173 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Frontend server is already running on port 5173${NC}"
    read -p "Kill existing frontend and restart? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $(lsof -ti:5173)
        sleep 1
    else
        echo "Keeping existing frontend server"
    fi
fi

# Start ChatMock (local OpenAI-compatible API) if installed and not running
if [ "${CHATMOCK_DISABLE:-0}" = "1" ]; then
    echo -e "${YELLOW}⚠ Skipping ChatMock startup (CHATMOCK_DISABLE=1)${NC}"
else
    echo "Checking ChatMock..."
    if command -v chatmock >/dev/null 2>&1; then
        if lsof -ti:$CHATMOCK_PORT > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠ ChatMock already running on port $CHATMOCK_PORT${NC}"
        else
            echo "Starting ChatMock on $CHATMOCK_HOST:$CHATMOCK_PORT..."
            nohup chatmock serve "${CHATMOCK_FLAGS[@]}" > "$CHATMOCK_LOG" 2>&1 &
            CHATMOCK_PID=$!
            echo -e "${GREEN}✓ ChatMock starting (PID: $CHATMOCK_PID)${NC}"
            echo "  Logs: tail -f $CHATMOCK_LOG"
            # Verify
            for i in {1..20}; do
              if curl -sSf "http://$CHATMOCK_HOST:$CHATMOCK_PORT/v1/models" >/dev/null 2>&1; then
                echo -e "${GREEN}✓ ChatMock is responding${NC}"
                break
              fi
              sleep 0.3
            done
        fi
    else
        echo -e "${YELLOW}⚠ ChatMock CLI not found. Install with:${NC} brew tap RayBytes/chatmock && brew install chatmock"
    fi
fi

# Start backend server (ensure venv + deps; run with venv's uvicorn)
if ! lsof -ti:8000 > /dev/null 2>&1; then
    echo ""
    echo "Starting backend server..."
    cd /Users/kyin/Projects/Studyin/backend
    if [ ! -d venv ]; then
      python -m venv venv
    fi
    source venv/bin/activate
    pip -q install --upgrade pip >/dev/null 2>&1 || true
    pip -q install -r requirements.txt >/dev/null 2>&1 || true
    nohup ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > /tmp/studyin-backend.log 2>&1 &
    BACKEND_PID=$!
    echo -e "${GREEN}✓ Backend server starting (PID: $BACKEND_PID)${NC}"
    echo "  Logs: tail -f /tmp/studyin-backend.log"
    sleep 3

    # Verify backend started
    if curl -s http://localhost:8000/health/live > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend server is responding${NC}"
    else
        echo -e "${RED}✗ Backend server failed to start. Check logs: tail -f /tmp/studyin-backend.log${NC}"
    fi
fi

# Start frontend server
if ! lsof -ti:5173 > /dev/null 2>&1; then
    echo ""
    echo "Starting frontend server..."
    cd /Users/kyin/Projects/Studyin/frontend
    nohup npm run dev > /tmp/studyin-frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo -e "${GREEN}✓ Frontend server starting (PID: $FRONTEND_PID)${NC}"
    echo "  Logs: tail -f /tmp/studyin-frontend.log"
    sleep 3

    # Verify frontend started
    if lsof -ti:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend server is running${NC}"
    else
        echo -e "${RED}✗ Frontend server failed to start. Check logs: tail -f /tmp/studyin-frontend.log${NC}"
    fi
fi

if [ "${SEED_MINIMAL:-0}" = "1" ]; then
    echo "Seeding minimal dataset (SEED_MINIMAL=1)..."
    (cd /Users/kyin/Projects/Studyin && make seed-minimal) || echo -e "${YELLOW}⚠ Seed step failed (continuing). Check deps and GEMINI_API_KEY.${NC}"
fi

echo ""
echo "================================="
echo "Server Status"
echo "================================="
echo ""
echo -e "Backend:  ${GREEN}http://localhost:8000${NC}"
echo -e "Frontend: ${GREEN}http://localhost:5173${NC}"
if lsof -ti:$CHATMOCK_PORT > /dev/null 2>&1; then
  echo -e "ChatMock: ${GREEN}http://$CHATMOCK_HOST:$CHATMOCK_PORT/v1${NC}"
fi
echo -e "API Docs: ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo "Logs:"
echo "  Backend:  tail -f /tmp/studyin-backend.log"
echo "  Frontend: tail -f /tmp/studyin-frontend.log"
echo "  ChatMock: tail -f $CHATMOCK_LOG"
echo ""
echo "To stop servers:"
echo "  kill \$(lsof -ti:8000)  # Stop backend"
echo "  kill \$(lsof -ti:5173)  # Stop frontend"
echo "  kill \$(lsof -ti:$CHATMOCK_PORT)  # Stop ChatMock"
echo ""
echo -e "${GREEN}✓ All servers started successfully!${NC}"

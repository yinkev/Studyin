#!/bin/bash

# WebSocket Connection Test Script
# Tests that the WebSocket URL is correctly configured

echo "🔍 Testing WebSocket Configuration Fix"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd /Users/kyin/Projects/Studyin/frontend

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local not found${NC}"
    exit 1
fi

# Check VITE_WS_URL value
WS_URL=$(grep "^VITE_WS_URL=" .env.local | cut -d '=' -f2)

echo "📋 Configuration Check:"
echo "----------------------"
echo "VITE_WS_URL: $WS_URL"
echo ""

# Validate WebSocket URL
if [[ "$WS_URL" == "ws://localhost:8000/api/chat/ws" ]]; then
    echo -e "${GREEN}✅ WebSocket URL is correct!${NC}"
    echo ""
elif [[ "$WS_URL" == "/api/chat/ws" ]] || [[ "$WS_URL" =~ ^/ ]]; then
    echo -e "${RED}❌ WebSocket URL is relative - this will cause connection errors${NC}"
    echo "   Expected: ws://localhost:8000/api/chat/ws"
    echo "   Got:      $WS_URL"
    echo ""
    exit 1
elif [[ "$WS_URL" == "ws://localhost:5173/"* ]]; then
    echo -e "${RED}❌ WebSocket URL points to frontend port (5173) instead of backend (8000)${NC}"
    echo "   Expected: ws://localhost:8000/api/chat/ws"
    echo "   Got:      $WS_URL"
    echo ""
    exit 1
else
    echo -e "${YELLOW}⚠️  WebSocket URL format is unusual${NC}"
    echo "   Expected: ws://localhost:8000/api/chat/ws"
    echo "   Got:      $WS_URL"
    echo ""
fi

# Check if backend is running
echo "🔌 Backend Status Check:"
echo "------------------------"
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on port 8000${NC}"
else
    echo -e "${YELLOW}⚠️  Backend is not responding on port 8000${NC}"
    echo "   To start backend:"
    echo "   cd /Users/kyin/Projects/Studyin/backend"
    echo "   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
fi
echo ""

# Check if frontend needs restart
echo "🔄 Frontend Dev Server:"
echo "------------------------"
if pgrep -f "vite" > /dev/null; then
    echo -e "${YELLOW}⚠️  Vite dev server is running${NC}"
    echo "   ${YELLOW}You MUST restart it to load the new .env.local values!${NC}"
    echo ""
    echo "   Steps to restart:"
    echo "   1. Press Ctrl+C in the terminal running 'npm run dev'"
    echo "   2. Run: npm run dev"
    echo "   3. Open browser to http://localhost:5173"
    echo ""
else
    echo -e "${GREEN}✅ Ready to start frontend${NC}"
    echo "   Run: npm run dev"
    echo ""
fi

echo "📝 Manual Testing Steps:"
echo "------------------------"
echo "1. Restart frontend dev server (see above)"
echo "2. Open http://localhost:5173 in browser"
echo "3. Open DevTools (F12) → Console tab"
echo "4. Look for these logs:"
echo "   ${GREEN}✅ [WS] Creating new WebSocket connection { wsUrl: 'ws://localhost:8000/api/chat/ws' }${NC}"
echo "   ${GREEN}✅ [WS] onopen fired${NC}"
echo "   ${GREEN}✅ Connected to the AI coach.${NC}"
echo ""
echo "5. Try sending a message in the AI Coach"
echo ""

echo -e "${GREEN}✨ Configuration fix complete!${NC}"

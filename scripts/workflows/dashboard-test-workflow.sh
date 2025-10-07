#!/bin/bash
# Dashboard Testing Workflow with Codex + Gemini MCP
# Following OpenAI Codex MCP Agents SDK cookbook pattern
# Uses gemini-2.5-flash-preview-09-2025 model via MCP

set -e

PROJECT_ROOT="/Users/kyin/Projects/Studyin"
cd "$PROJECT_ROOT"

echo "=== Dashboard Testing Workflow with Codex + Gemini ==="
echo ""

# Step 1: Take screenshot of dashboard
echo "Step 1: Taking dashboard screenshot..."
npx playwright test -c playwright.config.js --headed --project=chromium \
  -g "route renders: /dashboard" || true

# Find the latest screenshot
SCREENSHOT=$(find test-results -name "*dashboard*.png" 2>/dev/null | head -1)

if [ -z "$SCREENSHOT" ]; then
  echo "No screenshot found, creating one..."
  mkdir -p test-results/screenshots
  SCREENSHOT="test-results/screenshots/dashboard-$(date +%Y%m%d_%H%M%S).png"

  # Use Playwright to capture screenshot
  npx playwright codegen http://localhost:3005/dashboard \
    --save-screenshot="$SCREENSHOT" --timeout=5000 || true
fi

echo "Screenshot: $SCREENSHOT"
echo ""

# Step 2: Analyze dashboard with Gemini via MCP
echo "Step 2: Analyzing dashboard with Gemini (via MCP)..."
echo ""

codex -c model="gpt-5-pro" \
  --mcp gemini-workflow \
  "Use the analyze_dashboard tool to perform a full analysis of the dashboard at: $SCREENSHOT"

echo ""
echo "=== Analysis Complete ==="
echo ""

# Step 3: Generate test cases with Gemini
echo "Step 3: Generating Playwright test cases..."
echo ""

codex -c model="gpt-5-pro" \
  --mcp gemini-workflow \
  "Use the generate_test tool to create a Playwright test for:
  Route: /dashboard
  Description: Test that the dashboard loads, displays XP progress bar, shows daily quests, and has a working 'Start Studying' button"

echo ""
echo "=== Test Generation Complete ==="
echo ""

# Step 4: Review the generated test
echo "Step 4: Reviewing dashboard component code..."
echo ""

codex -c model="gpt-5-pro" \
  --mcp gemini-workflow \
  "Use the review_code tool to review the file: app/dashboard/page.tsx
  Focus: all"

echo ""
echo "=== Code Review Complete ==="
echo ""

# Step 5: Suggest gamification improvements
echo "Step 5: Analyzing gamification features..."
echo ""

FEATURES="Current features:
- XP and Level system with progress bar
- Streak tracking with fire badge
- Daily quests (3 missions)
- Weekly quests (3 challenges)
- Achievements system (6 achievements)
- Recent activity tracking
- Stats cards (accuracy, questions correct, study time)
"

codex -c model="gpt-5-pro" \
  --mcp gemini-workflow \
  "Use the improve_gamification tool with current_features: '$FEATURES'"

echo ""
echo "=== Gamification Analysis Complete ==="
echo ""
echo "✅ Workflow finished successfully!"
echo ""
echo "This workflow demonstrates:"
echo "1. Screenshot capture with Playwright"
echo "2. AI-powered UI analysis with Gemini vision"
echo "3. Automated test generation"
echo "4. Code review with AI"
echo "5. Gamification improvement suggestions"
echo ""
echo "All powered by Codex + Gemini MCP Server"

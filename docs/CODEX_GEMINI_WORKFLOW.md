# Codex + Gemini MCP Workflow

Complete setup for building consistent workflows using Codex CLI with Gemini AI, following the [OpenAI Codex MCP Agents SDK cookbook](https://cookbook.openai.com/examples/codex/codex_mcp_agents_sdk/building_consistent_workflows_codex_cli_agents_sdk) pattern.

## 📦 What's Installed

### 1. **Codex CLI** (v0.44.0)
- Main orchestrator for AI workflows
- MCP server management
- Model: `gpt-5-pro` (configured as default)

### 2. **Gemini CLI** (v0.9.0)
- Direct Gemini API access
- Model: `gemini-2.5-flash-preview-09-2025`

### 3. **Gemini Workflow MCP Server** (Custom)
- Location: `scripts/mcp/gemini-workflow-server.js`
- Uses `gemini-2.5-flash-preview-09-2025` model
- 4 custom tools for dashboard workflows

### 4. **Playwright MCP Server**
- Package: `@executeautomation/playwright-mcp-server`
- Browser automation and testing

## 🔧 Configuration

### Environment Variables (`.env.local`)
```bash
GEMINI_API_KEY=AIzaSyBQWouan59P7rvvPMNvkgPqkS4oWxYC1Zs
GOOGLE_API_KEY=AIzaSyBQWouan59P7rvvPMNvkgPqkS4oWxYC1Zs
```

### Codex MCP Servers (`~/.codex/config.toml`)
```toml
[mcp_servers.gemini-workflow]
command = "node"
args = ["/Users/kyin/Projects/Studyin/scripts/mcp/gemini-workflow-server.js"]

[mcp_servers.gemini-workflow.env]
GEMINI_API_KEY = "AIzaSyBQWouan59P7rvvPMNvkgPqkS4oWxYC1Zs"
PROJECT_ROOT = "/Users/kyin/Projects/Studyin"
```

## 🛠️ Available MCP Tools

### 1. **`analyze_dashboard`**
Analyze dashboard UI/UX using Gemini vision model.

**Parameters:**
- `screenshot_path` (required): Path to dashboard screenshot
- `analysis_type`: `ui` | `ux` | `accessibility` | `gamification` | `full`

**Example:**
```bash
codex --mcp gemini-workflow \
  "Use analyze_dashboard tool to analyze: test-results/dashboard.png with type: full"
```

### 2. **`generate_test`**
Generate Playwright tests using Gemini.

**Parameters:**
- `test_description` (required): What the test should do
- `route` (required): Route to test (e.g., `/dashboard`)

**Example:**
```bash
codex --mcp gemini-workflow \
  "Use generate_test tool for route /dashboard: Test XP bar displays correctly"
```

### 3. **`review_code`**
Review code with Gemini and get suggestions.

**Parameters:**
- `code` (required): Code to review
- `language`: Programming language (default: `typescript`)
- `focus`: `performance` | `security` | `best-practices` | `all`

**Example:**
```bash
codex --mcp gemini-workflow \
  "Use review_code tool to review app/dashboard/page.tsx with focus: all"
```

### 4. **`improve_gamification`**
Analyze and improve gamification features.

**Parameters:**
- `current_features` (required): Description of current features
- `user_data`: Optional engagement data

**Example:**
```bash
codex --mcp gemini-workflow \
  "Use improve_gamification tool to analyze our XP, achievements, and quest system"
```

## 🚀 Quick Start

### 1. Verify Setup
```bash
# Check MCP servers
codex mcp list

# Should show: gemini-workflow, zen, (and any others)

# Get details
codex mcp get gemini-workflow
```

### 2. Test Gemini Connection
```bash
# Simple test
codex -c model="gpt-5-pro" \
  --mcp gemini-workflow \
  "List the available tools"
```

### 3. Run Complete Workflow
```bash
# Run the full dashboard testing workflow
./scripts/workflows/dashboard-test-workflow.sh
```

## 📋 Example Workflows

### Workflow 1: Dashboard Analysis
```bash
#!/bin/bash
# Capture screenshot
npx playwright screenshot http://localhost:3005/dashboard dashboard.png

# Analyze with Gemini
codex --mcp gemini-workflow \
  "analyze_dashboard tool: screenshot_path=dashboard.png, analysis_type=full"
```

### Workflow 2: Generate & Run Tests
```bash
#!/bin/bash
# Generate test
TEST_CODE=$(codex --mcp gemini-workflow \
  "generate_test tool: route=/dashboard, description='Test daily quests display'")

# Save test
echo "$TEST_CODE" > e2e-tests/dashboard-generated.spec.ts

# Run test
npx playwright test e2e-tests/dashboard-generated.spec.ts
```

### Workflow 3: Code Review Loop
```bash
#!/bin/bash
# Review code
REVIEW=$(codex --mcp gemini-workflow \
  "review_code tool: code=$(cat app/dashboard/page.tsx), focus=performance")

echo "$REVIEW"

# Apply suggestions manually or with another Codex call
codex -c model="gpt-5-pro" \
  "Apply the performance improvements from this review: $REVIEW"
```

## 🔄 Integration with Cookbook Pattern

This setup follows the OpenAI cookbook pattern but uses **Gemini** instead of OpenAI:

| **OpenAI Cookbook** | **This Setup** |
|---------------------|----------------|
| `openai` Python SDK | `@google/generative-ai` npm package |
| GPT-4 model | `gemini-2.5-flash-preview-09-2025` |
| `OPENAI_API_KEY` | `GEMINI_API_KEY` |
| OpenAI chat completions | Gemini `generateContent` API |
| Direct API calls | Codex MCP orchestration |

### Key Advantages of This Approach:

1. **Unified Interface**: Use Codex CLI for all AI interactions
2. **Tool Chaining**: Combine multiple MCP tools in workflows
3. **State Management**: Codex handles conversation context
4. **Safety**: Sandbox controls and approval policies
5. **Flexibility**: Easy to swap models or add new tools

## 📊 Dashboard Features Built

Your dashboard now includes:

✅ **XP & Leveling System** - With animated progress bars
✅ **Streak Tracking** - Fire badge motivation
✅ **Daily Quests** - 3 missions with XP rewards
✅ **Weekly Quests** - Bigger challenges
✅ **Achievements** - 6 unlockable badges
✅ **Stats Cards** - Accuracy, questions, study time
✅ **Recent Activity** - Color-coded topics
✅ **Beautiful Onboarding** - For new users

All testable and analyzable via the Gemini MCP workflow!

## 🧪 Testing Commands

```bash
# Run existing Playwright tests
npm run test:e2e

# Run specific test
npx playwright test -g "dashboard"

# Run with UI
npm run test:e2e:ui

# Take screenshot
npx playwright screenshot http://localhost:3005/dashboard out.png
```

## 📚 Resources

- **OpenAI Cookbook**: https://cookbook.openai.com/examples/codex/codex_mcp_agents_sdk/building_consistent_workflows_codex_cli_agents_sdk
- **Gemini API Docs**: https://ai.google.dev/docs
- **Codex CLI Docs**: https://docs.codex.dev
- **Playwright Docs**: https://playwright.dev
- **MCP Protocol**: https://modelcontextprotocol.io

## 🎯 Next Steps

1. **Expand Tools**: Add more custom MCP tools for your workflow
2. **Automate CI/CD**: Run workflows in GitHub Actions
3. **Dashboard Improvements**: Use `improve_gamification` tool suggestions
4. **Test Coverage**: Generate comprehensive test suites
5. **Code Quality**: Set up automatic code review on PRs

---

**Status**: ✅ Fully configured and ready to use!

**Dashboard**: http://localhost:3005/dashboard
**Model**: `gemini-2.5-flash-preview-09-2025`
**Orchestrator**: Codex CLI with GPT-5 Pro

#!/usr/bin/env node
/**
 * Follow The Money - Multi-Agent Orchestrator
 * Coordinates specialized agents to build the mini-game
 * Following OpenAI Codex MCP Agents SDK cookbook pattern
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = '/Users/kyin/Projects/Studyin';
const GAME_DIR = join(PROJECT_ROOT, 'components/games/follow-the-money');
const DOCS_DIR = join(PROJECT_ROOT, 'docs/follow-the-money');
const SPRITES_DIR = join(PROJECT_ROOT, 'public/sprites/follow-the-money');

// Ensure directories exist
[GAME_DIR, DOCS_DIR, SPRITES_DIR].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

// Agent definitions
const AGENTS = {
  gameMaster: {
    name: 'Game Master',
    model: 'gpt-5-pro',
    role: 'orchestrator',
    instructions: `You are the Game Master orchestrating the "Follow The Money" mini-game development.

Your responsibilities:
1. Coordinate all agents in sequential order
2. Validate deliverables before proceeding to next agent
3. Enforce gating logic between phases
4. Track progress in AGENT_TASKS.md
5. Make final integration decisions

You MUST follow strict handoff protocol:
- Only proceed when previous agent's deliverable is validated
- Document all decisions in AGENT_TASKS.md
- Reject incomplete work and request revisions
- Ensure consistency across all artifacts`,
  },

  gameDesigner: {
    name: 'Game Designer',
    model: 'gemini-2.5-flash-preview-09-2025',
    role: 'planner',
    instructions: `You are the Game Designer for "Follow The Money" mini-game.

Your deliverable: GAME_MECHANICS.md

Must include:
1. Detailed game flow (Setup → Shuffle → Select → Reward)
2. Difficulty level specifications
3. Shuffle algorithms for each difficulty
4. Scoring formulas with XP calculations
5. Win/loss conditions
6. Accessibility requirements
7. Performance targets

Format: Structured markdown with code examples.
Output location: docs/follow-the-money/GAME_MECHANICS.md`,
  },

  spriteArtist: {
    name: 'Sprite Artist',
    model: 'gemini-2.5-flash-preview-09-2025',
    role: 'designer',
    instructions: `You are the Sprite Artist creating chibi characters and game elements.

Your deliverables:
1. Generate 4 chibi character sprites using nanobanana prompts
2. Design shell/container sprites (closed and open states)
3. Create money bag sprite with glow effect
4. Produce sprite specification document

Characters needed:
- Medic Mario (red hat, stethoscope, chibi style)
- Scholar Luigi (green, glasses, notebook, chibi style)
- Professor Peach (pink, graduation cap, chibi style)
- Scientist Toad (lab coat, goggles, chibi style)

Provide nanobanana prompts for each character.
Create SPRITE_SPEC.md with dimensions, color palettes, and export settings.`,
  },

  animationEngineer: {
    name: 'Animation Engineer',
    model: 'gpt-5-pro',
    role: 'frontend-developer',
    instructions: `You are the Animation Engineer implementing the game UI.

Your deliverables:
1. React components in components/games/follow-the-money/
2. Anime.js shuffle animations
3. Framer Motion reveal animations
4. Responsive layout for all screen sizes

Components to build:
- FollowTheMoneyGame.tsx (main container)
- GameBoard.tsx (container grid)
- ContainerShell.tsx (individual shell with animation)
- ShuffleAnimation.tsx (animation controller)
- SelectionInterface.tsx (click handling)
- ResultsDisplay.tsx (win/loss screen)
- ChibiCharacter.tsx (player avatar)

Requirements:
- 60 FPS animations
- TypeScript with proper typing
- Accessibility (keyboard navigation)
- Mobile-first responsive design`,
  },

  stateManager: {
    name: 'State Manager',
    model: 'gpt-5-pro',
    role: 'backend-developer',
    instructions: `You are the State Manager implementing game logic.

Your deliverables:
1. lib/games/follow-the-money-engine.ts
2. lib/games/shuffle-algorithm.ts
3. lib/games/scoring-system.ts

Core logic needed:
- Track which container has the "money"
- Generate shuffle sequences (deterministic with seed)
- Process player selections
- Calculate scores and XP rewards
- Integrate with existing XP system
- Persist game results to learner state

Must be deterministic and testable.
No runtime randomness - use seeded PRNG.
Export all functions for testing.`,
  },

  qualityTester: {
    name: 'Quality Tester',
    model: 'gpt-5-pro',
    role: 'tester',
    instructions: `You are the Quality Tester validating the game.

Your deliverable: TEST_REPORT.md + Playwright tests

Test coverage:
1. Game mechanics (shuffle randomness, selection accuracy)
2. All difficulty levels work correctly
3. Scoring calculations are accurate
4. XP integration functions properly
5. Accessibility (keyboard, screen reader)
6. Performance (60 FPS, < 100ms response)
7. Mobile responsiveness
8. Edge cases (rapid clicking, navigation away, etc.)

Create:
- e2e-tests/games/follow-the-money.spec.ts
- Unit tests for game engine
- TEST_REPORT.md with all findings`,
  },
};

// Workflow phases
const WORKFLOW = [
  {
    phase: 1,
    name: 'Planning',
    agent: 'gameMaster',
    action: 'initialize',
    deliverable: 'AGENT_TASKS.md',
  },
  {
    phase: 2,
    name: 'Game Design',
    agent: 'gameDesigner',
    action: 'design_mechanics',
    deliverable: 'GAME_MECHANICS.md',
    gate: 'gameMaster validates mechanics',
  },
  {
    phase: 3,
    name: 'Sprite Creation',
    agent: 'spriteArtist',
    action: 'generate_sprites',
    deliverable: 'SPRITE_SPEC.md + nanobanana prompts',
    gate: 'gameMaster validates sprite specifications',
  },
  {
    phase: 4,
    name: 'Implementation (Parallel)',
    agents: ['animationEngineer', 'stateManager'],
    action: 'implement',
    deliverables: ['React components', 'Game engine'],
    gate: 'gameMaster validates both implementations',
  },
  {
    phase: 5,
    name: 'Testing',
    agent: 'qualityTester',
    action: 'test',
    deliverable: 'TEST_REPORT.md + test suite',
    gate: 'gameMaster validates test coverage',
  },
  {
    phase: 6,
    name: 'Integration',
    agent: 'gameMaster',
    action: 'integrate',
    deliverable: 'Working game in dashboard',
  },
];

// Execute agent task
function executeAgent(agentName, task, context = {}) {
  const agent = AGENTS[agentName];

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🤖 Agent: ${agent.name}`);
  console.log(`📋 Task: ${task}`);
  console.log(`🎯 Role: ${agent.role}`);
  console.log(`${'='.repeat(60)}\n`);

  // Build prompt for agent
  const prompt = `${agent.instructions}

Current Task: ${task}

Context:
${JSON.stringify(context, null, 2)}

Execute your role and provide your deliverable.`;

  // Execute via Codex CLI
  try {
    const command = `codex -c model="${agent.model}" "${prompt.replace(/"/g, '\\"')}"`;
    const result = execSync(command, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    return {
      success: true,
      output: result,
      agent: agentName,
    };
  } catch (error) {
    console.error(`❌ Agent ${agent.name} failed:`, error.message);
    return {
      success: false,
      error: error.message,
      agent: agentName,
    };
  }
}

// Main orchestration flow
async function orchestrate() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  Follow The Money - Multi-Agent Orchestration              ║
║  Inspired by Mario Party Mini-Game                         ║
╚════════════════════════════════════════════════════════════╝
`);

  const taskList = join(DOCS_DIR, 'AGENT_TASKS.md');
  let taskLog = `# Follow The Money - Agent Task List\n\nStarted: ${new Date().toISOString()}\n\n`;

  for (const step of WORKFLOW) {
    console.log(`\n📍 Phase ${step.phase}: ${step.name}`);
    console.log(`${'─'.repeat(60)}`);

    taskLog += `## Phase ${step.phase}: ${step.name}\n\n`;

    if (step.agents) {
      // Parallel execution
      console.log(`🔀 Executing ${step.agents.length} agents in parallel...`);
      const results = await Promise.all(
        step.agents.map(agentName =>
          executeAgent(agentName, step.action, { phase: step.phase })
        )
      );

      results.forEach(result => {
        taskLog += `### ${AGENTS[result.agent].name}\n`;
        taskLog += `Status: ${result.success ? '✅ Complete' : '❌ Failed'}\n`;
        taskLog += `Output:\n\`\`\`\n${result.output || result.error}\n\`\`\`\n\n`;
      });

      // Gate check
      if (step.gate) {
        console.log(`\n🚧 Gate: ${step.gate}`);
        const gateResult = executeAgent('gameMaster', `Validate: ${step.gate}`, {
          results,
        });

        if (!gateResult.success) {
          console.error(`❌ Gate failed! Stopping workflow.`);
          taskLog += `\n**Gate Failed**: ${step.gate}\n`;
          break;
        }
        console.log(`✅ Gate passed!`);
        taskLog += `\n**Gate Passed**: ${step.gate}\n\n`;
      }
    } else {
      // Single agent execution
      const result = executeAgent(step.agent, step.action, { phase: step.phase });

      taskLog += `### ${AGENTS[step.agent].name}\n`;
      taskLog += `Status: ${result.success ? '✅ Complete' : '❌ Failed'}\n`;
      taskLog += `Deliverable: ${step.deliverable}\n`;
      taskLog += `Output:\n\`\`\`\n${result.output || result.error}\n\`\`\`\n\n`;

      if (!result.success) {
        console.error(`❌ Phase ${step.phase} failed! Stopping workflow.`);
        break;
      }

      // Gate check
      if (step.gate) {
        console.log(`\n🚧 Gate: ${step.gate}`);
        const gateResult = executeAgent('gameMaster', `Validate: ${step.gate}`, {
          result,
        });

        if (!gateResult.success) {
          console.error(`❌ Gate failed! Stopping workflow.`);
          taskLog += `\n**Gate Failed**: ${step.gate}\n`;
          break;
        }
        console.log(`✅ Gate passed!`);
        taskLog += `\n**Gate Passed**: ${step.gate}\n\n`;
      }
    }

    // Save progress
    writeFileSync(taskList, taskLog);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✨ Orchestration Complete!`);
  console.log(`📄 Task log: ${taskList}`);
  console.log(`${'='.repeat(60)}\n`);
}

// Run orchestration
if (import.meta.url === `file://${process.argv[1]}`) {
  orchestrate().catch(console.error);
}

export { AGENTS, WORKFLOW, executeAgent, orchestrate };

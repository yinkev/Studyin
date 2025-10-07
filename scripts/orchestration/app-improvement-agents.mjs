#!/usr/bin/env node
/**
 * Studyin App Improvement - Multi-Agent Orchestrator
 * Coordinates: UI Migration to Mantine + Phase 1 Roadmap Implementation
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = '/Users/kyin/Projects/Studyin';
const DOCS_DIR = join(PROJECT_ROOT, 'docs');

// Ensure directories exist
if (!existsSync(DOCS_DIR)) {
  mkdirSync(DOCS_DIR, { recursive: true });
}

// Agent definitions
const AGENTS = {
  uiMigrationPlanner: {
    name: 'UI Migration Planner',
    model: 'gpt-5-pro',
    role: 'architect',
    instructions: `Analyze HeroUI to Mantine UI migration strategy.

Deliverable: docs/UI_MIGRATION_PLAN.md

Must include:
1. Component mapping (HeroUI → Mantine)
2. Theme migration strategy
3. Phased rollout plan
4. Risk assessment
5. Testing strategy`,
  },

  engineEngineer: {
    name: 'Engine Engineer',
    model: 'gpt-5-pro',
    role: 'backend-developer',
    instructions: `Fix adaptive engine caps and cooldowns.

Deliverable: Updated lib/study-engine.ts with caps enabled

Requirements:
1. Remove disableCaps flag
2. Enforce exposure caps (≤1/day, ≤2/week, 96h cooldown)
3. Add unit tests
4. Document changes`,
  },

  analyticsEngineer: {
    name: 'Analytics Engineer',
    model: 'gpt-5-pro',
    role: 'backend-developer',
    instructions: `Wire dashboard metrics to real telemetry data.

Deliverable: Updated lib/services/dashboardAnalytics.ts

Requirements:
1. Replace mock quests with telemetry-backed counters
2. Map LO IDs to names via blueprint registry
3. Add analytics health indicators
4. Wire refresh endpoint`,
  },

  frontendEngineer: {
    name: 'Frontend Engineer',
    model: 'gpt-5-codex',
    role: 'frontend-developer',
    instructions: `Migrate components to Mantine UI.

Deliverables:
1. Install Mantine dependencies
2. Set up MantineProvider
3. Migrate Dashboard components
4. Update game components

Maintain: animations, accessibility, responsive design`,
  },
};

// Workflow phases
const WORKFLOW = [
  {
    phase: 1,
    name: 'Planning & Analysis',
    agent: 'uiMigrationPlanner',
    action: 'analyze_migration',
    deliverable: 'UI_MIGRATION_PLAN.md',
  },
  {
    phase: 2,
    name: 'Engine Fixes',
    agent: 'engineEngineer',
    action: 'fix_caps',
    deliverable: 'Updated study-engine.ts',
  },
  {
    phase: 3,
    name: 'Analytics Wiring',
    agent: 'analyticsEngineer',
    action: 'wire_metrics',
    deliverable: 'Updated dashboardAnalytics.ts',
  },
  {
    phase: 4,
    name: 'UI Migration Implementation',
    agent: 'frontendEngineer',
    action: 'migrate_ui',
    deliverable: 'Mantine components',
  },
];

console.log(`
╔════════════════════════════════════════════════════════════╗
║  Studyin Multi-Agent Improvement Workflow                  ║
║  Phase 1: Mantine UI Migration + Roadmap Implementation    ║
╚════════════════════════════════════════════════════════════╝
`);

console.log('\n📋 Workflow Plan:\n');
WORKFLOW.forEach(step => {
  console.log(`Phase ${step.phase}: ${step.name}`);
  console.log(`  Agent: ${AGENTS[step.agent].name}`);
  console.log(`  Deliverable: ${step.deliverable}\n`);
});

console.log('\n✅ Orchestrator ready. To execute:');
console.log('   1. Review docs/PRODUCT_ROADMAP.md (already created)');
console.log('   2. Run each agent manually or via codex mcp-server');
console.log('   3. Follow gating logic between phases\n');

export { AGENTS, WORKFLOW };

#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const planPath = path.join(root, 'PLAN.md');

async function readPlan() {
  try {
    const text = await fs.readFile(planPath, 'utf8');
    return text.split('\n').slice(0, 80).join('\n');
  } catch (error) {
    return 'PLAN.md missing. Create it to track milestones.';
  }
}

function run(cmd) {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString().trim();
  } catch (error) {
    return String(error?.message || error);
  }
}

const status = [];
status.push('--- Studyin PM Pulse ---');
status.push(`Date: ${new Date().toISOString()}`);

status.push('\n[Validate]');
status.push(run('npm run validate:items')); // may exit non-zero but script continues

status.push('\n[Test]');
status.push(run('npm test'));

status.push('\n[Analyze]');
status.push(run('npm run analyze'));

status.push('\n[Rubric]');
status.push(run('npm run score:rubric || true'));

status.push('\n[PLAN Snapshot]\n');
const plan = await readPlan();
status.push(plan);

console.log(status.join('\n'));

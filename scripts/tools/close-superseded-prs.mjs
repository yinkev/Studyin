#!/usr/bin/env node
/**
 * Close superseded Codex PRs via GitHub API.
 *
 * Usage:
 *   REPO="owner/name" GITHUB_TOKEN=ghp_xxx node scripts/tools/close-superseded-prs.mjs
 *   DRY_RUN=1 REPO="owner/name" node scripts/tools/close-superseded-prs.mjs
 *
 * Defaults:
 *   - REPO falls back to yinkev/Studyin
 *   - DRY_RUN enabled automatically if no GITHUB_TOKEN is present
 *   - TARGET_PRS (csv) optional; defaults to all open PRs with head ref starting with "codex/" except #11
 */

const REPO = process.env.REPO || 'yinkev/Studyin';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const DRY_RUN = Boolean(process.env.DRY_RUN) || !TOKEN;
const BASE_URL = `https://api.github.com/repos/${REPO}`;

const explicit = (process.env.TARGET_PRS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => Number(s))
  .filter((n) => Number.isFinite(n));

async function gh(path, init = {}) {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {})
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${init.method || 'GET'} ${path} failed ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  const prs = await gh('/pulls?state=open&per_page=100');
  let candidates = prs
    .map((pr) => ({ number: pr.number, head: pr.head.ref, title: pr.title }))
    .filter((pr) => pr.head?.startsWith('codex/'))
    .filter((pr) => pr.number !== 11);

  if (explicit.length) {
    const set = new Set(explicit);
    candidates = candidates.filter((pr) => set.has(pr.number));
  }

  if (candidates.length === 0) {
    console.log('No candidate PRs to close.');
    return;
  }

  console.log(`Found ${candidates.length} candidate PRs:`, candidates.map((c) => `#${c.number}`).join(', '));

  if (DRY_RUN) {
    console.log('DRY_RUN enabled (no token). Skipping close.');
    console.log('To close, provide GITHUB_TOKEN with repo:write permissions.');
    return;
  }

  for (const pr of candidates) {
    const body =
      'Closing as superseded by PR #11 (adaptive engine + optimistic learner-state UI) merged into main. ' +
      'See PLAN.md for PR hygiene policy. If you need a specific asset from this PR, please cherry-pick onto main.';
    await gh(`/issues/${pr.number}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body })
    });
    await gh(`/pulls/${pr.number}`, {
      method: 'PATCH',
      body: JSON.stringify({ state: 'closed' })
    });
    console.log(`Closed PR #${pr.number} (${pr.head})`);
  }
}

main().catch((err) => {
  console.error(err.stack || err.message || String(err));
  process.exit(1);
});


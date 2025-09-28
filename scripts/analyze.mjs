#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { parseNdjsonLine, attemptEventSchema } from './lib/schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'events.ndjson');
const OUTPUT_PATH = path.join(ROOT, 'public', 'analytics', 'latest.json');
const ANALYTICS_SCHEMA_VERSION = '1.0.0';
const TARGET_MASTERY = 0.82;
const EXPECTED_GAIN_PER_ATTEMPT = 0.12;
const MIN_ATTEMPTS_FOR_NFD = 20;

async function loadEvents() {
  try {
    const content = await fs.readFile(DATA_PATH, 'utf8');
    const lines = content.split('\n');
    const attempts = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = parseNdjsonLine(line, attemptEventSchema);
      if (event) attempts.push(event);
    }
    return attempts;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

function wilsonUpperBound(successes, trials, z = 1.96) {
  if (trials === 0) return 0;
  const phat = successes / trials;
  const denominator = 1 + (z ** 2) / trials;
  const centre = phat + (z ** 2) / (2 * trials);
  const margin =
    z * Math.sqrt((phat * (1 - phat) + (z ** 2) / (4 * trials)) / trials);
  return (centre + margin) / denominator;
}

function summarize(attempts) {
  const now = Date.now();
  if (!attempts.length) {
    return {
      schema_version: ANALYTICS_SCHEMA_VERSION,
      generated_at: new Date(now).toISOString(),
      has_events: false,
      totals: { attempts: 0, learners: 0 },
      ttm_per_lo: [],
      elg_per_min: [],
      confusion_edges: [],
      speed_accuracy: {
        fast_wrong: 0,
        slow_wrong: 0,
        fast_right: 0,
        slow_right: 0
      },
      nfd_summary: []
    };
  }

  const speedBuckets = {
    fast_wrong: 0,
    slow_wrong: 0,
    fast_right: 0,
    slow_right: 0
  };

  const loMetrics = new Map();
  const itemMetrics = new Map();
  const learnerIds = new Set();
  const confusionMap = new Map();

  for (const attempt of attempts) {
    learnerIds.add(attempt.user_id);
    const durationSeconds = attempt.duration_ms / 1000;
    const speedKey = durationSeconds <= 45 ? 'fast' : 'slow';
    const correctness = attempt.correct ? 'right' : 'wrong';
    speedBuckets[`${speedKey}_${correctness}`] += 1;

    attempt.lo_ids.forEach((loId) => {
      const existing =
        loMetrics.get(loId) ?? {
          attempts: 0,
          correct: 0,
          totalDuration: 0,
          lastAttemptTs: 0
        };
      existing.attempts += 1;
      existing.totalDuration += durationSeconds;
      if (attempt.correct) existing.correct += 1;
      existing.lastAttemptTs = Math.max(existing.lastAttemptTs, attempt.ts_submit);
      loMetrics.set(loId, existing);
    });

    const item =
      itemMetrics.get(attempt.item_id) ?? {
        attempts: 0,
        correct: 0,
        durationTotal: 0,
        choiceCounts: new Map()
      };
    item.attempts += 1;
    item.durationTotal += durationSeconds;
    if (attempt.correct) item.correct += 1;
    const key = attempt.choice;
    item.choiceCounts.set(key, (item.choiceCounts.get(key) ?? 0) + 1);
    itemMetrics.set(attempt.item_id, item);

    if (!attempt.correct) {
      attempt.lo_ids.forEach((loId) => {
        const key = `${loId}::${attempt.choice}->${attempt.item_id}`;
        const record = confusionMap.get(key) ?? { count: 0, lo_id: loId, item_id: attempt.item_id, choice: attempt.choice };
        record.count += 1;
        confusionMap.set(key, record);
      });
    }
  }

  const ttm_per_lo = Array.from(loMetrics.entries())
    .map(([loId, metrics]) => {
      const accuracy = metrics.attempts ? metrics.correct / metrics.attempts : 0;
      const avgDurationSec = metrics.attempts ? metrics.totalDuration / metrics.attempts : 60;
      const deficit = Math.max(0, TARGET_MASTERY - accuracy);
      const attemptsNeeded = deficit === 0 ? 0 : Math.ceil(deficit / EXPECTED_GAIN_PER_ATTEMPT);
      const projectedMinutes = Number(
        (attemptsNeeded * (avgDurationSec / 60)).toFixed(2)
      );
      const overdue = Date.now() - metrics.lastAttemptTs > 1000 * 60 * 60 * 24 * 3; // >3 days stale
      return {
        lo_id: loId,
        attempts: metrics.attempts,
        current_accuracy: Number(accuracy.toFixed(2)),
        projected_minutes_to_mastery: projectedMinutes,
        overdue
      };
    })
    .sort((a, b) => b.projected_minutes_to_mastery - a.projected_minutes_to_mastery);

  const elgCandidates = [];
  for (const [itemId, metrics] of itemMetrics.entries()) {
    const avgDurationSec = metrics.attempts ? metrics.durationTotal / metrics.attempts : 60;
    const avgMinutes = avgDurationSec / 60;
    const associatedLos = attempts.find((attempt) => attempt.item_id === itemId)?.lo_ids ?? [];
    const loDeficits = associatedLos
      .map((loId) => ttm_per_lo.find((entry) => entry.lo_id === loId)?.projected_minutes_to_mastery ?? 0)
      .filter((minutes) => minutes > 0);
    const avgDeficitMinutes = loDeficits.length
      ? loDeficits.reduce((sum, value) => sum + value, 0) / loDeficits.length
      : 0;
    const projectedGain = Math.min(1, (loDeficits.length ? loDeficits.length * EXPECTED_GAIN_PER_ATTEMPT : 0.05));
    const score = avgMinutes > 0 ? projectedGain / avgMinutes : projectedGain;
    if (associatedLos.length) {
      elgCandidates.push({
        item_id: itemId,
        lo_ids: associatedLos,
        projected_mastery_gain: Number(projectedGain.toFixed(2)),
        estimated_minutes: Number(avgMinutes.toFixed(2)),
        score,
        reason: avgDeficitMinutes > 0 ? 'Mastery deficit' : 'Reinforce recent success'
      });
    }
  }

  const elg_per_min = elgCandidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score, ...rest }) => rest);

  const confusion_edges = Array.from(confusionMap.values())
    .sort((a, b) => b.count - a.count)
    .map((edge) => ({
      lo_id: edge.lo_id,
      item_id: edge.item_id,
      choice: edge.choice,
      count: edge.count
    }));

  const nfd_summary = [];
  for (const [itemId, metrics] of itemMetrics.entries()) {
    if (metrics.attempts < MIN_ATTEMPTS_FOR_NFD) continue;
    const totalAttempts = metrics.attempts;
    for (const [choice, count] of metrics.choiceCounts.entries()) {
      const pickRate = count / totalAttempts;
      const upperBound = wilsonUpperBound(count, totalAttempts);
      if (pickRate < 0.05 && upperBound < 0.1) {
        nfd_summary.push({
          item_id: itemId,
          choice,
          pick_rate: Number(pickRate.toFixed(3)),
          attempts: totalAttempts
        });
      }
    }
  }

  return {
    schema_version: ANALYTICS_SCHEMA_VERSION,
    generated_at: new Date(now).toISOString(),
    has_events: true,
    totals: { attempts: attempts.length, learners: learnerIds.size },
    ttm_per_lo,
    elg_per_min,
    confusion_edges,
    speed_accuracy: speedBuckets,
    nfd_summary
  };
}

async function main() {
  try {
    const attempts = await loadEvents();
    const summary = summarize(attempts);
    await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(summary, null, 2) + '\n');
    console.log(`✓ analytics written to ${path.relative(ROOT, OUTPUT_PATH)}`);
  } catch (error) {
    console.error('Analyze script error:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

await main();

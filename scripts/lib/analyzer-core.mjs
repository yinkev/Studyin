import { promises as fs } from 'fs';
import { parseNdjsonLine, attemptEventSchema } from './schema.mjs';

const ANALYTICS_SCHEMA_VERSION = '1.1.0';
const TARGET_MASTERY = 0.82;
const EXPECTED_GAIN_PER_ATTEMPT = 0.12;
const MIN_ATTEMPTS_FOR_NFD = 20;

export async function loadAttempts(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
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
  const margin = z * Math.sqrt((phat * (1 - phat) + (z ** 2) / (4 * trials)) / trials);
  return (centre + margin) / denominator;
}

export function summarizeAttempts(attempts, now = Date.now()) {
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
  const learnerStats = new Map();
  const sessionStats = new Map();

  for (const attempt of attempts) {
    learnerIds.add(attempt.user_id);
    const durationSeconds = attempt.duration_ms / 1000;
    const speedKey = durationSeconds <= 45 ? 'fast' : 'slow';
    const correctness = attempt.correct ? 'right' : 'wrong';
    speedBuckets[`${speedKey}_${correctness}`] += 1;

    const learner = learnerStats.get(attempt.user_id) ?? { correct: 0, attempts: 0 };
    learner.attempts += 1;
    if (attempt.correct) learner.correct += 1;
    learnerStats.set(attempt.user_id, learner);

    const session = sessionStats.get(attempt.session_id) ?? { correct: 0, attempts: 0 };
    session.attempts += 1;
    if (attempt.correct) session.correct += 1;
    sessionStats.set(attempt.session_id, session);

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
        choiceCounts: new Map(),
        learnerPairs: []
      };
    item.attempts += 1;
    item.durationTotal += durationSeconds;
    if (attempt.correct) item.correct += 1;
    const key = attempt.choice;
    item.choiceCounts.set(key, (item.choiceCounts.get(key) ?? 0) + 1);
    item.learnerPairs.push({ learnerId: attempt.user_id, correct: attempt.correct, sessionId: attempt.session_id });
    itemMetrics.set(attempt.item_id, item);

    if (!attempt.correct) {
      attempt.lo_ids.forEach((loId) => {
        const confusionKey = `${loId}::${attempt.choice}->${attempt.item_id}`;
        const record = confusionMap.get(confusionKey) ?? { count: 0, lo_id: loId, item_id: attempt.item_id, choice: attempt.choice };
        record.count += 1;
        confusionMap.set(confusionKey, record);
      });
    }
  }

  const ttm_per_lo = Array.from(loMetrics.entries())
    .map(([loId, metrics]) => {
      const accuracy = metrics.attempts ? metrics.correct / metrics.attempts : 0;
      const avgDurationSec = metrics.attempts ? metrics.totalDuration / metrics.attempts : 60;
      const deficit = Math.max(0, TARGET_MASTERY - accuracy);
      const attemptsNeeded = deficit === 0 ? 0 : Math.ceil(deficit / EXPECTED_GAIN_PER_ATTEMPT);
      const projectedMinutes = Number((attemptsNeeded * (avgDurationSec / 60)).toFixed(2));
      const overdue = now - metrics.lastAttemptTs > 1000 * 60 * 60 * 24 * 3;
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
    const projectedGain = Math.min(1, loDeficits.length ? loDeficits.length * EXPECTED_GAIN_PER_ATTEMPT : 0.05);
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

  const learnerAccuracy = new Map();
  learnerStats.forEach((value, learnerId) => {
    learnerAccuracy.set(learnerId, value.attempts ? value.correct / value.attempts : 0);
  });

  function computePointBiserial(pairs) {
    if (pairs.length < 2) return null;
    const filtered = pairs
      .map(({ learnerId, correct }) => {
        const stats = learnerStats.get(learnerId);
        if (!stats || stats.attempts < 2) return null;
        const accuracyExcluding = stats.attempts > 1
          ? (stats.correct - (correct ? 1 : 0)) / (stats.attempts - 1)
          : learnerAccuracy.get(learnerId) ?? 0;
        return { correct: correct ? 1 : 0, score: accuracyExcluding };
      })
      .filter(Boolean);
    if (filtered.length < 2) return null;
    const meanCorrect = filtered.reduce((sum, x) => sum + x.correct, 0) / filtered.length;
    const meanScore = filtered.reduce((sum, x) => sum + x.score, 0) / filtered.length;
    const numerator = filtered.reduce((sum, x) => sum + (x.correct - meanCorrect) * (x.score - meanScore), 0);
    const denomCorrect = Math.sqrt(filtered.reduce((sum, x) => sum + (x.correct - meanCorrect) ** 2, 0));
    const denomScore = Math.sqrt(filtered.reduce((sum, x) => sum + (x.score - meanScore) ** 2, 0));
    if (denomCorrect === 0 || denomScore === 0) return null;
    return Number((numerator / (denomCorrect * denomScore)).toFixed(4));
  }

  const item_point_biserial = Array.from(itemMetrics.entries()).map(([itemId, metrics]) => ({
    item_id: itemId,
    attempts: metrics.attempts,
    p_value: metrics.attempts ? Number((metrics.correct / metrics.attempts).toFixed(3)) : 0,
    point_biserial: computePointBiserial(metrics.learnerPairs)
  }));

  function computeKr20() {
    const sessions = Array.from(sessionStats.entries()).filter(([, value]) => value.attempts > 1);
    if (sessions.length < 2) return null;
    const scores = sessions.map(([, value]) => value.correct);
    const meanScore = scores.reduce((sum, x) => sum + x, 0) / scores.length;
    const variance = scores.reduce((sum, x) => sum + (x - meanScore) ** 2, 0) / (scores.length - 1 || 1);
    if (variance === 0) return null;
    const k = item_point_biserial.length;
    if (k < 2) return null;
    const sumPQ = item_point_biserial.reduce((sum, item) => {
      const p = item.p_value;
      const q = 1 - p;
      return sum + p * q;
    }, 0);
    const kr20 = (k / (k - 1)) * (1 - sumPQ / variance);
    return Number(kr20.toFixed(4));
  }

  const reliability = {
    kr20: computeKr20(),
    item_point_biserial
  };

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
    nfd_summary,
    reliability
  };
}

'use client';

import { useMemo, useState, useCallback, useEffect, useTransition } from 'react';
import type { StudyItem } from '../lib/getItems';
import type { LessonDoc } from '../lib/getLessons';
import type { AnalyticsSummary } from '../lib/getAnalytics';
import type { LearnerState } from '../lib/server/study-state';
import type { ThompsonArm } from '../lib/study-engine';
import type { StudyDashboards } from '../lib/study-insights';
import { LessonsView } from './LessonsView';
import { StudyView } from './StudyView';
import { buildRetentionQueue } from '../lib/study-engine';
import { submitRetentionReview } from '../app/study/actions';
import { useLearnerState } from '../lib/client/useLearnerState';

interface StudyTabsProps {
  items: StudyItem[];
  lessons: LessonDoc[];
  analytics: AnalyticsSummary | null;
  learnerId: string;
  initialLearnerState: LearnerState;
  schedulerArms: ThompsonArm[];
  recommendedLoId: string | null;
  retentionInfo: {
    minutes: number;
    fraction: number;
    maxDaysOverdue: number;
  };
  dashboards: StudyDashboards;
}

export function StudyTabs({
  items,
  lessons,
  analytics,
  learnerId,
  initialLearnerState,
  schedulerArms,
  recommendedLoId,
  retentionInfo,
  dashboards
}: StudyTabsProps) {
  const {
    data: learnerStateData,
    isFetching: learnerStateSyncing,
    setLearnerState: syncLearnerState,
    optimisticUpdate,
    invalidateLearnerState
  } = useLearnerState(learnerId, initialLearnerState);

  const learnerState = learnerStateData ?? initialLearnerState;

  useEffect(() => {
    syncLearnerState(initialLearnerState);
  }, [initialLearnerState, syncLearnerState]);

  const [activeLo, setActiveLo] = useState<string | null>(recommendedLoId ?? lessons[0]?.lo_id ?? null);
  const [tab, setTab] = useState<'learn' | 'practice'>('learn');

  const practiceItems = useMemo(() => {
    if (!activeLo) return items;
    const filtered = items.filter((it) => (it.los ?? []).includes(activeLo));
    return filtered.length ? filtered : items;
  }, [items, activeLo]);

  const itemLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => {
      map.set(item.id, item.stem ?? item.id);
    });
    return map;
  }, [items]);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const sortedArms = useMemo(() => {
    return schedulerArms
      .slice()
      .sort((a, b) => b.mu * b.urgency * b.blueprintMultiplier - a.mu * a.urgency * a.blueprintMultiplier)
      .slice(0, 6);
  }, [schedulerArms]);

  const itemsIndex = useMemo(
    () => items.map((item) => ({ id: item.id, los: item.los })),
    [items]
  );

  const retentionQueue = useMemo(
    () =>
      buildRetentionQueue({
        learnerState,
        items: itemsIndex,
        analytics: analytics ?? undefined,
        budgetMinutes: retentionInfo.minutes,
        now
      }),
    [learnerState, itemsIndex, analytics, retentionInfo.minutes, now]
  );

  const [activeRetentionId, setActiveRetentionId] = useState<string | null>(retentionQueue[0]?.itemId ?? null);
  useEffect(() => {
    if (!retentionQueue.length) {
      setActiveRetentionId(null);
      return;
    }
    const exists = retentionQueue.some((entry) => entry.itemId === activeRetentionId);
    if (!exists) {
      setActiveRetentionId(retentionQueue[0].itemId);
    }
  }, [retentionQueue, activeRetentionId]);

  const [retentionSessionId] = useState(() => crypto.randomUUID());
  const [isReviewPending, startReviewTransition] = useTransition();
  const activeRetentionEntry = useMemo(
    () => retentionQueue.find((entry) => entry.itemId === activeRetentionId) ?? retentionQueue[0],
    [retentionQueue, activeRetentionId]
  );
  const activeRetentionItem = useMemo(
    () => items.find((item) => item.id === activeRetentionEntry?.itemId),
    [items, activeRetentionEntry?.itemId]
  );
  const activeRetentionIndex = retentionQueue.findIndex((entry) => entry.itemId === activeRetentionEntry?.itemId);

  const handleRetentionReview = useCallback(
    (correct: boolean) => {
      if (!activeRetentionEntry) return;
      startReviewTransition(async () => {
        try {
          const result = await submitRetentionReview({
            learnerId,
            sessionId: retentionSessionId,
            itemId: activeRetentionEntry.itemId,
            loIds: activeRetentionEntry.loIds,
            correct,
            appVersion: process.env.NEXT_PUBLIC_APP_VERSION
          });
          if (result?.learnerState) {
            syncLearnerState(result.learnerState);
          }
        } catch (error) {
          console.error('submitRetentionReview failed', error);
        } finally {
          void invalidateLearnerState();
        }
      });
    },
    [activeRetentionEntry, invalidateLearnerState, learnerId, retentionSessionId, syncLearnerState]
  );

  const handlePractice = useCallback((loId: string) => {
    setActiveLo(loId);
    setTab('practice');
    const trigger = document.querySelector('[data-study-trigger="practice"]') as HTMLButtonElement | null;
    trigger?.focus();
  }, []);

  const handleLearnerStateChange = useCallback(
    (state: LearnerState) => {
      syncLearnerState(state);
    },
    [syncLearnerState]
  );

  return (
    <section className="space-y-6 px-4 py-10 max-w-6xl mx-auto text-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Mastery cockpit</p>
          <h1 className="text-3xl font-extrabold">Study</h1>
          {recommendedLoId && (
            <div className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600">
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">Next LO: {recommendedLoId}</span>
              <button
                className="btn-ghost"
                onClick={() => setActiveLo(recommendedLoId)}
              >
                Jump to LO
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 text-sm text-gray-600">
          <div className="inline-flex items-center gap-2">
            <button
              className={`btn-ghost ${tab === 'learn' ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => setTab('learn')}
            >
              Learn
            </button>
            <button
              className={`btn-ghost ${tab === 'practice' ? 'ring-2 ring-green-500' : ''}`}
              data-study-trigger="practice"
              onClick={() => setTab('practice')}
            >
              Practice
            </button>
          </div>
          <div className="text-xs">
            Retention: target {Math.round(retentionInfo.minutes)} min ({Math.round(retentionInfo.fraction * 100)}%)
          </div>
        </div>
      </div>
      {learnerStateSyncing && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 animate-pulse">
          <span className="okc-pill-ghost" aria-hidden>⟳</span>
          <span>Syncing learner progress…</span>
        </div>
      )}
      <div className="grid gap-3 text-xs text-gray-700 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
          <span className="text-emerald-800 font-semibold">Retention queue ({retentionQueue.length})</span>
          <ul className="mt-1 space-y-1">
            {retentionQueue.slice(0, 5).map((entry) => (
              <li
                key={entry.itemId}
                className={`rounded-lg bg-white px-2 py-1 shadow-sm ${
                  entry.itemId === activeRetentionEntry?.itemId ? 'border border-emerald-300' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <button className="font-medium text-emerald-700" onClick={() => setActiveRetentionId(entry.itemId)}>
                    {itemLabelMap.get(entry.itemId) ?? entry.itemId}
                  </button>
                  <span>
                    {entry.overdue
                      ? `${entry.overdueDays.toFixed(1)}d overdue`
                      : `${((entry.nextReviewMs - now) / (1000 * 60 * 60)).toFixed(1)}h`}
                  </span>
                </div>
                <div className="text-gray-500">{entry.estimatedMinutes.toFixed(1)} min · LOs {entry.loIds.join(', ') || '—'}</div>
              </li>
            ))}
            {retentionQueue.length === 0 && <li className="text-emerald-700">No cards due this session.</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
          <span className="text-blue-800 font-semibold">Priority LOs</span>
          <ul className="mt-1 space-y-1">
            {dashboards.priorityLos.slice(0, 5).map((entry) => (
              <li key={entry.loId} className="rounded-lg bg-white px-2 py-1 shadow-sm">
                <div className="flex items-center justify-between">
                  <button className="font-medium text-blue-700" onClick={() => setActiveLo(entry.loId)}>
                    {entry.loId}
                  </button>
                  <span>{entry.projectedMinutes.toFixed(1)} min</span>
                </div>
                <div className="text-gray-500">Attempts {entry.attempts} · {entry.overdue ? 'Overdue' : 'On track'}</div>
              </li>
            ))}
            {dashboards.priorityLos.length === 0 && <li className="text-blue-700">No outstanding mastery deficits.</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
          <span className="text-amber-800 font-semibold">Stalled LOs</span>
          <ul className="mt-1 space-y-1">
            {dashboards.stalledLos.slice(0, 5).map((entry) => (
              <li key={entry.loId} className="rounded-lg bg-white px-2 py-1 shadow-sm">
                <div className="flex items-center justify-between">
                  <button className="font-medium text-amber-700" onClick={() => setActiveLo(entry.loId)}>
                    {entry.loId}
                  </button>
                  <span>{(entry.accuracy * 100).toFixed(0)}% accuracy</span>
                </div>
                <div className="text-gray-500">Attempts {entry.attempts}</div>
              </li>
            ))}
            {dashboards.stalledLos.length === 0 && <li className="text-amber-700">No stalled LOs detected.</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2">
          <span className="text-rose-800 font-semibold">Overexposed items</span>
          <ul className="mt-1 space-y-1">
            {dashboards.overexposedItems.slice(0, 5).map((entry) => (
              <li key={entry.itemId} className="rounded-lg bg-white px-2 py-1 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-rose-700">{itemLabelMap.get(entry.itemId) ?? entry.itemId}</span>
                  <span>{entry.attempts7d} attempts /7d</span>
                </div>
                <div className="text-gray-500">24h: {entry.attempts24h} · last {entry.lastAttemptHoursAgo}h ago</div>
              </li>
            ))}
            {dashboards.overexposedItems.length === 0 && <li className="text-rose-700">No overexposed items.</li>}
          </ul>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {sortedArms.map((arm) => (
          <button
            key={arm.loId}
            onClick={() => setActiveLo(arm.loId)}
            className={`rounded-full border px-2 py-1 transition ${
              activeLo === arm.loId ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-100 hover:bg-white'
            }`}
          >
            {arm.loId} · μ {arm.mu.toFixed(2)} · {arm.eligible ? 'ready' : `cooldown ${(arm.cooldownHours ?? 0).toFixed(0)}h`}
          </button>
        ))}
      </div>
      {activeRetentionEntry && activeRetentionItem && (
        <div className="rounded-xl border border-emerald-200 bg-white px-4 py-4 text-sm text-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-emerald-700">Retention Review</h3>
            <span className="text-xs text-gray-500">
              Card {activeRetentionIndex + 1} / {retentionQueue.length}
            </span>
          </div>
          <p className="mt-2 text-gray-600">
            {activeRetentionEntry.overdue
              ? `${activeRetentionEntry.overdueDays.toFixed(1)} days overdue`
              : `Due in ${((activeRetentionEntry.nextReviewMs - Date.now()) / (1000 * 60 * 60)).toFixed(1)} hours`}
          </p>
          <div className="mt-3 space-y-3">
            <h4 className="text-lg font-semibold text-gray-900">{activeRetentionItem.stem}</h4>
            <ul className="space-y-2">
              {(['A', 'B', 'C', 'D', 'E'] as const).map((letter) => {
                const choice = activeRetentionItem.choices[letter];
                if (!choice) return null;
                return (
                  <li key={letter} className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                    <span className="font-medium text-emerald-800">{letter}.</span> {choice}
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn-primary" disabled={isReviewPending} onClick={() => handleRetentionReview(true)}>
                Mark Correct
              </button>
              <button
                className="btn-ghost text-rose-600"
                disabled={isReviewPending}
                onClick={() => handleRetentionReview(false)}
              >
                Mark Incorrect
              </button>
            </div>
          </div>
        </div>
      )}
      {tab === 'learn' ? (
        <LessonsView lessons={lessons} onPractice={handlePractice} />
      ) : (
        <StudyView
          items={practiceItems}
          analytics={analytics}
          learnerId={learnerId}
          learnerState={learnerState}
          onLearnerStateChange={handleLearnerStateChange}
          optimisticLearnerStateUpdate={optimisticUpdate}
          invalidateLearnerState={invalidateLearnerState}
        />
      )}
    </section>
  );
}

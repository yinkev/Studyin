'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { StudyItem } from '../lib/getItems';
import type { LessonDoc } from '../lib/getLessons';
import type { AnalyticsSummary } from '../lib/getAnalytics';
import { LessonsView } from './LessonsView';
import { StudyView } from './StudyView';
import { useLearnerState } from '../lib/client/useLearnerState';
import { updateHalfLife, scheduleNextReview } from '../scripts/lib/fsrs.mjs';

interface StudyTabsProps {
  items: StudyItem[];
  lessons: LessonDoc[];
  analytics: AnalyticsSummary | null;
}

  const {
    data: learnerStateData,
    setLearnerState,
    optimisticUpdate: applyOptimisticLearnerState,
    invalidateLearnerState
  } = useLearnerState(learnerId, initialLearnerState);
    setLearnerState((previous) => {
      if (previous?.updatedAt === initialLearnerState.updatedAt) {
        return previous;
      }
      return initialLearnerState;
    });
  }, [initialLearnerState, setLearnerState]);
  const learnerState = learnerStateData ?? initialLearnerState;
  const handleLearnerStateChange = useCallback(
    (state: LearnerState) => {
      setLearnerState(state);
    },
    [setLearnerState]
  );
  const practiceItems = useMemo(() => {
    if (!activeLo) return items;
    const filtered = items.filter((it) => (it.los ?? []).includes(activeLo));
    return filtered.length ? filtered : items;
  }, [items, activeLo]);

  const { mutate: mutateRetentionReview, isPending: isReviewPending } = useMutation<
    Awaited<ReturnType<typeof submitRetentionReview>>,
    Error,
    Parameters<typeof submitRetentionReview>[0],
    { previous: LearnerState }
  >({
    mutationFn: submitRetentionReview,
    onMutate: async (variables) => {
      const snapshot = await applyOptimisticLearnerState((current) => {
        const now = Date.now();
        const existing = current.retention[variables.itemId] ?? {
          loIds: variables.loIds,
          halfLifeHours: 12,
          nextReviewMs: now,
          lastReviewMs: undefined,
          lapses: 0
        };
        const expected = variables.correct ? 0.8 : 0.4;
        const { halfLifeHours } = updateHalfLife({
          halfLifeHours: existing.halfLifeHours ?? 12,
          expected,
          correct: variables.correct
        });
        const { nextReviewMs } = scheduleNextReview({ halfLifeHours, nowMs: now });
        return {
          ...current,
          updatedAt: new Date().toISOString(),
          retention: {
            ...current.retention,
            [variables.itemId]: {
              loIds: (variables.loIds.length ? variables.loIds : existing.loIds) ?? [],
              halfLifeHours,
              nextReviewMs,
              lastReviewMs: now,
              lapses: variables.correct ? existing.lapses ?? 0 : (existing.lapses ?? 0) + 1
            }
          }
        } satisfies LearnerState;
      });
      return { previous: snapshot };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        setLearnerState(context.previous);
      }
      console.error('submitRetentionReview failed', error);
    },
    onSuccess: (result) => {
      if (result?.learnerState) {
        setLearnerState(result.learnerState);
      }
    },
    onSettled: () => {
      void invalidateLearnerState();
    }
  });
      if (!activeRetentionEntry || isReviewPending) return;
      mutateRetentionReview({
        learnerId,
        sessionId: retentionSessionId,
        itemId: activeRetentionEntry.itemId,
        loIds: activeRetentionEntry.loIds,
        correct,
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION
    [activeRetentionEntry, isReviewPending, learnerId, mutateRetentionReview, retentionSessionId]
      {tab === 'learn' ? (
        <LessonsView lessons={lessons} onPractice={handlePractice} />
      ) : (
        <StudyView items={practiceItems} analytics={analytics} />
      )}
    </section>
  );
}
        <div
          className="rounded-xl border border-emerald-200 bg-white px-4 py-4 text-sm text-gray-800"
          aria-busy={isReviewPending}
        >
              <button
                className={`btn-primary ${isReviewPending ? 'opacity-70' : ''}`}
                disabled={isReviewPending}
                onClick={() => handleRetentionReview(true)}
              >
                className={`btn-ghost text-rose-600 ${isReviewPending ? 'opacity-60' : ''}`}
              {isReviewPending && <span className="text-xs text-emerald-700 animate-pulse">Saving review…</span>}
          onLearnerStateChange={handleLearnerStateChange}
          optimisticLearnerStateUpdate={applyOptimisticLearnerState}
          invalidateLearnerState={invalidateLearnerState}

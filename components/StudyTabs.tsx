'use client';

import { useMemo, useState, useCallback } from 'react';
import type { StudyItem } from '../lib/getItems';
import type { LessonDoc } from '../lib/getLessons';
import type { AnalyticsSummary } from '../lib/getAnalytics';
import type { LearnerState } from '../lib/server/study-state';
import { LessonsView } from './LessonsView';
import { StudyView } from './StudyView';
import { useLearnerState } from '../lib/client/useLearnerState';

interface StudyTabsProps {
  items: StudyItem[];
  lessons: LessonDoc[];
  analytics: AnalyticsSummary | null;
  learnerId: string;
  initialLearnerState: LearnerState;
}

export function StudyTabs({ items, lessons, analytics, learnerId, initialLearnerState }: StudyTabsProps) {
  const [activeLo, setActiveLo] = useState<string | null>(lessons[0]?.lo_id ?? null);
  const [tab, setTab] = useState<'learn' | 'practice'>('learn');

  const {
    data: learnerStateData,
    isFetching: learnerStateSyncing,
    setLearnerState,
    optimisticUpdate,
    invalidateLearnerState
  } = useLearnerState(learnerId, initialLearnerState);

  const learnerState = learnerStateData ?? initialLearnerState;

  const practiceItems = useMemo(() => {
    if (!activeLo) return items;
    const filtered = items.filter((it) => (it.los ?? []).includes(activeLo));
    return filtered.length ? filtered : items;
  }, [items, activeLo]);

  const handlePractice = useCallback((loId: string) => {
    setActiveLo(loId);
    setTab('practice');
    const trigger = document.querySelector('[data-study-trigger="practice"]') as HTMLButtonElement | null;
    trigger?.focus();
  }, []);

  const handleLearnerStateChange = useCallback(
    (state: LearnerState) => {
      setLearnerState(state);
    },
    [setLearnerState]
  );

  return (
    <section className="space-y-6 px-4 py-10 max-w-6xl mx-auto text-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Mastery cockpit</p>
          <h1 className="text-3xl font-extrabold">Study</h1>
        </div>
        <div className="inline-flex items-center gap-2">
          <button className={`btn-ghost ${tab === 'learn' ? 'ring-2 ring-green-500' : ''}`} onClick={() => setTab('learn')}>
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
      </div>
      {learnerStateSyncing && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 animate-pulse">
          <span className="okc-pill-ghost" aria-hidden>⟳</span>
          <span>Syncing learner progress…</span>
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

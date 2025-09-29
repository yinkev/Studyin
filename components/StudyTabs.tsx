'use client';

import { useMemo, useState, useCallback } from 'react';
import type { StudyItem } from '../lib/getItems';
import type { LessonDoc } from '../lib/getLessons';
import type { AnalyticsSummary } from '../lib/getAnalytics';
import { LessonsView } from './LessonsView';
import { StudyView } from './StudyView';

interface StudyTabsProps {
  items: StudyItem[];
  lessons: LessonDoc[];
  analytics: AnalyticsSummary | null;
}

export function StudyTabs({ items, lessons, analytics }: StudyTabsProps) {
  const [activeLo, setActiveLo] = useState<string | null>(lessons[0]?.lo_id ?? null);
  const [tab, setTab] = useState<'learn' | 'practice'>('learn');
  const practiceItems = useMemo(() => {
    if (!activeLo) return items;
    const filtered = items.filter((it) => (it.los ?? []).includes(activeLo));
    return filtered.length ? filtered : items;
  }, [items, activeLo]);

  const handlePractice = useCallback((loId: string) => {
    setActiveLo(loId);
    // switch tab via DOM id for simplicity
    const trigger = document.querySelector('[data-study-trigger="practice"]') as HTMLButtonElement | null;
    trigger?.click();
  }, []);

  return (
    <section className="space-y-6 px-4 py-10 max-w-6xl mx-auto text-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Mastery cockpit</p>
          <h1 className="text-3xl font-extrabold">Study</h1>
        </div>
        <div className="inline-flex items-center gap-2">
          <button className={`btn-ghost ${tab==='learn' ? 'ring-2 ring-green-500' : ''}`} onClick={() => setTab('learn')}>Learn</button>
          <button className={`btn-ghost ${tab==='practice' ? 'ring-2 ring-green-500' : ''}`} data-study-trigger="practice" onClick={() => setTab('practice')}>Practice</button>
        </div>
      </div>
      {tab === 'learn' ? (
        <LessonsView lessons={lessons} onPractice={handlePractice} />
      ) : (
        <StudyView items={practiceItems} analytics={analytics} />
      )}
    </section>
  );
}

'use client';

import { useMemo, useState, useCallback } from 'react';
import type { StudyItem } from '../lib/getItems';
import type { LessonDoc } from '../lib/getLessons';
import type { AnalyticsSummary } from '../lib/getAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/radix/tabs';
import { LessonsView } from './LessonsView';
import { StudyView } from './StudyView';

interface StudyTabsProps {
  items: StudyItem[];
  lessons: LessonDoc[];
  analytics: AnalyticsSummary | null;
}

export function StudyTabs({ items, lessons, analytics }: StudyTabsProps) {
  const [activeLo, setActiveLo] = useState<string | null>(lessons[0]?.lo_id ?? null);
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
    <Tabs defaultValue="learn" className="space-y-6 px-4 py-10 max-w-6xl mx-auto text-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Mastery cockpit</p>
          <h1 className="text-3xl font-extrabold">Study</h1>
        </div>
        <TabsList>
          <TabsTrigger value="learn">Learn</TabsTrigger>
          <TabsTrigger value="practice" data-study-trigger="practice">Practice</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="learn" className="focus-visible:outline-none">
        <LessonsView lessons={lessons} onPractice={handlePractice} />
      </TabsContent>
      <TabsContent value="practice" className="focus-visible:outline-none">
        <StudyView items={practiceItems} analytics={analytics} />
      </TabsContent>
    </Tabs>
  );
}

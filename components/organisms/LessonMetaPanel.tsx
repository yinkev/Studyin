'use client';

import { useEffect, useRef } from 'react';
import { animate as anime } from "animejs";
import GlowCard from '../atoms/GlowCard';
import type { InteractiveLesson } from '../../lib/types/lesson';

interface LessonMetaPanelProps {
  lesson: InteractiveLesson;
}

export function LessonMetaPanel({ lesson }: LessonMetaPanelProps) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('li');
    const timeline = (anime as any).timeline ? (anime as any).timeline({ ease: 'easeOutExpo' }) : null;
    if (timeline) {
      timeline.add({
        targets: items,
        translateX: [-20, 0],
        opacity: [0, 1],
        delay: (anime as any).stagger ? (anime as any).stagger(80) : 0
      });
      return () => {
        timeline.pause();
      };
    }
  }, [lesson.id]);

  return (
    <div className="grid gap-4">
      <GlowCard className="p-6">
        <h2 className="text-2xl font-bold text-slate-900">{lesson.title}</h2>
        <p className="mt-2 text-base text-slate-600">{lesson.summary}</p>
      </GlowCard>
      {lesson.high_yield.length > 0 && (
        <GlowCard className="px-6 py-5">
          <h3 className="text-lg font-semibold text-sky-600">High-Yield Sparks</h3>
          <ul ref={listRef} className="mt-3 space-y-2">
            {lesson.high_yield.map((item, index) => (
              <li key={index} className="flex items-start gap-3 text-slate-700">
                <span className="mt-1 inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full bg-sky-400 shadow-md" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </GlowCard>
      )}
      {lesson.pitfalls.length > 0 && (
        <GlowCard className="px-6 py-5">
          <h3 className="text-lg font-semibold text-rose-600">Avoid These Pitfalls</h3>
          <ul className="mt-3 space-y-2 text-slate-700">
            {lesson.pitfalls.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full bg-rose-400 shadow-md" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </GlowCard>
      )}
    </div>
  );
}

export default LessonMetaPanel;

'use client';

import { useEffect, useRef } from 'react';
import { animate, stagger } from 'motion/react';
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
    // @ts-expect-error Motion supports NodeList targets + transform keyframes at runtime
    animate(items, { x: [-20, 0], opacity: [0, 1] }, { delay: stagger(0.08), duration: 0.5, easing: [0.19, 1, 0.22, 1] });
  }, [lesson.id]);

  return (
    <div className="vstack-4">
      <GlowCard>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>{lesson.title}</h2>
        <p style={{ marginTop: '0.5rem', fontSize: '1rem', color: 'var(--md-sys-color-on-surface-variant)' }}>{lesson.summary}</p>
      </GlowCard>
      {lesson.high_yield.length > 0 && (
        <GlowCard>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--md-sys-color-secondary)' }}>High‑Yield Sparks</h3>
          <ul ref={listRef} style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem' }}>
            {lesson.high_yield.map((item, index) => (
              <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: 'var(--md-sys-color-on-surface)' }}>
                <span style={{ marginTop: '0.25rem', width: '10px', height: '10px', borderRadius: '9999px', backgroundColor: 'var(--md-sys-color-secondary)', boxShadow: 'var(--md-sys-elevation-1)', flexShrink: 0 }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </GlowCard>
      )}
      {lesson.pitfalls.length > 0 && (
        <GlowCard>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--md-sys-color-error)' }}>Avoid These Pitfalls</h3>
          <ul style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem', color: 'var(--md-sys-color-on-surface)' }}>
            {lesson.pitfalls.map((item, index) => (
              <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{ marginTop: '0.25rem', width: '10px', height: '10px', borderRadius: '9999px', backgroundColor: 'var(--md-sys-color-error)', boxShadow: 'var(--md-sys-elevation-1)', flexShrink: 0 }} />
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

'use client';

import { useEffect, useRef } from 'react';
import { animate as anime } from "animejs";
import GlowCard from '../atoms/GlowCard';
import type { LessonAnimationBeat } from '../../lib/types/lesson';

interface TimelineBeatCardProps {
  beat: LessonAnimationBeat;
  index: number;
  isActive: boolean;
  onActivate?: (beat: LessonAnimationBeat) => void;
}

export function TimelineBeatCard({ beat, index, isActive, onActivate }: TimelineBeatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const el = cardRef.current;
    const animation = anime({
      targets: el,
      scale: isActive ? [1, 1.02] : 1,
      borderColor: isActive ? '#38bdf8' : 'rgba(255,255,255,0.1)',
      duration: isActive ? 600 : 300,
      ease: isActive ? 'easeInOutQuad' : 'easeOutSine'
    });
    return () => {
      animation.pause();
    };
  }, [isActive]);

  useEffect(() => {
    if (isActive && onActivate) {
      onActivate(beat);
    }
  }, [isActive, beat, onActivate]);

  return (
    <GlowCard
      className="flex flex-col gap-3 border border-white/10 bg-white/70 p-6 transition-colors"
      glowColor={isActive ? 'rgba(14, 165, 233, 0.45)' : 'rgba(203, 213, 225, 0.2)'}
      delayMs={80 * index}
    >
      <div ref={cardRef} className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-2xl font-bold text-white shadow-lg ${isActive ? 'animate-pulse' : ''}`}>
          {String(beat.beat + 1).padStart(2, '0')}
        </div>
        <div className="flex-1">
          <div className="text-sm uppercase tracking-wide text-slate-500">{beat.duration_s.toFixed(1)}s</div>
          <p className="text-lg font-semibold text-slate-900">{beat.narration}</p>
          <p className="mt-1 text-sm text-slate-600">{beat.visual}</p>
        </div>
      </div>
    </GlowCard>
  );
}

export default TimelineBeatCard;

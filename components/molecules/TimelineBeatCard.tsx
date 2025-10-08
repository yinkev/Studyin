'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import GlowCard from '../atoms/GlowCard';
import type { LessonAnimationBeat } from '../../lib/types/lesson';

interface TimelineBeatCardProps {
  beat: LessonAnimationBeat;
  index: number;
  isActive: boolean;
  onActivate?: (beat: LessonAnimationBeat) => void;
}

export function TimelineBeatCard({ beat, index, isActive, onActivate }: TimelineBeatCardProps) {
  // Declarative animation via Motion

  useEffect(() => {
    if (isActive && onActivate) {
      onActivate(beat);
    }
  }, [isActive, beat, onActivate]);

  return (
    <GlowCard
      variant={isActive ? 'flow' : 'default'}
      glowColor={isActive ? 'rgba(61, 192, 207, 0.45)' : undefined}
      delayMs={80 * index}
    >
      <motion.div
        style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
        animate={{ scale: isActive ? 1.02 : 1 }}
        transition={{ duration: isActive ? 0.6 : 0.3, ease: [0.45, 0, 0.55, 1] }}
      >
        <motion.div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '3rem',
            height: '3rem',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            backgroundColor: 'var(--md-sys-color-secondary-container)',
            color: 'var(--md-sys-color-on-secondary-container)',
            boxShadow: 'var(--md-sys-elevation-2)',
            fontWeight: 800,
            fontSize: '1.25rem',
          }}
          animate={isActive ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.8, repeat: isActive ? Infinity : 0, repeatType: 'reverse' }}
        >
          {String(beat.beat + 1).padStart(2, '0')}
        </motion.div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--md-sys-color-secondary)' }}>
            {beat.duration_s.toFixed(1)}s
          </div>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>{beat.narration}</p>
          <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--md-sys-color-on-surface-variant)' }}>{beat.visual}</p>
        </div>
      </motion.div>
    </GlowCard>
  );
}

export default TimelineBeatCard;

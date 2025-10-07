'use client';

import { PropsWithChildren, useEffect, useRef } from 'react';
import { animate as anime } from "animejs";
import clsx from 'clsx';

interface GlowCardProps {
  className?: string;
  glowColor?: string;
  delayMs?: number;
}

export function GlowCard({
  className,
  glowColor = 'rgba(59, 130, 246, 0.35)',
  delayMs = 0,
  children
}: PropsWithChildren<GlowCardProps>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;
    const animation = anime(element, {
      opacity: { from: 0, to: 1 },
      translateY: { from: 24, to: 0 },
      duration: 900,
      delay: delayMs,
      ease: 'outExpo'
    });
    return () => {
      animation.pause();
    };
  }, [glowColor, delayMs]);

  return (
    <div
      ref={ref}
      className={clsx(
        'relative overflow-hidden rounded-3xl border border-white/10 bg-white/80 backdrop-blur-lg shadow-lg',
        'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/30 before:to-white/5 before:opacity-70 before:pointer-events-none',
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default GlowCard;

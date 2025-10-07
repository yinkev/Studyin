'use client';

/**
 * LevelUpBurst - MAX GRAPHICS Level Up Animation
 *
 * Full-screen celebration when player levels up:
 * - Confetti explosion
 * - Flash effect
 * - Level badge animation
 * - XP numbers floating up
 */

import { useEffect, useRef } from 'react';
import { animate as anime } from 'animejs';

interface LevelUpBurstProps {
  /** New level achieved */
  level: number;
  /** Callback when animation completes */
  onComplete?: () => void;
}

export function LevelUpBurst({ level, onComplete }: LevelUpBurstProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !badgeRef.current) return;

    const container = containerRef.current;
    const badge = badgeRef.current;

    // Flash effect
    anime(container, {
      opacity: { to: 1 },
      duration: 200,
      ease: 'outQuad',
    });

    // Badge animation
    anime(badge, {
      scale: { from: 0, to: 1 },
      rotate: { from: 0, to: 360 },
      duration: 1000,
      ease: 'outElastic',
    });

    // Create confetti particles
    const confettiCount = 50;
    const colors = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#f87171'];

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'absolute w-2 h-2 rounded-full';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = '50%';
      confetti.style.top = '50%';
      container.appendChild(confetti);

      const angle = (Math.PI * 2 * i) / confettiCount;
      const velocity = 200 + Math.random() * 200;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity;

      anime(confetti, {
        translateX: { to: tx },
        translateY: { to: ty },
        scale: { from: 1, to: 0 },
        opacity: { from: 1, to: 0 },
        rotate: { to: Math.random() * 720 },
        duration: 1500 + Math.random() * 500,
        ease: 'outQuad',
        onComplete: () => confetti.remove(),
      });
    }

    // XP text animation
    const xpText = container.querySelector('.xp-text');
    if (xpText) {
      anime(xpText as HTMLElement, {
        translateY: { from: -50, to: 0 },
        opacity: { from: 0, to: 1 },
        scale: { from: 0.5, to: 1 },
        duration: 800,
        ease: 'outBack',
        delay: 500,
      });
    }

    // Auto-dismiss after 3s
    const timeout = setTimeout(() => {
      anime(container, {
        opacity: { from: 1, to: 0 },
        duration: 500,
        ease: 'outQuad',
        onComplete: () => onComplete?.(),
      });
    }, 3000);

    return () => clearTimeout(timeout);
  }, [level, onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
      style={{
        background: 'radial-gradient(circle, rgba(167, 139, 250, 0.2) 0%, transparent 70%)',
      }}
    >
      {/* Level Badge */}
      <div
        ref={badgeRef}
        className="level-badge"
        style={{
          width: '200px',
          height: '200px',
          fontSize: '4rem',
        }}
      >
        <span className="font-black text-white z-10 tabular-nums">{level}</span>
      </div>

      {/* Level Up Text */}
      <div className="xp-text absolute top-1/3 left-1/2 -translate-x-1/2 text-center">
        <div className="text-6xl font-black holographic mb-4">LEVEL UP!</div>
        <div className="text-2xl font-bold accent-mastery">
          You are now <span className="holographic">Level {level}</span>
        </div>
      </div>
    </div>
  );
}

export default LevelUpBurst;

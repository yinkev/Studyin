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
import { animate } from 'motion/react';

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
    animate(container, { opacity: [0, 1] }, { duration: 0.2, easing: [0.19, 1, 0.22, 1] });

    // Badge animation
    animate(badge, { scale: [0, 1], rotate: [0, 360] }, { duration: 1.0, easing: [0.34, 1.56, 0.64, 1] });

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

      const anim = animate(confetti, { x: tx, y: ty, scale: [1, 0], opacity: [1, 0], rotate: Math.random() * 720 }, {
        duration: (1500 + Math.random() * 500) / 1000,
        easing: [0.19, 1, 0.22, 1],
      });
      (Array.isArray(anim) ? anim.map(a => a.finished) : [anim.finished]).forEach(p => p.then(() => confetti.remove()));
    }

    // XP text animation
    const xpText = container.querySelector('.xp-text');
    if (xpText) {
      animate(xpText as HTMLElement, { y: [-50, 0], opacity: [0, 1], scale: [0.5, 1] }, { duration: 0.8, easing: [0.34, 1.56, 0.64, 1], delay: 0.5 });
    }

    // Auto-dismiss after 3s
    const timeout = setTimeout(() => {
      const anim = animate(container, { opacity: [1, 0] }, { duration: 0.5, easing: [0.19, 1, 0.22, 1] });
      const finished = Array.isArray(anim) ? Promise.all(anim.map(a => a.finished)) : anim.finished;
      Promise.resolve(finished).then(() => onComplete?.());
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

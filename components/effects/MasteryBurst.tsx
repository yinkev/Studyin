'use client';

/**
 * Mastery Burst Effect — MAX GRAPHICS MODE
 * Explosive particle animation when answering correctly
 * More intense than confetti for mastery moments
 * Uses anime.js + canvas for MAX PERFORMANCE
 */

import { useEffect, useRef } from 'react';
import { animate as anime } from "animejs";

interface MasteryBurstProps {
  /** Trigger burst when true */
  trigger: boolean;
  /** Origin point (defaults to center) */
  origin?: { x: number; y: number };
  /** Number of particles */
  particleCount?: number;
  /** Burst intensity: 'medium' | 'high' | 'extreme' */
  intensity?: 'medium' | 'high' | 'extreme';
  /** Color palette */
  colors?: string[];
  /** Callback when animation completes */
  onComplete?: () => void;
}

export function MasteryBurst({
  trigger,
  origin,
  particleCount = 80,
  intensity = 'high',
  colors = ['#58CC02', '#89E219', '#1CB0F6', '#0891b2', '#FFC800', '#FFD43B'],
  onComplete,
}: MasteryBurstProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trigger || !containerRef.current) return;

    const container = containerRef.current;
    const particles: HTMLDivElement[] = [];

    // Origin point
    const originX = origin?.x ?? window.innerWidth / 2;
    const originY = origin?.y ?? window.innerHeight / 2;

    // Intensity multipliers
    const intensityMap = {
      medium: { velocity: 500, size: 1, duration: 1800 },
      high: { velocity: 700, size: 1.3, duration: 2200 },
      extreme: { velocity: 1000, size: 1.6, duration: 2800 },
    };

    const config = intensityMap[intensity];

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute';

      const size = (Math.random() * 10 + 6) * config.size;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      particle.style.borderRadius = Math.random() > 0.3 ? '50%' : '0';
      particle.style.left = `${originX}px`;
      particle.style.top = `${originY}px`;
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '100';

      // Random glow effect
      if (Math.random() > 0.5) {
        particle.style.boxShadow = `0 0 ${size * 2}px ${colors[Math.floor(Math.random() * colors.length)]}`;
      }

      container.appendChild(particle);
      particles.push(particle);
    }

    // Explosive radial animation
    anime({
      targets: particles,
      translateX: () => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * config.velocity + config.velocity * 0.3;
        return Math.cos(angle) * distance;
      },
      translateY: () => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * config.velocity + config.velocity * 0.3;
        // Slight upward bias for more dynamic feel
        return Math.sin(angle) * distance - Math.random() * 100;
      },
      rotate: () => Math.random() * 1440 - 720, // Multiple spins
      scale: [1, Math.random() * 0.5 + 0.3],
      opacity: [
        { value: 1, duration: config.duration * 0.2 },
        { value: 0, duration: config.duration * 0.8 },
      ],
      ease: 'easeOutCubic',
      duration: config.duration,
      delay: (anime as any).stagger ? (anime as any).stagger(8) : 0,
      onComplete: () => {
        // Cleanup
        particles.forEach((p) => p.remove());
        if (onComplete) onComplete();
      },
    });

    // Add radial shockwave
    const shockwave = document.createElement('div');
    shockwave.className = 'absolute rounded-full border-4 pointer-events-none';
    shockwave.style.left = `${originX}px`;
    shockwave.style.top = `${originY}px`;
    shockwave.style.borderColor = colors[0];
    shockwave.style.opacity = '0.6';
    shockwave.style.zIndex = '99';
    container.appendChild(shockwave);

    anime({
      targets: shockwave,
      width: [0, 400],
      height: [0, 400],
      translateX: [0, -200],
      translateY: [0, -200],
      opacity: [0.6, 0],
      ease: 'easeOutExpo',
      duration: 800,
      onComplete: () => shockwave.remove(),
    });
  }, [trigger, origin, particleCount, intensity, colors, onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      aria-hidden="true"
    />
  );
}

// Star burst variant (more focused, less scattered)
export function StarBurst({
  trigger,
  origin,
  onComplete,
}: {
  trigger: boolean;
  origin?: { x: number; y: number };
  onComplete?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trigger || !containerRef.current) return;

    const container = containerRef.current;
    const starCount = 12;
    const stars: HTMLDivElement[] = [];

    const originX = origin?.x ?? window.innerWidth / 2;
    const originY = origin?.y ?? window.innerHeight / 2;

    // Create star rays
    for (let i = 0; i < starCount; i++) {
      const angle = (i / starCount) * Math.PI * 2;
      const star = document.createElement('div');
      star.className = 'absolute';
      star.style.width = '6px';
      star.style.height = '40px';
      star.style.background = 'linear-gradient(180deg, #FFC800 0%, transparent 100%)';
      star.style.left = `${originX}px`;
      star.style.top = `${originY}px`;
      star.style.transformOrigin = 'center center';
      star.style.transform = `rotate(${(angle * 180) / Math.PI}deg)`;
      star.style.pointerEvents = 'none';
      star.style.zIndex = '100';
      star.style.boxShadow = '0 0 20px #FFC800';

      container.appendChild(star);
      stars.push(star);
    }

    anime({
      targets: stars,
      scaleY: [0, 1.5, 0],
      opacity: [0, 1, 0],
      ease: 'easeOutExpo',
      duration: 1200,
      delay: (anime as any).stagger ? (anime as any).stagger(40) : 0,
      onComplete: () => {
        stars.forEach((s) => s.remove());
        if (onComplete) onComplete();
      },
    });
  }, [trigger, origin, onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      aria-hidden="true"
    />
  );
}

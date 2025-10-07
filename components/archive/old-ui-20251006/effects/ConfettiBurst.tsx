'use client';

/**
 * Confetti Burst Effect
 * Triggers 50+ colorful particles on click/achievement unlock
 * Uses anime.js for smooth physics-based animation
 */

import { useEffect, useRef } from 'react';
import { animate as anime } from "animejs";

interface ConfettiBurstProps {
  trigger: boolean;
  onComplete?: () => void;
  particleCount?: number;
  colors?: string[];
  origin?: { x: number; y: number };
}

export function ConfettiBurst({
  trigger,
  onComplete,
  particleCount = 50,
  colors = ['#58CC02', '#1CB0F6', '#FFC800', '#FF4B4B'],
  origin
}: ConfettiBurstProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trigger || !containerRef.current) return;

    const container = containerRef.current;
    const particles: HTMLDivElement[] = [];

    // Get origin point (center of screen if not provided)
    const originX = origin?.x ?? window.innerWidth / 2;
    const originY = origin?.y ?? window.innerHeight / 2;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute';
      particle.style.width = `${Math.random() * 8 + 4}px`;
      particle.style.height = particle.style.width;
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      particle.style.left = `${originX}px`;
      particle.style.top = `${originY}px`;
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '100';
      container.appendChild(particle);
      particles.push(particle);
    }

    // Animate particles
    anime({
      targets: particles,
      translateX: () => (Math.random() - 0.5) * 600,
      translateY: () => {
        const angle = Math.random() * Math.PI - Math.PI / 2; // -90° to +90°
        const velocity = Math.random() * 400 + 200;
        return Math.sin(angle) * velocity;
      },
      rotate: () => Math.random() * 720 - 360,
      opacity: [1, 0],
      scale: [1, 0.3],
      ease: 'easeOutCubic',
      duration: 2000,
      delay: (anime as any).stagger ? (anime as any).stagger(10) : 0,
      onComplete: () => {
        // Cleanup
        particles.forEach((p) => p.remove());
        if (onComplete) onComplete();
      }
    });
  }, [trigger, particleCount, colors, origin, onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      aria-hidden="true"
    />
  );
}

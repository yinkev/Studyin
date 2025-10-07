'use client';

/**
 * Hero Section — MAX GRAPHICS MODE
 * Features:
 * - Animated gradient text with letter-by-letter reveal
 * - Particle field background
 * - Floating mascot with confetti on click
 * - Glow pulse CTA button
 */

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { animate as anime } from "animejs";
import { ParticleField } from '../effects/ParticleField';
import { ConfettiBurst } from '../effects/ConfettiBurst';
import Mascot from '../Mascot';

export function HeroSection() {
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [confettiOrigin, setConfettiOrigin] = useState({ x: 0, y: 0 });
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const mascotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate headline letters on mount
    if (headlineRef.current) {
      const letters = headlineRef.current.querySelectorAll('.letter');
      anime(letters, {
        translateY: { from: 40, to: 0 },
        opacity: { from: 0, to: 1 },
        scale: { from: 0.8, to: 1 },
        ease: 'outExpo',
        duration: 800,
        delay: (anime as any).stagger ? (anime as any).stagger(30) : 0,
      });
    }

    // Animate mascot float
    if (mascotRef.current) {
      anime(mascotRef.current, {
        translateY: { from: -8, to: 8 },
        alternate: true,
        loop: true,
        ease: 'inOutSine',
        duration: 3000,
      });
    }
  }, []);

  const handleMascotClick = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setConfettiOrigin({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    });
    setConfettiTrigger(true);

    // Bounce animation
    anime(mascotRef.current, {
      scale: [{ to: 1.2 }, { to: 1 }],
      rotate: { from: 0, to: 360 },
      ease: 'outExpo',
      duration: 600,
    });

    setTimeout(() => setConfettiTrigger(false), 100);
  };

  const splitText = (text: string) => {
    return text.split('').map((char, i) => (
      <span key={i} className="letter inline-block" style={{ opacity: 0 }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient">
      {/* Particle field background */}
      <ParticleField particleCount={300} color="#58CC02" opacity={0.4} speed={0.0008} />

      {/* Confetti burst */}
      <ConfettiBurst
        trigger={confettiTrigger}
        origin={confettiOrigin}
        particleCount={60}
      />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Floating Mascot */}
        <div
          ref={mascotRef}
          onClick={handleMascotClick}
          className="w-32 h-32 mx-auto mb-8 cursor-pointer transform hover:scale-110 transition-transform"
          role="button"
          aria-label="Click for confetti!"
        >
          <Mascot />
        </div>

        {/* Animated Headline */}
        <h1
          ref={headlineRef}
          className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
        >
          {splitText('Master medical knowledge with ')}{' '}
          <span className="gradient-text neon-green inline-block">
            {splitText('confidence')}
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto">
          Playful, focused, and <span className="text-blue-400 font-bold">fast</span>.
          Learn with evidence-anchored practice and transparent analytics powered by{' '}
          <span className="gradient-text font-bold">AI magic</span>.
        </p>

        {/* CTA Button */}
        <Link
          href="/study"
          className="inline-block px-12 py-5 text-2xl font-bold text-white rounded-3xl transition-all duration-300 shimmer glow-pulse"
          style={{
            background: 'linear-gradient(135deg, #58CC02 0%, #89E219 100%)',
            boxShadow: '0 8px 32px rgba(88, 204, 2, 0.4)'
          }}
        >
          Start Learning Journey 🚀
        </Link>

        {/* Stats pills */}
        <div className="mt-16 flex flex-wrap justify-center gap-6">
          {[
            { label: 'AI-Powered OCR', icon: '🧠', color: '#58CC02' },
            { label: 'Adaptive MCQs', icon: '🎯', color: '#1CB0F6' },
            { label: 'Evidence-Based', icon: '📚', color: '#FFC800' }
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass px-6 py-3 rounded-full flex items-center gap-3 hover:scale-105 transition-transform"
              style={{ borderColor: stat.color }}
            >
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-sm font-semibold text-white">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

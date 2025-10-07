'use client';

/**
 * Hero Section — Clinical Clarity Design
 * Features:
 * - Professional healthcare gradient
 * - Clean typography
 * - Direct CTAs
 * - Trust-building stats
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { animate as anime } from "animejs";

export function HeroSection() {
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Gentle fade-in animation for headline
    if (headlineRef.current) {
      anime(headlineRef.current, {
        translateY: { from: 20, to: 0 },
        opacity: { from: 0, to: 1 },
        ease: 'outQuad',
        duration: 600,
      });
    }
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-surface-bg0 via-surface-bg1 to-surface-bg0">
      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Professional Icon */}
        <div className="w-20 h-20 mx-auto mb-8 flex items-center justify-center rounded-2xl shadow-clinical-lg"
             style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>

        {/* Animated Headline */}
        <h1
          ref={headlineRef}
          className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight"
          style={{ opacity: 0, color: 'var(--text-high)' }}
        >
          Master medical knowledge with{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            confidence
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto" style={{ color: 'var(--text-med)' }}>
          Evidence-anchored practice with transparent analytics.{' '}
          <span className="font-semibold" style={{ color: 'var(--brand-primary)' }}>
            Professional. Focused. Effective.
          </span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Link
            href="/study"
            className="clinical-button px-8 py-4 text-lg font-bold shadow-clinical-md"
          >
            Start Studying
          </Link>
          <Link
            href="/upload"
            className="px-8 py-4 text-lg font-bold rounded-lg border-2 transition-clinical"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--text-high)',
              background: 'transparent'
            }}
          >
            Upload Content
          </Link>
        </div>

        {/* Trust stats */}
        <div className="mt-16 flex flex-wrap justify-center gap-6">
          {[
            { label: 'AI-Powered OCR', icon: '📄', desc: 'Accurate extraction' },
            { label: 'Adaptive Learning', icon: '🎯', desc: 'Personalized practice' },
            { label: 'Evidence-Based', icon: '📚', desc: 'Medical accuracy' }
          ].map((stat) => (
            <div
              key={stat.label}
              className="clinical-card px-6 py-4 flex items-center gap-4 min-w-[200px]"
            >
              <span className="text-3xl">{stat.icon}</span>
              <div className="text-left">
                <div className="font-semibold" style={{ color: 'var(--text-high)' }}>{stat.label}</div>
                <div className="text-sm" style={{ color: 'var(--text-low)' }}>{stat.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

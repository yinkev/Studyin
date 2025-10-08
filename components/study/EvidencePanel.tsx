'use client';

/**
 * Evidence Panel — MAX GRAPHICS MODE
 * Lazy-loaded panel showing slide previews and extracted text from source PDFs
 * Displays diagrams + text from Gemini OCR
 */

import { useState, useEffect, useRef, Suspense } from 'react';
import { animate, stagger } from 'motion/react';
import Image from 'next/image';

export interface EvidenceSlide {
  /** Slide number from PDF */
  slideNumber: number;
  /** Title extracted from OCR */
  title: string;
  /** Text content */
  text: string;
  /** Diagram descriptions from Gemini */
  diagrams: Array<{
    label: string;
    description: string;
  }>;
  /** Optional: path to slide image/thumbnail */
  imagePath?: string;
}

export interface EvidenceData {
  /** Source file name */
  sourceFile: string;
  /** Learning objective ID */
  loId: string;
  /** Array of slides with evidence */
  slides: EvidenceSlide[];
}

interface EvidencePanelProps {
  /** Evidence data (lazy-loaded) */
  evidence: EvidenceData | null;
  /** Whether panel is open */
  isOpen: boolean;
  /** Callback when panel closes */
  onClose: () => void;
  /** Callback when evidence is viewed (for analytics) */
  onEvidenceViewed?: (slideNumber: number) => void;
}

export function EvidencePanel({ evidence, isOpen, onClose, onEvidenceViewed }: EvidencePanelProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && panelRef.current) {
      // Animate panel slide-in
      // @ts-expect-error Motion accepts transform keyframes on HTMLElement targets
      animate(panelRef.current, { transform: ['translateX(100%)', 'translateX(0%)'] }, { duration: 0.4, easing: [0.19, 1, 0.22, 1] });

      // Animate slide cards
      const cards = panelRef.current.querySelectorAll('.evidence-slide-card');
      // @ts-expect-error NodeList targets + translate keyframes are supported at runtime
      animate(cards, { opacity: [0, 1], y: [20, 0] }, {
        delay: stagger(0.06, { start: 0.2 } as any),
        duration: 0.4,
        easing: [0.19, 1, 0.22, 1],
      });
    }
  }, [isOpen]);

  useEffect(() => {
    // Track evidence viewed
    if (isOpen && evidence && evidence.slides[activeSlide]) {
      onEvidenceViewed?.(evidence.slides[activeSlide].slideNumber);
    }
  }, [activeSlide, isOpen, evidence, onEvidenceViewed]);

  useEffect(() => {
    // Close on Esc
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }

      // Navigate slides with arrow keys
      if (isOpen && evidence) {
        if (e.key === 'ArrowRight' && activeSlide < evidence.slides.length - 1) {
          e.preventDefault();
          setActiveSlide((prev) => prev + 1);
        }
        if (e.key === 'ArrowLeft' && activeSlide > 0) {
          e.preventDefault();
          setActiveSlide((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeSlide, evidence, onClose]);

  if (!isOpen || !evidence || evidence.slides.length === 0) return null;

  const currentSlide = evidence.slides[activeSlide];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.3s ease' }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-screen w-full max-w-2xl glass-dark border-l border-white/20 z-[91] overflow-hidden"
        style={{
          boxShadow: '-12px 0 48px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-black gradient-text">Evidence Panel</h2>
            <p className="text-sm text-slate-400 mt-1">{evidence.sourceFile}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white text-xl"
            aria-label="Close evidence"
          >
            ✕
          </button>
        </div>

        {/* Slide Navigator */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/10 overflow-x-auto">
          {evidence.slides.map((slide, index) => (
            <button
              key={slide.slideNumber}
              onClick={() => setActiveSlide(index)}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                activeSlide === index
                  ? 'bg-gradient-to-r from-green-500 to-cyan-500 text-white shadow-lg scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              Slide {slide.slideNumber}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="h-[calc(100vh-180px)] overflow-y-auto p-6 space-y-6">
          {/* Slide Preview (if available) */}
          {currentSlide.imagePath && (
            <div className="evidence-slide-card glow-card p-4 rounded-3xl overflow-hidden">
              <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden">
                <Suspense
                  fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-slate-400">Loading slide preview...</div>
                    </div>
                  }
                >
                  <Image
                    src={currentSlide.imagePath}
                    alt={`Slide ${currentSlide.slideNumber}: ${currentSlide.title}`}
                    fill
                    className="object-contain"
                    onLoad={() => setImageLoaded(true)}
                  />
                </Suspense>
              </div>
            </div>
          )}

          {/* Title & Text */}
          <div className="evidence-slide-card space-y-4">
            <div className="glow-card p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                  {currentSlide.slideNumber}
                </div>
                <h3 className="text-xl font-bold text-white">{currentSlide.title}</h3>
              </div>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{currentSlide.text}</p>
            </div>
          </div>

          {/* Diagrams */}
          {currentSlide.diagrams.length > 0 && (
            <div className="evidence-slide-card space-y-3">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🖼️</span>
                Diagrams & Figures
              </h4>
              {currentSlide.diagrams.map((diagram, index) => (
                <div
                  key={index}
                  className="glow-card p-5 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-colors"
                >
                  <div className="text-sm font-semibold text-blue-400 mb-2">{diagram.label}</div>
                  <div className="text-sm text-slate-300">{diagram.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent border-t border-white/10">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveSlide((prev) => Math.max(0, prev - 1))}
              disabled={activeSlide === 0}
              className="px-6 py-3 rounded-2xl font-bold text-white bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Previous
            </button>

            <div className="text-sm text-slate-400">
              {activeSlide + 1} of {evidence.slides.length}
            </div>

            <button
              onClick={() => setActiveSlide((prev) => Math.min(evidence.slides.length - 1, prev + 1))}
              disabled={activeSlide === evidence.slides.length - 1}
              className="px-6 py-3 rounded-2xl font-bold text-white bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>

          <div className="text-xs text-center text-slate-500 mt-3">
            Use <kbd className="px-2 py-1 rounded bg-white/10 font-mono mx-1">←</kbd>
            <kbd className="px-2 py-1 rounded bg-white/10 font-mono mx-1">→</kbd> to navigate ·{' '}
            <kbd className="px-2 py-1 rounded bg-white/10 font-mono mx-1">Esc</kbd> to close
          </div>
        </div>
      </div>
    </>
  );
}

// Loading skeleton for lazy loading
export function EvidencePanelSkeleton() {
  return (
    <div className="fixed top-0 right-0 h-screen w-full max-w-2xl glass-dark border-l border-white/10 z-[91] p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-white/10 rounded w-1/2" />
        <div className="h-4 bg-white/10 rounded w-1/3" />
        <div className="space-y-3">
          <div className="h-64 bg-white/10 rounded-3xl" />
          <div className="h-32 bg-white/10 rounded-3xl" />
          <div className="h-32 bg-white/10 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

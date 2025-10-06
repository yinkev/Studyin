'use client';

/**
 * Keyboard Shortcuts Overlay — MAX GRAPHICS MODE
 * Press ? to show, Esc to close
 * Displays all available keyboard shortcuts for study mode
 */

import { useEffect, useState, useRef } from 'react';
import { animate as anime } from "animejs";

export interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: 'navigation' | 'answers' | 'actions' | 'system';
}

const defaultShortcuts: KeyboardShortcut[] = [
  // Answers
  { keys: ['1', '2', '3', '4', '5'], description: 'Select answer choice A-E', category: 'answers' },
  { keys: ['Enter', '↵'], description: 'Submit answer / Continue', category: 'answers' },

  // Navigation
  { keys: ['→', 'Right'], description: 'Next question', category: 'navigation' },
  { keys: ['←', 'Left'], description: 'Previous question (if allowed)', category: 'navigation' },
  { keys: ['Tab'], description: 'Cycle through choices', category: 'navigation' },

  // Actions
  { keys: ['E'], description: 'Toggle evidence panel', category: 'actions' },
  { keys: ['R'], description: 'Flag for review', category: 'actions' },
  { keys: ['S'], description: 'Show stats overlay', category: 'actions' },
  { keys: ['H'], description: 'Toggle hint', category: 'actions' },

  // System
  { keys: ['?'], description: 'Toggle this help', category: 'system' },
  { keys: ['Esc'], description: 'Close overlay', category: 'system' },
  { keys: ['Cmd', 'K'], description: 'Quick command palette', category: 'system' },
];

interface KeyboardShortcutsOverlayProps {
  /** Custom shortcuts (merges with defaults) */
  shortcuts?: KeyboardShortcut[];
  /** Whether to show on mount */
  initialVisible?: boolean;
  /** Callback when visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
}

export function KeyboardShortcutsOverlay({
  shortcuts = defaultShortcuts,
  initialVisible = false,
  onVisibilityChange,
}: KeyboardShortcutsOverlayProps) {
  const [visible, setVisible] = useState(initialVisible);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle on ?
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setVisible((prev) => {
          const next = !prev;
          onVisibilityChange?.(next);
          return next;
        });
      }

      // Close on Esc
      if (e.key === 'Escape' && visible) {
        e.preventDefault();
        setVisible(false);
        onVisibilityChange?.(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onVisibilityChange]);

  useEffect(() => {
    if (visible && overlayRef.current) {
      // Animate in
      anime({ targets: overlayRef.current, opacity: [0, 1], scale: [0.95, 1], duration: 300, ease: 'easeOutExpo' });

      // Stagger animate categories
      const categories = overlayRef.current.querySelectorAll('.shortcut-category');
      anime({
        targets: categories,
        translateY: [20, 0],
        opacity: [0, 1],
        delay: (anime as any).stagger ? (anime as any).stagger(80) : 0,
        duration: 400,
        ease: 'easeOutExpo',
      });
    }
  }, [visible]);

  if (!visible) return null;

  const categoryLabels = {
    answers: { icon: '✍️', label: 'Answer Selection', color: '#58CC02' },
    navigation: { icon: '🧭', label: 'Navigation', color: '#1CB0F6' },
    actions: { icon: '⚡', label: 'Actions', color: '#FFC800' },
    system: { icon: '⚙️', label: 'System', color: '#CE82FF' },
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100]"
        onClick={() => {
          setVisible(false);
          onVisibilityChange?.(false);
        }}
        style={{ animation: 'fadeIn 0.2s ease' }}
      />

      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-dark rounded-3xl border border-white/20 p-8 z-[101]"
        style={{
          boxShadow: '0 24px 96px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-black gradient-text mb-2">Keyboard Shortcuts</h2>
            <p className="text-slate-400 text-sm">Master study mode with your keyboard</p>
          </div>
          <button
            onClick={() => {
              setVisible(false);
              onVisibilityChange?.(false);
            }}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white text-2xl"
            aria-label="Close shortcuts"
          >
            ✕
          </button>
        </div>

        {/* Shortcuts Grid */}
        <div className="space-y-6">
          {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((category) => {
            const categoryShortcuts = groupedShortcuts[category];
            if (!categoryShortcuts || categoryShortcuts.length === 0) return null;

            const meta = categoryLabels[category];
            return (
              <div key={category} className="shortcut-category">
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{meta.icon}</span>
                  <h3 className="text-xl font-bold text-white">{meta.label}</h3>
                </div>

                {/* Shortcuts List */}
                <div className="space-y-3">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={`${category}-${index}`}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                    >
                      <div className="text-slate-300">{shortcut.description}</div>
                      <div className="flex items-center gap-2">
                        {shortcut.keys.map((key, keyIndex) => (
                          <kbd
                            key={keyIndex}
                            className="px-3 py-1.5 rounded-lg font-mono font-bold text-sm"
                            style={{
                              background: `linear-gradient(135deg, ${meta.color}30 0%, ${meta.color}10 100%)`,
                              border: `1px solid ${meta.color}40`,
                              color: meta.color,
                              boxShadow: `0 2px 8px ${meta.color}20`,
                            }}
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <div className="text-sm text-slate-400">
            Press{' '}
            <kbd className="px-2 py-1 rounded bg-white/10 text-white font-mono mx-1">?</kbd>
            to toggle · Press{' '}
            <kbd className="px-2 py-1 rounded bg-white/10 text-white font-mono mx-1">Esc</kbd>
            to close
          </div>
        </div>
      </div>
    </>
  );
}

// Export hook for programmatic control
export function useKeyboardShortcuts() {
  const [visible, setVisible] = useState(false);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);
  const toggle = () => setVisible((prev) => !prev);

  return { visible, show, hide, toggle };
}

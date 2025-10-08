'use client';

/**
 * Keyboard Shortcuts Overlay — MAX GRAPHICS MODE
 * Press ? to show, Esc to close
 * Displays all available keyboard shortcuts for study mode
 */

import { useEffect, useState, useRef } from 'react';
import { animate, stagger } from 'motion/react';

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
      animate(overlayRef.current, { opacity: [0, 1], scale: [0.95, 1] }, { duration: 0.3, easing: [0.19, 1, 0.22, 1] });

      // Stagger animate categories
      const categories = overlayRef.current.querySelectorAll('.shortcut-category');
      animate(categories, { y: [20, 0], opacity: [0, 1] }, {
        delay: stagger(0.08),
        duration: 0.4,
        easing: [0.19, 1, 0.22, 1],
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
        className="md3-backdrop"
        onClick={() => {
          setVisible(false);
          onVisibilityChange?.(false);
        }}
        aria-hidden="true"
      />

      {/* Overlay */}
      <div
        ref={overlayRef}
        className="overlay-center md3-surface-container md3-shape-large md3-elevation-3"
        style={{
          padding: '2rem',
          border: '1px solid var(--md-sys-color-outline-variant)',
          boxShadow: 'var(--md-sys-elevation-5)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard Shortcuts"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h2 className="md3-headline-medium" style={{ fontWeight: 900 }}>Keyboard Shortcuts</h2>
            <p className="md3-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Master study mode with your keyboard</p>
          </div>
          <button
            onClick={() => {
              setVisible(false);
              onVisibilityChange?.(false);
            }}
            aria-label="Close shortcuts"
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '9999px',
              background: 'color-mix(in srgb, var(--md-sys-color-surface-container) 80%, transparent)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              color: 'var(--md-sys-color-on-surface)',
              fontSize: '1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Shortcuts Grid */}
        <div className="vstack-6">
          {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((category) => {
            const categoryShortcuts = groupedShortcuts[category];
            if (!categoryShortcuts || categoryShortcuts.length === 0) return null;

            const meta = categoryLabels[category];
            return (
              <div key={category} className="shortcut-category">
                {/* Category Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.75rem' }}>{meta.icon}</span>
                  <h3 className="md3-title-large" style={{ fontWeight: 800 }}>{meta.label}</h3>
                </div>

                {/* Shortcuts List */}
                <div className="vstack-4">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={`${category}-${index}`}
                      className="md3-surface-container md3-shape-large"
                      style={{
                        padding: '1rem',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div className="md3-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{shortcut.description}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {shortcut.keys.map((key, keyIndex) => (
                          <kbd
                            key={keyIndex}
                            className="kbd-md3"
                            style={{
                              color: meta.color,
                              borderColor: 'color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent)'
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
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--md-sys-color-outline-variant)', textAlign: 'center' }}>
          <div className="md3-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Press <kbd className="kbd-md3">?</kbd> to toggle · Press <kbd className="kbd-md3">Esc</kbd> to close
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

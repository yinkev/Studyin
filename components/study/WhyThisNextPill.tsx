'use client';

/**
 * "Why this next" Pill — MAX GRAPHICS MODE
 * Displays transparent engine signals for current item selection
 * Shows: θ̂, SE, blueprint gap, urgency, and selection rationale
 */

import { useState } from 'react';
import { motion } from 'motion/react';

export interface EngineSignals {
  /** Current ability estimate (Rasch θ̂) */
  theta: number;
  /** Standard error of estimate */
  se: number;
  /** Mastery probability: Φ((θ̂ - θ_cut)/SE) */
  masteryProb: number;
  /** Blueprint gap: target_share - current_share */
  blueprintGap: number;
  /** Urgency multiplier: 1 + max(0, days_since_last - 3)/7 */
  urgency: number;
  /** Days since last practice for this LO */
  daysSinceLast: number;
  /** Fisher information at current θ̂ */
  itemInfo: number;
  /** Selection reason (from Thompson Sampling) */
  reason: 'max_utility' | 'blueprint_deficit' | 'high_se' | 'urgency' | 'retention';
  /** Learning objective ID */
  loId: string;
  /** Human-readable LO name */
  loName: string;
}

interface WhyThisNextPillProps {
  signals: EngineSignals;
  /** Optional: show expanded view by default */
  defaultExpanded?: boolean;
}

export function WhyThisNextPill({ signals, defaultExpanded = false }: WhyThisNextPillProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const reasonLabels: Record<EngineSignals['reason'], { text: string; role: 'primary' | 'secondary' | 'tertiary' | 'error'; icon: string }> = {
    max_utility: { text: 'Max SE reduction per min', role: 'primary', icon: '🎯' },
    blueprint_deficit: { text: 'Blueprint gap >5%', role: 'secondary', icon: '📊' },
    high_se: { text: 'Uncertain estimate', role: 'error', icon: '❓' },
    urgency: { text: 'Overdue (>3 days)', role: 'tertiary', icon: '⚡' },
    retention: { text: 'FSRS review due', role: 'secondary', icon: '🔁' },
  };

  const reasonMeta = reasonLabels[signals.reason];

  const roleVar = (role: 'primary' | 'secondary' | 'tertiary' | 'error') => `var(--md-sys-color-${role})`;

  return (
    <div style={{ position: 'relative' }}>
      {/* Compact pill */}
      <md-filled-tonal-button
        onClick={handleToggle}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderRadius: '9999px',
          fontSize: '0.95rem',
          padding: '0.5rem 1rem',
        }}
        aria-expanded={expanded}
      >
        <span style={{ fontSize: '1.25rem' }}>{reasonMeta.icon}</span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>Why this next</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>{reasonMeta.text}</div>
        </div>
        <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '1rem', marginLeft: '0.25rem' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </md-filled-tonal-button>

      {/* Expanded details */}
      {expanded && (
        <motion.div
          id="engine-signals-detail"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '0.75rem',
            width: '24rem',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            color: 'var(--md-sys-color-on-surface)',
            boxShadow: 'var(--md-sys-elevation-3)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            padding: '1.5rem',
            zIndex: 50,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>Engine Signals</h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>{signals.loId}</div>
          </div>

          <div style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '1rem' }}>{signals.loName}</div>

          {/* Key Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            {/* Ability θ̂ */}
            <div className="md3-outlined-surface" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '0.25rem' }}>Ability θ̂</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-primary)' }}>{signals.theta.toFixed(2)}</div>
            </div>

            {/* Standard Error */}
            <div className="md3-outlined-surface" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '0.25rem' }}>SE</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-tertiary)' }}>{signals.se.toFixed(2)}</div>
            </div>

            {/* Mastery Probability */}
            <div className="md3-outlined-surface" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '0.25rem' }}>Mastery P(θ̂ &gt; 0)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-secondary)' }}>{Math.round(signals.masteryProb * 100)}%</div>
            </div>

            {/* Blueprint Gap */}
            <div className="md3-outlined-surface" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '0.25rem' }}>Blueprint Gap</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: Math.abs(signals.blueprintGap) > 0.05 ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-on-surface-variant)' }}>
                {signals.blueprintGap > 0 ? '+' : ''}
                {(signals.blueprintGap * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Urgency & Info */}
          <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Urgency</span>
              <span style={{ fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>{signals.urgency.toFixed(2)}x</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Days since last</span>
              <span style={{ fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>{signals.daysSinceLast}d</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Item info I(θ̂)</span>
              <span style={{ fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>{signals.itemInfo.toFixed(3)}</span>
            </div>
          </div>

          {/* Selection Reason */}
          <div
            style={{
              borderRadius: 'var(--md-sys-shape-corner-large)',
              padding: '1rem',
              border: '1px solid var(--md-sys-color-outline-variant)',
              background: `linear-gradient(135deg, color-mix(in srgb, ${roleVar(reasonMeta.role)} 16%, transparent) 0%, color-mix(in srgb, ${roleVar(reasonMeta.role)} 6%, transparent) 100%)`,
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '0.25rem' }}>Selection Reason</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{reasonMeta.icon}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>{reasonMeta.text}</span>
            </div>
          </div>

          {/* Info note */}
          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center' }}>
            Thompson Sampling × Blueprint Rails × Fatigue‑aware
          </div>
        </motion.div>
      )}
    </div>
  );
}

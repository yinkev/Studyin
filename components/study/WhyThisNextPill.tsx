'use client';

/**
 * "Why this next" Pill — MAX GRAPHICS MODE
 * Displays transparent engine signals for current item selection
 * Shows: θ̂, SE, blueprint gap, urgency, and selection rationale
 */

import { useState } from 'react';
import { animate as anime } from "animejs";

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
    if (!expanded) {
      // Animate expansion (guard reduced motion in caller if needed)
      anime({
        targets: '#engine-signals-detail',
        opacity: [0, 1],
        translateY: [-10, 0],
        duration: 400,
        ease: 'easeOutExpo',
      });
    }
    setExpanded(!expanded);
  };

  const reasonLabels: Record<EngineSignals['reason'], { text: string; color: string; icon: string }> = {
    max_utility: { text: 'Max SE reduction per min', color: '#1CB0F6', icon: '🎯' },
    blueprint_deficit: { text: 'Blueprint gap >5%', color: '#FFC800', icon: '📊' },
    high_se: { text: 'Uncertain estimate', color: '#FF4B4B', icon: '❓' },
    urgency: { text: 'Overdue (>3 days)', color: '#CE82FF', icon: '⚡' },
    retention: { text: 'FSRS review due', color: '#58CC02', icon: '🔁' },
  };

  const reasonMeta = reasonLabels[signals.reason];

  return (
    <div className="relative">
      {/* Compact pill */}
      <button
        onClick={handleToggle}
        className="glass inline-flex items-center gap-3 px-5 py-3 rounded-full hover:scale-105 transition-all duration-300 border border-white/20"
        style={{
          background: 'linear-gradient(135deg, rgba(88, 204, 2, 0.1) 0%, rgba(28, 176, 246, 0.1) 100%)',
          boxShadow: expanded ? '0 8px 24px rgba(88, 204, 2, 0.3)' : '0 4px 12px rgba(88, 204, 2, 0.2)',
        }}
      >
        <span className="text-2xl">{reasonMeta.icon}</span>
        <div className="text-left">
          <div className="text-xs uppercase tracking-wider text-slate-300 font-semibold">Why this next</div>
          <div className="text-sm font-bold text-white">{reasonMeta.text}</div>
        </div>
        <span className="text-slate-300 text-xl ml-2">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div
          id="engine-signals-detail"
          className="absolute top-full left-0 mt-3 w-96 glass-dark p-6 rounded-3xl border border-white/20 z-50"
          style={{ boxShadow: '0 12px 48px rgba(0, 0, 0, 0.6)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Engine Signals</h3>
            <div className="text-xs text-slate-400 font-mono">{signals.loId}</div>
          </div>

          <div className="text-sm text-slate-300 mb-4">{signals.loName}</div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Ability θ̂ */}
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-4">
              <div className="text-xs text-slate-400 mb-1">Ability θ̂</div>
              <div className="text-2xl font-black text-blue-400">{signals.theta.toFixed(2)}</div>
            </div>

            {/* Standard Error */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-4">
              <div className="text-xs text-slate-400 mb-1">SE</div>
              <div className="text-2xl font-black text-purple-400">{signals.se.toFixed(2)}</div>
            </div>

            {/* Mastery Probability */}
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-4">
              <div className="text-xs text-slate-400 mb-1">Mastery P(θ̂ &gt; 0)</div>
              <div className="text-2xl font-black text-green-400">{Math.round(signals.masteryProb * 100)}%</div>
            </div>

            {/* Blueprint Gap */}
            <div
              className={`bg-gradient-to-br rounded-2xl p-4 border ${
                Math.abs(signals.blueprintGap) > 0.05
                  ? 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
                  : 'from-slate-500/20 to-slate-600/20 border-slate-500/30'
              }`}
            >
              <div className="text-xs text-slate-400 mb-1">Blueprint Gap</div>
              <div
                className={`text-2xl font-black ${
                  Math.abs(signals.blueprintGap) > 0.05 ? 'text-yellow-400' : 'text-slate-400'
                }`}
              >
                {signals.blueprintGap > 0 ? '+' : ''}
                {(signals.blueprintGap * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Urgency & Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Urgency</span>
              <span className="font-bold text-white">{signals.urgency.toFixed(2)}x</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Days since last</span>
              <span className="font-bold text-white">{signals.daysSinceLast}d</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Item info I(θ̂)</span>
              <span className="font-bold text-white">{signals.itemInfo.toFixed(3)}</span>
            </div>
          </div>

          {/* Selection Reason */}
          <div
            className="rounded-2xl p-4 border"
            style={{
              background: `linear-gradient(135deg, ${reasonMeta.color}20 0%, ${reasonMeta.color}10 100%)`,
              borderColor: `${reasonMeta.color}40`,
            }}
          >
            <div className="text-xs text-slate-400 mb-1">Selection Reason</div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{reasonMeta.icon}</span>
              <span className="text-sm font-bold text-white">{reasonMeta.text}</span>
            </div>
          </div>

          {/* Info note */}
          <div className="mt-4 text-xs text-slate-500 text-center">
            Thompson Sampling × Blueprint Rails × Fatigue-aware
          </div>
        </div>
      )}
    </div>
  );
}

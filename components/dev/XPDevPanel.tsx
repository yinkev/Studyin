'use client';

/**
 * XPDevPanel - Development Panel for Testing XP System
 *
 * Shows XP controls in dev mode:
 * - Award XP buttons
 * - Reset progress
 * - Simulate level ups
 */

import { useState } from 'react';
import { useXP } from '../XPProvider';
import { XP_REWARDS } from '../../lib/xp-system';

export function XPDevPanel() {
  const { progress, levelInfo, awardXPWithFeedback, resetProgress } = useXP();
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-[999]">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-2 px-3 py-2 rounded-lg glass-max border glow-border-subtle hover:scale-105 transition-all shadow-2xl"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🎮</span>
          <span className="text-xs font-bold">XP Dev</span>
        </div>
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="mission-card p-4 rounded-lg border glow-border bg-secondary/95 backdrop-blur-xl shadow-2xl w-80 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest holographic">XP System</h3>

          {/* Current Stats */}
          <div className="p-3 rounded-lg bg-tertiary/10 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-tertiary">Level:</span>
              <span className="font-bold accent-mastery">{levelInfo.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tertiary">Current XP:</span>
              <span className="font-bold tabular-nums">{levelInfo.currentXP.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tertiary">To Next:</span>
              <span className="font-bold tabular-nums">{levelInfo.xpToNextLevel.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tertiary">Total XP:</span>
              <span className="font-bold accent-trust tabular-nums">{progress.totalXP.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tertiary">Streak:</span>
              <span className="font-bold accent-mastery">{progress.streak} days</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-tertiary font-bold">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => awardXPWithFeedback(XP_REWARDS.QUESTION_CORRECT, 'Correct!')}
                className="neon-button px-3 py-2 rounded-lg text-xs font-bold"
              >
                +10 XP
              </button>
              <button
                onClick={() => awardXPWithFeedback(XP_REWARDS.QUESTION_CORRECT_FAST, 'Fast!')}
                className="neon-button px-3 py-2 rounded-lg text-xs font-bold"
              >
                +15 XP
              </button>
              <button
                onClick={() => awardXPWithFeedback(XP_REWARDS.LESSON_COMPLETE, 'Complete!')}
                className="neon-button px-3 py-2 rounded-lg text-xs font-bold"
              >
                +100 XP
              </button>
              <button
                onClick={() => awardXPWithFeedback(XP_REWARDS.LESSON_PERFECT, 'Perfect!')}
                className="neon-button px-3 py-2 rounded-lg text-xs font-bold"
              >
                +200 XP
              </button>
            </div>
          </div>

          {/* Big Actions */}
          <div className="space-y-2">
            <button
              onClick={() => {
                // Award enough XP to level up
                const xpNeeded = levelInfo.xpToNextLevel - levelInfo.currentXP + 100;
                awardXPWithFeedback(xpNeeded, 'LEVEL UP TEST!');
              }}
              className="w-full neon-button px-4 py-2 rounded-lg text-xs font-bold bg-accent-mastery/20 border border-accent-mastery/30"
            >
              🚀 Trigger Level Up
            </button>

            <button
              onClick={() => {
                if (confirm('Reset all XP progress?')) {
                  resetProgress();
                }
              }}
              className="w-full px-4 py-2 rounded-lg text-xs font-bold bg-error/20 border border-error/30 text-error hover:bg-error/30 transition-colors"
            >
              🔄 Reset Progress
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default XPDevPanel;

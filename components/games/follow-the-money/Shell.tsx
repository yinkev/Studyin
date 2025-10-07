'use client';

/**
 * Follow The Money - Shell Component
 * Individual shell button with states and accessibility
 */

import { type ShellState } from '@/lib/games/follow-the-money/types';
import { Card } from '@mantine/core';
import { motion } from 'framer-motion';
import { forwardRef } from 'react';

interface ShellProps {
  /** Shell index (0-based) */
  index: number;
  /** Total number of shells */
  total: number;
  /** Current visual state */
  state: ShellState;
  /** Whether shell has the money (only revealed after selection) */
  hasMoney?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Whether shell is selectable */
  disabled?: boolean;
  /** Position for animations */
  position?: { x: number; y: number };
}

/**
 * Shell component with emoji icons
 */
export const Shell = forwardRef<HTMLDivElement, ShellProps>(
  (
    {
      index,
      total,
      state,
      hasMoney = false,
      onClick,
      disabled = false,
      position = { x: 0, y: 0 },
    },
    ref
  ) => {
    // Determine shell appearance based on state
    const getShellColor = () => {
      switch (state) {
        case 'selected':
          return 'from-primary/30 to-primary/50';
        case 'revealed-correct':
          return 'from-success/30 to-success/50';
        case 'revealed-wrong':
          return 'from-danger/30 to-danger/50';
        case 'shuffling':
          return 'from-default/20 to-default/40';
        case 'idle':
        default:
          return 'from-default/10 to-default/30';
      }
    };

    const isRevealed =
      state === 'revealed-correct' || state === 'revealed-wrong';

    return (
      <motion.div
        ref={ref}
        id={`shell-${index}`}
        className="shell-container"
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
        }}
        initial={{ scale: 1 }}
        animate={{
          scale: state === 'selected' ? 1.1 : 1,
          rotate: state === 'revealed-wrong' ? [0, -5, 5, -5, 5, 0] : 0,
        }}
        transition={{
          scale: { duration: 0.2 },
          rotate: { duration: 0.5 },
        }}
      >
        <button
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-pressed={state === 'selected'}
          aria-label={`Shell ${index + 1} of ${total}`}
          aria-disabled={disabled}
          onClick={disabled ? undefined : onClick}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onClick?.();
            }
          }}
          disabled={disabled}
          className="focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 rounded-2xl transition-all"
        >
          <Card
            className={`
              w-24 h-24 md:w-32 md:h-32
              bg-gradient-to-br ${getShellColor()}
              backdrop-blur-sm
              border-2 border-default/20
              ${!disabled && state === 'idle' ? 'hover:border-primary/40 hover:scale-105 cursor-pointer' : ''}
              transition-all duration-200
              flex items-center justify-center
            `}
            padding="0"
          >
            {/* Shell Icon Placeholder */}
            <div className="text-4xl md:text-6xl opacity-60">
              {isRevealed && hasMoney ? '💰' : '🐚'}
            </div>
          </Card>
        </button>

        {/* Money indicator (only shown when revealed) */}
        {isRevealed && hasMoney && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="absolute -top-2 -right-2 bg-warning text-warning-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg"
          >
            ✓
          </motion.div>
        )}
      </motion.div>
    );
  }
);

Shell.displayName = 'Shell';

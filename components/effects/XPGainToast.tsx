'use client';

/**
 * XPGainToast - MAX GRAPHICS XP Notification
 *
 * Animated toast showing XP gained
 * - Slides in from top-right
 * - Glowing effect
 * - Auto-dismisses
 */

import { useEffect, useRef } from 'react';
import { animate } from 'motion/react';

interface XPGainToastProps {
  /** Amount of XP gained */
  amount: number;
  /** Reason for XP (optional) */
  reason?: string;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Duration in ms (default: 2000) */
  duration?: number;
}

export function XPGainToast({ amount, reason, onDismiss, duration = 2000 }: XPGainToastProps) {
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toastRef.current) return;

    const toast = toastRef.current;

    // Slide in from right
    animate(toast, { x: [100, 0], opacity: [0, 1] }, { duration: 0.4, easing: [0.34, 1.56, 0.64, 1] });

    // Pulse glow
    animate(
      toast,
      { boxShadow: ['0 0 20px rgba(167, 139, 250, 0.5)', '0 0 40px rgba(167, 139, 250, 0.8)', '0 0 20px rgba(167, 139, 250, 0.5)'] },
      { duration: 1, easing: [0.45, 0, 0.55, 1], repeat: Infinity }
    );

    // Auto-dismiss
    const timeout = setTimeout(() => {
      const out = animate(toast, { x: [0, 100], opacity: [1, 0] }, { duration: 0.3, easing: [0.55, 0.085, 0.68, 0.53] });
      const finished = Array.isArray(out) ? Promise.all(out.map(a => a.finished)) : out.finished;
      Promise.resolve(finished).then(() => onDismiss?.());
    }, duration);

    return () => clearTimeout(timeout);
  }, [amount, duration, onDismiss]);

  return (
    <div
      ref={toastRef}
      className="fixed top-20 right-4 z-50 px-4 py-3 rounded-lg glass-max border glow-border bg-secondary/90 backdrop-blur-xl shadow-2xl min-w-[200px]"
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl animate-pulse-glow">✨</div>
        <div className="flex-1">
          <div className="text-lg font-black accent-mastery tabular-nums">+{amount} XP</div>
          {reason && <div className="text-xs text-secondary">{reason}</div>}
        </div>
      </div>
    </div>
  );
}

export default XPGainToast;

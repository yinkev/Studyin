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
import { animate as anime } from 'animejs';

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
    anime(toast, {
      translateX: { from: 100, to: 0 },
      opacity: { from: 0, to: 1 },
      duration: 400,
      ease: 'outBack',
    });

    // Pulse glow
    anime(toast, {
      boxShadow: [
        { to: '0 0 20px rgba(167, 139, 250, 0.5)' },
        { to: '0 0 40px rgba(167, 139, 250, 0.8)' },
        { to: '0 0 20px rgba(167, 139, 250, 0.5)' },
      ],
      duration: 1000,
      loop: true,
      ease: 'inOutQuad',
    });

    // Auto-dismiss
    const timeout = setTimeout(() => {
      anime(toast, {
        translateX: { from: 0, to: 100 },
        opacity: { from: 1, to: 0 },
        duration: 300,
        ease: 'inQuad',
        onComplete: () => onDismiss?.(),
      });
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

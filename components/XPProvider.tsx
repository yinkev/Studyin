'use client';

/**
 * XPProvider - Global XP System Context
 *
 * Provides XP system to all components via React Context
 * Handles level-up notifications and XP toasts
 */

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useXPSystem, UseXPSystemReturn } from '../lib/hooks/useXPSystem';
import LevelUpBurst from './effects/LevelUpBurst';
import XPGainToast from './effects/XPGainToast';

interface XPNotification {
  id: number;
  amount: number;
  reason?: string;
}

interface XPContextValue extends UseXPSystemReturn {
  /** Award XP with visual feedback */
  awardXPWithFeedback: (amount: number, reason?: string) => void;
}

const XPContext = createContext<XPContextValue | null>(null);

export function XPProvider({ children }: { children: ReactNode }) {
  const xpSystem = useXPSystem();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(0);
  const [notifications, setNotifications] = useState<XPNotification[]>([]);

  const awardXPWithFeedback = useCallback(
    (amount: number, reason?: string) => {
      const result = xpSystem.awardXP(amount, reason);

      // Show XP toast
      const id = Date.now();
      setNotifications((prev) => [...prev, { id, amount, reason }]);

      // Show level up animation
      if (result.leveledUp && result.newLevel) {
        setLevelUpLevel(result.newLevel);
        setShowLevelUp(true);
      }
    },
    [xpSystem]
  );

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const contextValue: XPContextValue = {
    ...xpSystem,
    awardXPWithFeedback,
  };

  return (
    <XPContext.Provider value={contextValue}>
      {children}

      {/* Level Up Animation */}
      {showLevelUp && (
        <LevelUpBurst level={levelUpLevel} onComplete={() => setShowLevelUp(false)} />
      )}

      {/* XP Gain Toasts */}
      {notifications.map((notification) => (
        <XPGainToast
          key={notification.id}
          amount={notification.amount}
          reason={notification.reason}
          onDismiss={() => removeNotification(notification.id)}
        />
      ))}
    </XPContext.Provider>
  );
}

export function useXP() {
  const context = useContext(XPContext);
  if (!context) {
    throw new Error('useXP must be used within XPProvider');
  }
  return context;
}

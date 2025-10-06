'use client';

/**
 * Theme Toggle Component — INFJ-Centered Design
 * Three-state toggle: System / Dark / Light
 * Smart switching with visual feedback
 */

import { useEffect, useState } from 'react';
import { getTheme, setTheme, type Theme } from '../../lib/themes';

const THEME_OPTIONS: { value: Theme; icon: string; label: string }[] = [
  { value: 'light', icon: '☀️', label: 'Light' },
  { value: 'dark', icon: '🌙', label: 'Dark' },
  { value: 'system', icon: '💻', label: 'System' },
];

export function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTheme(getTheme());
  }, []);

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    setTheme(theme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex gap-1 rounded-full bg-secondary/20 p-1">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.value}
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm opacity-50"
            aria-label={`${option.label} theme`}
            disabled
          >
            {option.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex gap-0.5 rounded-lg bg-secondary/30 p-0.5 backdrop-blur-sm border border-border/30"
      role="radiogroup"
      aria-label="Theme selection"
    >
      {THEME_OPTIONS.map((option) => {
        const isActive = currentTheme === option.value;
        return (
          <button
            key={option.value}
            onClick={() => handleThemeChange(option.value)}
            className={`
              w-7 h-7 rounded-md flex items-center justify-center text-xs
              transition-all duration-200
              ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                  : 'hover:bg-secondary/50 hover:scale-105 opacity-50 hover:opacity-100'
              }
            `}
            role="radio"
            aria-checked={isActive}
            aria-label={`${option.label} theme`}
            title={option.label}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}

export default ThemeToggle;

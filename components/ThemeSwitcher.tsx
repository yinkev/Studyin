'use client';

/**
 * ThemeSwitcher — Material Web version (md-icon-button)
 * Two-state toggle (Light/Dark) with localStorage persistence.
 * Also updates `data-theme` for MD3 token switch.
 */
import { useEffect, useState } from 'react';
import { getActiveTheme, setTheme } from '../lib/themes';

export function ThemeSwitcher() {
  const [mode, setMode] = useState<'light' | 'dark'>(getInitial());

  useEffect(() => {
    // On mount, sync to stored/system preference
    const active = getActiveTheme();
    setMode(active);
  }, []);

  function getInitial(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return getActiveTheme();
  }

  const toggle = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    setTheme(next);
  };

  const label = mode === 'light' ? 'Switch to dark theme' : 'Switch to light theme';

  return (
    <md-icon-button aria-label={label} title={label} onClick={toggle} style={{
      '--md-sys-color-primary': 'var(--md-sys-color-primary)',
    } as React.CSSProperties}>
      {mode === 'light' ? (
        // Moon icon
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        // Sun icon
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.36 6.36-1.42-1.42M6.06 6.06 4.64 4.64m12.72 0-1.42 1.42M6.06 17.94l-1.42 1.42" />
        </svg>
      )}
    </md-icon-button>
  );
}

export default ThemeSwitcher;


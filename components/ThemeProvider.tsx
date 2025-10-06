'use client';

/**
 * Theme Provider — Initialize theme system on app load
 * Handles system preference detection and localStorage persistence
 */

import { useEffect } from 'react';
import { initTheme } from '../lib/themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initTheme();
  }, []);

  return <>{children}</>;
}

export default ThemeProvider;

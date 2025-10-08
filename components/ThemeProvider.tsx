'use client';

/**
 * Theme Provider — syncs DOM to stored preference and system changes.
 * - Defaults to light theme (server markup in layout sets light)
 * - Keeps `documentElement` class (light|dark) and `data-theme` in sync
 */
import { useEffect } from 'react';
import { initTheme, getActiveTheme } from '../lib/themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize theme from localStorage or system
    initTheme();

    // Ensure data-theme attribute mirrors the active class
    const html = document.documentElement;
    const applyAttr = () => {
      const active = getActiveTheme();
      html.setAttribute('data-theme', active);
    };
    applyAttr();

    // Re-apply when system theme changes (handled in initTheme as well),
    // and when classList mutates (e.g., via user toggle)
    const observer = new MutationObserver(applyAttr);
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
}

export default ThemeProvider;

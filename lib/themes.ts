/**
 * Theme System for INFJ-Centered Medical Analytics
 * Supports: System / Dark / Light modes
 * Color Psychology: Trust (cyan) | Mastery (purple) | Analysis (green)
 */

export type Theme = 'system' | 'dark' | 'light';

export interface ThemeColors {
  // Background layers
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;

  // Text hierarchy
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;

  // Accent colors (INFJ meaning-driven)
  accentTrust: string;      // Clinical cyan (trustworthiness, reliability)
  accentMastery: string;    // Deep purple (expertise, wisdom, competency)
  accentAnalysis: string;   // Data green (accuracy, growth, patterns)

  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // UI elements
  border: string;
  borderSubtle: string;
  borderHover: string;

  // Interactive states
  hoverBg: string;
  activeBg: string;

  // Glassmorphism
  glassLight: string;
  glassDark: string;
}

export const lightTheme: ThemeColors = {
  // Backgrounds (clean, clinical)
  bgPrimary: '#ffffff',
  bgSecondary: '#f8fafc',
  bgTertiary: '#f1f5f9',

  // Text (high contrast for readability)
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#64748b',

  // Accents (muted in light mode for professionalism)
  accentTrust: '#0891b2',      // Cyan-600
  accentMastery: '#7c3aed',    // Violet-600
  accentAnalysis: '#059669',   // Emerald-600

  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Borders
  border: '#e2e8f0',
  borderSubtle: '#f1f5f9',
  borderHover: '#cbd5e1',

  // Interactive
  hoverBg: '#f8fafc',
  activeBg: '#e2e8f0',

  // Glass
  glassLight: 'rgba(255, 255, 255, 0.7)',
  glassDark: 'rgba(15, 23, 42, 0.05)',
};

export const darkTheme: ThemeColors = {
  // Backgrounds (deep, focused)
  bgPrimary: '#0f172a',
  bgSecondary: '#1e293b',
  bgTertiary: '#334155',

  // Text (softer for eye comfort)
  textPrimary: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',

  // Accents (vibrant in dark mode for emphasis)
  accentTrust: '#22d3ee',      // Cyan-400
  accentMastery: '#a78bfa',    // Violet-400
  accentAnalysis: '#34d399',   // Emerald-400

  // Semantic
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',

  // Borders
  border: '#334155',
  borderSubtle: '#1e293b',
  borderHover: '#475569',

  // Interactive
  hoverBg: '#1e293b',
  activeBg: '#334155',

  // Glass
  glassLight: 'rgba(255, 255, 255, 0.05)',
  glassDark: 'rgba(15, 23, 42, 0.7)',
};

/**
 * Get current theme from localStorage or system preference
 */
export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'system';

  const stored = localStorage.getItem('studyin-theme') as Theme;
  if (stored && ['system', 'dark', 'light'].includes(stored)) {
    return stored;
  }

  return 'system';
}

/**
 * Set theme and update DOM
 */
export function setTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('studyin-theme', theme);
  updateThemeDOM(theme);
}

/**
 * Update DOM with theme class
 */
function updateThemeDOM(theme: Theme): void {
  const root = document.documentElement;

  // Remove existing theme classes
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = prefersDark ? 'dark' : 'light';
    root.classList.add(resolved);
    root.setAttribute('data-theme', resolved);
  } else {
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
  }
}

/**
 * Initialize theme on app load
 */
export function initTheme(): void {
  const theme = getTheme();
  updateThemeDOM(theme);

  // Listen for system theme changes
  if (theme === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => updateThemeDOM('system'));
  }
}

/**
 * Get current active theme (resolves 'system' to actual theme)
 */
export function getActiveTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';

  const theme = getTheme();
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

/**
 * Get theme colors for current active theme
 */
export function getThemeColors(): ThemeColors {
  return getActiveTheme() === 'light' ? lightTheme : darkTheme;
}

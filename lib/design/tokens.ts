/**
 * Design tokens — single source of truth for Studyin UI styling.
 * These tokens intentionally mirror the values declared in `app/globals.css`
 * so Tailwind, HeroUI, charts, and bespoke CSS share identical primitives.
 */

export type ThemeMode = 'light' | 'dark';

type ThemeColorSet = {
  brand: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  surface: {
    bg0: string;
    bg1: string;
    bg2: string;
    bg3: string;
  };
  text: {
    high: string;
    med: string;
    low: string;
    disabled: string;
  };
  semantic: {
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
  viz: {
    masteryLow: string;
    masteryMid: string;
    masteryHigh: string;
    confusionEdge: string;
    blueprintTarget: string;
    retention: string;
  };
};

type SharedPrimitives = {
  spacing: Record<
    | 'none'
    | '3xs'
    | '2xs'
    | 'xs'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl',
    string
  >;
  radius: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full', string>;
  shadow: Record<
    'sm' | 'md' | 'lg' | 'xl',
    {
      value: string;
      focusRing?: string;
    }
  >;
  motion: Record<'default' | 'emphasis' | 'bounce', string>;
};

export interface DesignTokens {
  shared: SharedPrimitives;
  themes: Record<ThemeMode, ThemeColorSet>;
}

export const tokens: DesignTokens = {
  shared: {
    spacing: {
      none: '0px',
      '3xs': '2px',
      '2xs': '4px',
      xs: '8px',
      sm: '12px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      '2xl': '48px',
      '3xl': '64px'
    },
    radius: {
      xs: '6px',     // Clinical Clarity: small buttons, badges
      sm: '8px',     // Clinical Clarity: default buttons, inputs
      md: '12px',    // Clinical Clarity: cards
      lg: '16px',    // Clinical Clarity: large cards
      xl: '20px',    // Clinical Clarity: hero sections
      full: '9999px' // Clinical Clarity: pills, avatars
    },
    shadow: {
      sm: {
        value: '0 1px 3px rgba(15, 23, 42, 0.08)',  // Clinical Clarity: subtle
        focusRing: '0 0 0 2px rgba(59, 130, 246, 0.5)' // Clinical Clarity: blue focus
      },
      md: {
        value: '0 4px 12px rgba(15, 23, 42, 0.08)',
        focusRing: '0 0 0 2px rgba(59, 130, 246, 0.5)'
      },
      lg: {
        value: '0 10px 24px rgba(15, 23, 42, 0.12)',
        focusRing: '0 0 0 2px rgba(59, 130, 246, 0.5)'
      },
      xl: {
        value: '0 20px 40px rgba(15, 23, 42, 0.16)',
        focusRing: '0 0 0 2px rgba(59, 130, 246, 0.5)'
      }
    },
    motion: {
      default: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
      emphasis: '400ms cubic-bezier(0.18, 0.89, 0.32, 1.28)',
      bounce: '1200ms cubic-bezier(0.34, 1.56, 0.64, 1)'
    }
  },
  themes: {
    dark: {
      brand: {
        primary: '#60a5fa',    // Clinical Clarity: blue-400
        secondary: '#0d9488',  // Clinical Clarity: teal-600
        tertiary: '#14b8a6'    // Clinical Clarity: teal-500
      },
      surface: {
        bg0: '#0f172a',        // Clinical Clarity: slate-900
        bg1: '#1e293b',        // Clinical Clarity: slate-800
        bg2: '#334155',        // Clinical Clarity: slate-700
        bg3: '#475569'         // Clinical Clarity: slate-600
      },
      text: {
        high: '#f8fafc',       // Clinical Clarity: slate-50
        med: '#cbd5e1',        // Clinical Clarity: slate-300
        low: '#94a3b8',        // Clinical Clarity: slate-400
        disabled: '#64748b'    // Clinical Clarity: slate-500
      },
      semantic: {
        success: '#34d399',    // Clinical Clarity: green-400 (bright for dark)
        warning: '#fbbf24',    // Clinical Clarity: amber-400
        danger: '#f87171',     // Clinical Clarity: red-400
        info: '#0ea5e9'        // Clinical Clarity: sky-500
      },
      viz: {
        masteryLow: '#f59e0b',
        masteryMid: '#60a5fa',
        masteryHigh: '#8b5cf6',
        confusionEdge: '#f87171',
        blueprintTarget: '#34d399',
        retention: '#fbbf24'
      }
    },
    light: {
      brand: {
        primary: '#3b82f6',    // Clinical Clarity: blue-500
        secondary: '#0d9488',  // Clinical Clarity: teal-600
        tertiary: '#14b8a6'    // Clinical Clarity: teal-500
      },
      surface: {
        bg0: '#ffffff',        // Clinical Clarity: white
        bg1: '#f8fafc',        // Clinical Clarity: slate-50
        bg2: '#f1f5f9',        // Clinical Clarity: slate-100
        bg3: '#e2e8f0'         // Clinical Clarity: slate-200
      },
      text: {
        high: '#0f172a',       // Clinical Clarity: slate-900
        med: '#475569',        // Clinical Clarity: slate-600
        low: '#64748b',        // Clinical Clarity: slate-500
        disabled: '#cbd5e1'    // Clinical Clarity: slate-300
      },
      semantic: {
        success: '#10b981',    // Clinical Clarity: emerald-500
        warning: '#f59e0b',    // Clinical Clarity: amber-500
        danger: '#ef4444',     // Clinical Clarity: red-500
        info: '#0ea5e9'        // Clinical Clarity: sky-500
      },
      viz: {
        masteryLow: '#f97316',
        masteryMid: '#3b82f6',
        masteryHigh: '#7c3aed',
        confusionEdge: '#ef4444',
        blueprintTarget: '#10b981',
        retention: '#f59e0b'
      }
    }
  }
};

/**
 * Helper to access a specific theme token set.
 */
export function getThemeTokens(mode: ThemeMode): ThemeColorSet {
  return tokens.themes[mode];
}

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
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      full: '9999px'
    },
    shadow: {
      sm: {
        value: '0 4px 12px rgba(15, 23, 42, 0.15)'
      },
      md: {
        value: '0 10px 24px rgba(15, 23, 42, 0.18)',
        focusRing: '0 0 0 1px rgba(34, 211, 238, 0.3)'
      },
      lg: {
        value: '0 20px 45px rgba(15, 23, 42, 0.24)',
        focusRing: '0 0 0 1px rgba(167, 139, 250, 0.3)'
      },
      xl: {
        value: '0 35px 65px rgba(15, 23, 42, 0.32)',
        focusRing: '0 0 0 1px rgba(56, 189, 248, 0.35)'
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
        primary: '#5B9CFF',
        secondary: '#9B6BFF',
        tertiary: '#38E3C2'
      },
      surface: {
        bg0: '#0A0F1A',
        bg1: '#0F172A',
        bg2: '#162036',
        bg3: '#1E293B'
      },
      text: {
        high: '#F8FAFC',
        med: '#C7D2FE',
        low: '#93A4C3',
        disabled: '#475569'
      },
      semantic: {
        success: '#3DD97F',
        warning: '#FFD166',
        danger: '#FF6B6B',
        info: '#57C1FF'
      },
      viz: {
        masteryLow: '#F97316',
        masteryMid: '#22D3EE',
        masteryHigh: '#A78BFA',
        confusionEdge: '#FF6363',
        blueprintTarget: '#22C55E',
        retention: '#FBBF24'
      }
    },
    light: {
      brand: {
        primary: '#0891B2',
        secondary: '#7C3AED',
        tertiary: '#059669'
      },
      surface: {
        bg0: '#FFFFFF',
        bg1: '#F8FAFC',
        bg2: '#F1F5F9',
        bg3: '#E2E8F0'
      },
      text: {
        high: '#0F172A',
        med: '#334155',
        low: '#64748B',
        disabled: '#94A3B8'
      },
      semantic: {
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6'
      },
      viz: {
        masteryLow: '#F97316',
        masteryMid: '#3B82F6',
        masteryHigh: '#7C3AED',
        confusionEdge: '#EF4444',
        blueprintTarget: '#22C55E',
        retention: '#F59E0B'
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

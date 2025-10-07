import { getThemeTokens, tokens, type ThemeMode } from './tokens';

type HeroUITheme = {
  colors: Record<string, string>;
  layout?: {
    radius?: Record<string, string>;
    borderWidth?: Record<string, string>;
  };
};

type HeroUIThemes = Record<ThemeMode, HeroUITheme>;

/**
 * HeroUI theme mapping built from the shared design tokens.
 * These objects are consumed by the HeroUI Tailwind plugin inside `tailwind.config.ts`.
 */
export const heroUIThemes: HeroUIThemes = {
  light: {
    colors: {
      background: tokens.themes.light.surface.bg1,
      foreground: tokens.themes.light.text.high,
      focus: tokens.shared.shadow.md.focusRing ?? '0 0 0 1px rgba(59,130,246,0.4)',
      primary: tokens.themes.light.brand.primary,
      'primary-foreground': '#FFFFFF',
      secondary: tokens.themes.light.brand.secondary,
      'secondary-foreground': '#FFFFFF',
      success: tokens.themes.light.semantic.success,
      warning: tokens.themes.light.semantic.warning,
      danger: tokens.themes.light.semantic.danger,
      info: tokens.themes.light.semantic.info,
      divider: 'rgba(15, 23, 42, 0.12)'
    },
    layout: {
      radius: tokens.shared.radius
    }
  },
  dark: {
    colors: {
      background: tokens.themes.dark.surface.bg1,
      foreground: tokens.themes.dark.text.high,
      focus: tokens.shared.shadow.md.focusRing ?? '0 0 0 1px rgba(94,234,212,0.35)',
      primary: tokens.themes.dark.brand.primary,
      'primary-foreground': '#FFFFFF',
      secondary: tokens.themes.dark.brand.secondary,
      'secondary-foreground': '#FFFFFF',
      success: tokens.themes.dark.semantic.success,
      warning: tokens.themes.dark.semantic.warning,
      danger: tokens.themes.dark.semantic.danger,
      info: tokens.themes.dark.semantic.info,
      divider: 'rgba(148, 163, 184, 0.12)'
    },
    layout: {
      radius: tokens.shared.radius
    }
  }
};

/**
 * Tailwind theme extensions derived from tokens. This keeps utility classes
 * aligned with the same palette the HeroUI components consume.
 */
export const tailwindThemeTokens = {
  colors: {
    brand: {
      light: tokens.themes.light.brand.primary,
      dark: tokens.themes.dark.brand.primary,
      secondary: tokens.themes.dark.brand.secondary,
      tertiary: tokens.themes.dark.brand.tertiary
    },
    surface: tokens.themes.dark.surface,
    text: tokens.themes.dark.text,
    semantic: tokens.themes.dark.semantic,
    viz: tokens.themes.dark.viz
  },
  spacing: tokens.shared.spacing,
  borderRadius: tokens.shared.radius,
  boxShadow: Object.fromEntries(
    Object.entries(tokens.shared.shadow).map(([key, value]) => [key, value.value])
  ),
  transitionTimingFunction: {
    default: tokens.shared.motion.default,
    emphasis: tokens.shared.motion.emphasis,
    bounce: tokens.shared.motion.bounce
  }
};

export function resolveSurfaceColor(mode: ThemeMode, surface: keyof ReturnType<typeof getThemeTokens>['surface']): string {
  return getThemeTokens(mode).surface[surface];
}


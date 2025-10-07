import { tokens as designTokens } from '@/lib/design/tokens';

const dark = designTokens.themes.dark;

export const tokens = {
  colors: {
    brand: {
      primary: dark.brand.primary,
      secondary: dark.brand.secondary,
      tertiary: dark.brand.tertiary,
    },
    surface: dark.surface,
    text: dark.text,
    semantic: dark.semantic,
    viz: dark.viz,
  },
};

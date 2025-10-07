import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";
import typography from "@tailwindcss/typography";

import { heroUIThemes, tailwindThemeTokens } from "./lib/design/theme";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: tailwindThemeTokens.colors.brand,
        surface: tailwindThemeTokens.colors.surface,
        text: tailwindThemeTokens.colors.text,
        semantic: tailwindThemeTokens.colors.semantic,
        viz: tailwindThemeTokens.colors.viz
      },
      spacing: tailwindThemeTokens.spacing,
      borderRadius: tailwindThemeTokens.borderRadius,
      boxShadow: tailwindThemeTokens.boxShadow,
      transitionTimingFunction: tailwindThemeTokens.transitionTimingFunction
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: heroUIThemes,
    }),
    typography,
  ],
};

export default config;

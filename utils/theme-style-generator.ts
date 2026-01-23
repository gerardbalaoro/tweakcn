import { ThemeEditorState } from "@/types/editor";
import { colorFormatter } from "./color-converter";
import { ColorFormat } from "../types";
import { getShadowMap } from "./shadows";
import { defaultLightThemeStyles } from "@/config/theme";
import { ThemeStyles } from "@/types/theme";

type ThemeMode = "light" | "dark";

const COLOR_VARIABLE_KEYS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

const generateColorVariables = (
  themeStyles: ThemeStyles,
  mode: ThemeMode,
  formatColor: (color: string) => string,
  skipDuplicates: boolean = false
): string => {
  const styles = themeStyles[mode];
  const lightStyles = themeStyles["light"];

  const lines = COLOR_VARIABLE_KEYS.map((key) => {
    const value = styles[key];
    const formattedValue = formatColor(value);

    // In dark mode, skip if value matches light mode
    if (skipDuplicates && mode === "dark") {
      const lightValue = lightStyles[key];
      const formattedLightValue = formatColor(lightValue);
      if (formattedValue === formattedLightValue) {
        return null;
      }
    }

    return `  --${key}: ${formattedValue};`;
  }).filter(Boolean);

  return lines.length > 0 ? "\n" + lines.join("\n") : "";
};

const FONT_VARIABLE_KEYS = ["font-sans", "font-serif", "font-mono"] as const;

const generateFontVariables = (
  themeStyles: ThemeStyles,
  mode: ThemeMode,
  skipDuplicates: boolean = false
): string => {
  const styles = themeStyles[mode];
  const lightStyles = themeStyles["light"];

  const lines = FONT_VARIABLE_KEYS.map((key) => {
    const value = styles[key];

    // In dark mode, skip if value matches light mode
    if (skipDuplicates && mode === "dark") {
      const lightValue = lightStyles[key];
      if (value === lightValue) {
        return null;
      }
    }

    return `  --${key}: ${value};`;
  }).filter(Boolean);

  return lines.length > 0 ? "\n" + lines.join("\n") : "";
};

const SHADOW_VARIABLE_KEYS = [
  "shadow-2xs",
  "shadow-xs",
  "shadow-sm",
  "shadow",
  "shadow-md",
  "shadow-lg",
  "shadow-xl",
  "shadow-2xl",
] as const;

const generateShadowVariables = (
  shadowMap: Record<string, string>,
  lightShadowMap?: Record<string, string>
): string => {
  const lines = SHADOW_VARIABLE_KEYS.map((key) => {
    const value = shadowMap[key];

    // Skip if value matches light mode
    if (lightShadowMap && value === lightShadowMap[key]) {
      return null;
    }

    return `  --${key}: ${value};`;
  }).filter(Boolean);

  return lines.length > 0 ? "\n" + lines.join("\n") : "";
};

const RAW_SHADOW_VARIABLE_KEYS = [
  { key: "shadow-offset-x", cssVar: "shadow-x" },
  { key: "shadow-offset-y", cssVar: "shadow-y" },
  { key: "shadow-blur", cssVar: "shadow-blur" },
  { key: "shadow-spread", cssVar: "shadow-spread" },
  { key: "shadow-opacity", cssVar: "shadow-opacity" },
  { key: "shadow-color", cssVar: "shadow-color" },
] as const;

const generateRawShadowVariables = (
  themeStyles: ThemeStyles,
  mode: ThemeMode,
  skipDuplicates: boolean = false
): string => {
  const styles = themeStyles[mode];
  const lightStyles = themeStyles["light"];

  const lines = RAW_SHADOW_VARIABLE_KEYS.map(({ key, cssVar }) => {
    const value = styles[key as keyof typeof styles];

    // In dark mode, skip if value matches light mode
    if (skipDuplicates && mode === "dark") {
      const lightValue = lightStyles[key as keyof typeof lightStyles];
      if (value === lightValue) {
        return null;
      }
    }

    return `  --${cssVar}: ${value};`;
  }).filter(Boolean);

  return lines.length > 0 ? "\n" + lines.join("\n") : "";
};

const generateTrackingVariables = (themeStyles: ThemeStyles): string => {
  const styles = themeStyles["light"];
  if (styles["letter-spacing"] === "0em") {
    return "";
  }
  return `

  --tracking-tighter: calc(var(--tracking-normal) - 0.05em);
  --tracking-tight: calc(var(--tracking-normal) - 0.025em);
  --tracking-normal: var(--tracking-normal);
  --tracking-wide: calc(var(--tracking-normal) + 0.025em);
  --tracking-wider: calc(var(--tracking-normal) + 0.05em);
  --tracking-widest: calc(var(--tracking-normal) + 0.1em);`;
};

const generateThemeVariables = (
  themeStyles: ThemeStyles,
  mode: ThemeMode,
  formatColor: (color: string) => string
): string => {
  const selector = mode === "dark" ? ".dark" : ":root";
  const skipDuplicates = mode === "dark";

  const colorVars = generateColorVariables(themeStyles, mode, formatColor, skipDuplicates);
  const fontVars = generateFontVariables(themeStyles, mode, skipDuplicates);

  // Only include radius in dark mode if it differs from light
  const lightRadius = themeStyles["light"].radius;
  const darkRadius = themeStyles["dark"].radius;
  const radiusVar =
    mode === "light" || lightRadius !== darkRadius
      ? `\n  --radius: ${themeStyles[mode].radius};`
      : "";

  // Generate shadow maps for comparison
  const lightShadowMap = getShadowMap({ styles: themeStyles, currentMode: "light" });
  const currentShadowMap = getShadowMap({ styles: themeStyles, currentMode: mode });
  const shadowVars = generateShadowVariables(
    currentShadowMap,
    skipDuplicates ? lightShadowMap : undefined
  );

  const rawShadowVars = generateRawShadowVariables(themeStyles, mode, skipDuplicates);

  const spacingVar =
    mode === "light"
      ? `\n  --spacing: ${themeStyles["light"].spacing ?? defaultLightThemeStyles.spacing};`
      : "";

  const trackingVars =
    mode === "light"
      ? `\n  --tracking-normal: ${themeStyles["light"]["letter-spacing"] ?? defaultLightThemeStyles["letter-spacing"]};`
      : "";

  // Collect all variable parts
  const parts = [colorVars, fontVars, radiusVar, rawShadowVars, shadowVars, trackingVars, spacingVar].filter(
    (part) => part.length > 0
  );

  // If dark mode has no unique variables, return empty string
  if (mode === "dark" && parts.length === 0) {
    return "";
  }

  return selector + " {" + parts.join("") + "\n}";
};

const generateTailwindV4ThemeInline = (themeStyles: ThemeStyles): string => {
  return `@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);${generateTrackingVariables(themeStyles)}
}`;
};

const generateTailwindV3Config = (
  _themeStyles: ThemeStyles,
  colorFormat: ColorFormat = "hsl"
): string => {
  const colorToken = (key: string) => {
    return colorFormat === "hsl" ? `"hsl(var(--${key}))"` : `"var(--${key})"`;
  };

  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        border: ${colorToken("border")},
        input: ${colorToken("input")},
        ring: ${colorToken("ring")},
        background: ${colorToken("background")},
        foreground: ${colorToken("foreground")},
        primary: {
          DEFAULT: ${colorToken("primary")},
          foreground: ${colorToken("primary-foreground")},
        },
        secondary: {
          DEFAULT: ${colorToken("secondary")},
          foreground: ${colorToken("secondary-foreground")},
        },
        destructive: {
          DEFAULT: ${colorToken("destructive")},
          foreground: ${colorToken("destructive-foreground")},
        },
        muted: {
            DEFAULT: ${colorToken("muted")},
          foreground: ${colorToken("muted-foreground")},
        },
        accent: {
          DEFAULT: ${colorToken("accent")},
          foreground: ${colorToken("accent-foreground")},
        },
        popover: {
          DEFAULT: ${colorToken("popover")},
          foreground: ${colorToken("popover-foreground")},
        },
        card: {
          DEFAULT: ${colorToken("card")},
          foreground: ${colorToken("card-foreground")},
        },
        sidebar: {
          DEFAULT: ${colorToken("sidebar")},
          foreground: ${colorToken("sidebar-foreground")},
          primary: ${colorToken("sidebar-primary")},
          "primary-foreground": ${colorToken("sidebar-primary-foreground")},
          accent: ${colorToken("sidebar-accent")},
          "accent-foreground": ${colorToken("sidebar-accent-foreground")},
          border: ${colorToken("sidebar-border")},
          ring: ${colorToken("sidebar-ring")},
        },
        chart: {
          1: ${colorToken("chart-1")},
          2: ${colorToken("chart-2")},
          3: ${colorToken("chart-3")},
          4: ${colorToken("chart-4")},
          5: ${colorToken("chart-5")},
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
}`;
};

export const generateThemeCode = (
  themeEditorState: ThemeEditorState,
  colorFormat: ColorFormat = "hsl",
  tailwindVersion: "3" | "4" = "3"
): string => {
  if (
    !themeEditorState ||
    !("light" in themeEditorState.styles) ||
    !("dark" in themeEditorState.styles)
  ) {
    throw new Error("Invalid theme styles: missing light or dark mode");
  }

  const themeStyles = themeEditorState.styles as ThemeStyles;
  const formatColor = (color: string) => colorFormatter(color, colorFormat, tailwindVersion);

  const lightTheme = generateThemeVariables(themeStyles, "light", formatColor);
  const darkTheme = generateThemeVariables(themeStyles, "dark", formatColor);
  const tailwindV4Theme =
    tailwindVersion === "4" ? `\n\n${generateTailwindV4ThemeInline(themeStyles)}` : "";

  const bodyLetterSpacing =
    themeStyles["light"]["letter-spacing"] !== "0em"
      ? "\n\nbody {\n  letter-spacing: var(--tracking-normal);\n}"
      : "";

  // Only include dark theme section if it has unique variables
  const darkSection = darkTheme ? `\n\n${darkTheme}` : "";

  return `${lightTheme}${darkSection}${tailwindV4Theme}${bodyLetterSpacing}`;
};

export const generateTailwindConfigCode = (
  themeEditorState: ThemeEditorState,
  colorFormat: ColorFormat = "hsl",
  _tailwindVersion: "3" | "4" = "3"
): string => {
  if (
    !themeEditorState ||
    !("light" in themeEditorState.styles) ||
    !("dark" in themeEditorState.styles)
  ) {
    throw new Error("Invalid theme styles: missing light or dark mode");
  }

  const themeStyles = themeEditorState.styles as ThemeStyles;
  return generateTailwindV3Config(themeStyles, colorFormat);
};

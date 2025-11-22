export type ThemeName = "light" | "dark"

export interface DesignTokens {
  colors: {
    background: string
    foreground: string
    card: string
    cardForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    accent: string
    accentForeground: string
    muted: string
    mutedForeground: string
    border: string
    input: string
    ring: string
  }
  radii: {
    sm: string
    md: string
    lg: string
    xl: string
  }
  spacing: Record<"3xs" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl", number>
  typography: {
    sans: string
    mono: string
  }
}

const baseSpacing = {
  "3xs": 4,
  "2xs": 8,
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  "2xl": 40,
} as const

const lightColors = {
  background: "oklch(0.98 0 0)",
  foreground: "oklch(0.10 0 0)",
  card: "oklch(1 0 0)",
  cardForeground: "oklch(0.10 0 0)",
  primary: "oklch(0.35 0.12 280)",
  primaryForeground: "oklch(0.98 0 0)",
  secondary: "oklch(0.50 0.15 280)",
  secondaryForeground: "oklch(0.98 0 0)",
  accent: "oklch(0.58 0.22 40)",
  accentForeground: "oklch(0.98 0 0)",
  muted: "oklch(0.94 0 0)",
  mutedForeground: "oklch(0.50 0 0)",
  border: "oklch(0.92 0 0)",
  input: "oklch(0.95 0 0)",
  ring: "oklch(0.35 0.12 280)",
} as const

const darkColors = {
  background: "oklch(0.12 0 0)",
  foreground: "oklch(0.95 0 0)",
  card: "oklch(0.15 0 0)",
  cardForeground: "oklch(0.95 0 0)",
  primary: "oklch(0.65 0.18 280)",
  primaryForeground: "oklch(0.12 0 0)",
  secondary: "oklch(0.55 0.14 280)",
  secondaryForeground: "oklch(0.95 0 0)",
  accent: "oklch(0.58 0.22 40)",
  accentForeground: "oklch(0.12 0 0)",
  muted: "oklch(0.30 0 0)",
  mutedForeground: "oklch(0.70 0 0)",
  border: "oklch(0.25 0 0)",
  input: "oklch(0.20 0 0)",
  ring: "oklch(0.58 0.22 40)",
} as const

const radii = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.625rem",
  xl: "1rem",
} as const

const typography = {
  sans: '"Geist", "Geist Fallback", system-ui, -apple-system',
  mono: '"Geist Mono", "Geist Mono Fallback", monospace',
} as const

export const designTokens: Record<ThemeName, DesignTokens> = {
  light: {
    colors: { ...lightColors },
    radii,
    spacing: baseSpacing,
    typography,
  },
  dark: {
    colors: { ...darkColors },
    radii,
    spacing: baseSpacing,
    typography,
  },
}

export function getDesignTokens(theme: ThemeName = "light"): DesignTokens {
  return designTokens[theme]
}

export type { DesignTokens as DesignSystemTokens }

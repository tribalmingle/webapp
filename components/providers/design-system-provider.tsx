"use client"

import type { ReactNode } from "react"
import { createContext, useContext, useEffect, useMemo } from "react"
import { useTheme } from "next-themes"

import { getDesignTokens, type DesignSystemTokens, type ThemeName } from "@/lib/design-system"

interface DesignSystemContextValue {
  theme: ThemeName
  tokens: DesignSystemTokens
}

const DesignSystemContext = createContext<DesignSystemContextValue>({
  theme: "light",
  tokens: getDesignTokens("light"),
})

interface DesignSystemProviderProps {
  children: ReactNode
  theme?: ThemeName
}

const COLOR_VAR_KEYS: Record<keyof DesignSystemTokens["colors"], string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
}

const spacingKeys: Array<keyof DesignSystemTokens["spacing"]> = ["3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl"]

export function DesignSystemProvider({ children, theme: forcedTheme }: DesignSystemProviderProps) {
  const { resolvedTheme } = useTheme()
  const theme: ThemeName = useMemo(() => {
    if (forcedTheme) {
      return forcedTheme
    }
    return resolvedTheme === "dark" ? "dark" : "light"
  }, [forcedTheme, resolvedTheme])

  const tokens = useMemo(() => getDesignTokens(theme), [theme])
  const value = useMemo(() => ({ theme, tokens }), [theme, tokens])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.style.setProperty("color-scheme", theme === "dark" ? "dark" : "light")

    Object.entries(COLOR_VAR_KEYS).forEach(([key, cssVar]) => {
      const tokenKey = key as keyof DesignSystemTokens["colors"]
      root.style.setProperty(cssVar, tokens.colors[tokenKey])
    })

    root.style.setProperty("--radius-sm", tokens.radii.sm)
    root.style.setProperty("--radius-md", tokens.radii.md)
    root.style.setProperty("--radius-lg", tokens.radii.lg)
    root.style.setProperty("--radius-xl", tokens.radii.xl)
    root.style.setProperty("--radius", tokens.radii.lg)

    spacingKeys.forEach((key) => {
      const value = tokens.spacing[key]
      root.style.setProperty(`--space-${key}`, `${value}px`)
    })
  }, [theme, tokens])

  return <DesignSystemContext.Provider value={value}>{children}</DesignSystemContext.Provider>
}

export function useDesignSystem() {
  return useContext(DesignSystemContext)
}

import type { ReactNode } from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"

import { BranchProvider } from "./branch-provider"
import { DesignSystemProvider } from "./design-system-provider"
import { FeatureFlagProvider } from "./feature-flag-provider"
import { QueryProvider } from "./query-provider"

export function AppShellProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <DesignSystemProvider>
        <QueryProvider>
          <BranchProvider>
            <AuthProvider>
              <FeatureFlagProvider>{children}</FeatureFlagProvider>
            </AuthProvider>
          </BranchProvider>
        </QueryProvider>
      </DesignSystemProvider>
    </ThemeProvider>
  )
}

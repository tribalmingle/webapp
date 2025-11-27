'use client'

import { useFeatureFlags } from '@/components/providers/feature-flag-provider'

export function useFeatureFlag(flagKey: string, defaultValue = false): boolean {
  const { getFlagValue } = useFeatureFlags()
  return getFlagValue(flagKey, defaultValue)
}

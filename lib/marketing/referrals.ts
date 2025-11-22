type ReferralMeta = {
  code: string
  description: string
  heroTagline?: string
}

const REFERRAL_REGISTRY: Record<string, ReferralMeta> = {
  vip: {
    code: 'vip',
    description: 'VIP ambassador program',
    heroTagline: 'VIP referral: Unlock concierge onboarding for both of you.',
  },
  diaspora: {
    code: 'diaspora',
    description: 'Diaspora partner program',
    heroTagline: 'Diaspora insider: enjoy premium boosts when you join today.',
  },
}

export function getReferralMeta(code?: string | null): ReferralMeta | null {
  if (!code) {
    return null
  }
  const normalized = code.trim().toLowerCase()
  return REFERRAL_REGISTRY[normalized] ?? null
}
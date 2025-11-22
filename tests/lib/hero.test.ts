import { describe, expect, vi, beforeEach, afterEach } from 'vitest'

import { getHeroVariant } from '@/lib/marketing/hero'
import { fetchLandingContent } from '@/lib/contentful'
import { getMarketingDictionary } from '@/lib/i18n/dictionaries'
import { trackServerEvent } from '@/lib/analytics/segment'
import { getHeroExperimentVariant } from '@/lib/launchdarkly/server'
import { getReferralMeta } from '@/lib/marketing/referrals'

vi.mock('@/lib/contentful', () => ({
  fetchLandingContent: vi.fn(),
}))

vi.mock('@/lib/i18n/dictionaries', () => ({
  getMarketingDictionary: vi.fn(),
}))

vi.mock('@/lib/analytics/segment', () => ({
  trackServerEvent: vi.fn(),
}))

vi.mock('@/lib/launchdarkly/server', () => ({
  getHeroExperimentVariant: vi.fn(),
}))

vi.mock('@/lib/marketing/referrals', () => ({
  getReferralMeta: vi.fn(),
}))

const baseDictionary = {
  hero: {
    title: 'Base Title',
    highlight: 'Base Highlight',
    description: 'Base Description',
    primaryCta: 'Primary CTA',
    secondaryCta: 'Secondary CTA',
    safetyTagline: 'Safety First',
    referralTagline: 'Referral Boost',
    diasporaTagline: 'Diaspora Love',
    localTagline: 'Local Love',
  },
}

describe('getHeroVariant', () => {
  beforeEach(() => {
    vi.mocked(fetchLandingContent).mockResolvedValue(null)
    vi.mocked(getMarketingDictionary).mockResolvedValue(baseDictionary as any)
    vi.mocked(getHeroExperimentVariant).mockResolvedValue('default')
    vi.mocked(getReferralMeta).mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('prioritizes referral metadata when available', async () => {
    vi.mocked(getReferralMeta).mockReturnValue({ code: 'vip', description: 'VIP ambassador', heroTagline: 'Referral Hero' })
    vi.mocked(fetchLandingContent).mockResolvedValue({
      heroTitle: 'CMS Title',
      heroHighlight: 'CMS Highlight',
      heroDescription: 'CMS Description',
      heroPrimaryCta: 'CMS CTA',
      heroSecondaryCta: 'CMS Secondary',
    })

    const result = await getHeroVariant({ locale: 'en', referralCode: 'vip', countryCode: 'US' })

    expect(result.variant.key).toBe('referral')
    expect(result.variant.tagline).toBe('Referral Hero')
    expect(trackServerEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'hero_variant_rendered',
      properties: expect.objectContaining({ variant: 'referral', referralCode: 'vip' }),
    }))
  })

  it('uses LaunchDarkly experiment variant when provided', async () => {
    vi.mocked(getHeroExperimentVariant).mockResolvedValue('diaspora')
    vi.mocked(fetchLandingContent).mockResolvedValue({
      heroTitle: 'CMS Title',
      heroHighlight: 'CMS Highlight',
      heroDescription: 'CMS Description',
      heroPrimaryCta: 'CMS CTA',
      heroSecondaryCta: 'CMS Secondary',
      variants: [
        {
          key: 'diaspora',
          title: 'Diaspora Title',
          highlight: 'Everywhere',
          description: 'Connect globally',
          primaryCta: 'Join',
          secondaryCta: 'Login',
          tagline: 'Diaspora Tagline',
          badge: 'Test Badge',
        },
      ],
    })

    const result = await getHeroVariant({ locale: 'en', countryCode: 'US' })

    expect(result.variant.key).toBe('diaspora')
    expect(result.variant.badge).toBe('Test Badge')
  })

  it('selects local variant for African countries', async () => {
    vi.mocked(fetchLandingContent).mockResolvedValue({
      heroLocalTagline: 'Local spotlight',
    })

    const result = await getHeroVariant({ locale: 'en', countryCode: 'NG' })

    expect(result.variant.key).toBe('local')
    expect(result.variant.tagline).toBe('Local spotlight')
  })

  it('falls back to dictionary copy when CMS unavailable', async () => {
    vi.mocked(fetchLandingContent).mockResolvedValue(null)

    const result = await getHeroVariant({ locale: 'en' })

    expect(result.variant.title).toBe(baseDictionary.hero.title)
    expect(result.variant.key).toBe('default')
  })
})

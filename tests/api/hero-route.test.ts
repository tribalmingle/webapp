import { describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/api/marketing/hero/route'
import { getHeroVariant } from '@/lib/marketing/hero'

vi.mock('@/lib/marketing/hero', () => ({
  getHeroVariant: vi.fn(),
}))

describe('GET /api/marketing/hero', () => {
  it('returns hero variant payload', async () => {
    vi.mocked(getHeroVariant).mockResolvedValue({
      variant: {
        key: 'default',
        title: 'Title',
        highlight: 'Highlight',
        description: 'Description',
        primaryCta: 'Primary',
        secondaryCta: 'Secondary',
        tagline: 'Tagline',
      },
      source: 'contentful',
    })

    const request = new Request('https://tribalmingle.test/api/marketing/hero?locale=en&countryCode=US')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.hero.key).toBe('default')
    expect(payload.source).toBe('contentful')
    expect(getHeroVariant).toHaveBeenCalledWith({ locale: 'en', countryCode: 'US', referralCode: null })
  })
})

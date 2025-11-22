import { describe, expect, it } from 'vitest'

import ar from '@/dictionaries/marketing/ar.json'
import en from '@/dictionaries/marketing/en.json'
import fr from '@/dictionaries/marketing/fr.json'
import pt from '@/dictionaries/marketing/pt.json'

const localeDictionaries = {
  en,
  fr,
  pt,
  ar,
}

describe('family portal marketing dictionary', () => {
  it('includes hero, pillars, steps, trust, faq, and support copy for every locale', () => {
    Object.entries(localeDictionaries).forEach(([locale, dictionary]) => {
      const portal = dictionary.familyPortal
      expect(portal, `${locale} missing familyPortal copy`).toBeDefined()

      expect(portal.hero?.title, `${locale} missing hero title`).toBeTruthy()
      expect(portal.pillars?.length, `${locale} missing pillars`).toBeGreaterThanOrEqual(3)
      expect(portal.howItWorks?.steps?.length, `${locale} missing howItWorks steps`).toBeGreaterThanOrEqual(3)
      expect(portal.trustSignals?.items?.length, `${locale} missing trust signals`).toBeGreaterThanOrEqual(3)
      expect(portal.faq?.items?.length, `${locale} missing FAQs`).toBeGreaterThan(0)
      expect(portal.support?.contactHref, `${locale} missing support contact`).toBeTruthy()
    })
  })
})

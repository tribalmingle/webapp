import 'server-only'

import type { AppLocale } from './locales'
import { DEFAULT_LOCALE } from './locales'

type MarketingDictionary = typeof import('../../dictionaries/marketing/en.json')

const marketingDictionaries: Record<AppLocale, () => Promise<MarketingDictionary>> = {
  en: () => import('../../dictionaries/marketing/en.json'),
  fr: () => import('../../dictionaries/marketing/fr.json'),
  pt: () => import('../../dictionaries/marketing/pt.json'),
  ar: () => import('../../dictionaries/marketing/ar.json'),
}

export async function getMarketingDictionary(locale: AppLocale): Promise<MarketingDictionary> {
  const loader = marketingDictionaries[locale] ?? marketingDictionaries[DEFAULT_LOCALE]
  const dictionary = await loader()
  return dictionary
}
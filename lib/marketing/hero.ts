import { headers } from 'next/headers'

import type { LandingContent } from '@/lib/contentful'
import { fetchLandingContent } from '@/lib/contentful'
import { trackServerEvent } from '@/lib/analytics/segment'
import { getHeroExperimentVariant } from '@/lib/launchdarkly/server'
import { getMarketingDictionary } from '@/lib/i18n/dictionaries'
import { isRtlLocale, normalizeLocale, type AppLocale } from '@/lib/i18n/locales'
import { getReferralMeta } from '@/lib/marketing/referrals'

export type HeroVariant = {
  key: 'default' | 'diaspora' | 'referral' | 'local' | 'safety' | 'experiment'
  title: string
  highlight: string
  description: string
  primaryCta: string
  secondaryCta: string
  tagline: string
  badge?: string
  alignment?: 'left' | 'center'
  direction?: 'ltr' | 'rtl'
}

type HeroDecisionContext = {
  locale: AppLocale
  countryCode?: string | null
  referralCode?: string | null
  userAgent?: string | null
}

type MarketingDictionary = Awaited<ReturnType<typeof getMarketingDictionary>>

export async function getHeroVariant(context: HeroDecisionContext): Promise<{ variant: HeroVariant; source: string }> {
  const locale = normalizeLocale(context.locale)
  const dictionary = await getMarketingDictionary(locale)
  const landingContent = await fetchLandingContent(locale)
  const fallbackVariant = createVariantFromSource('default', dictionary.hero)
  const countryCode = context.countryCode?.toUpperCase()
  const referralMeta = getReferralMeta(context.referralCode)

  const ldUser = {
    key: `marketing-${countryCode || 'unknown'}-${locale}`,
    country: countryCode,
    custom: {
      locale,
      // LaunchDarkly expects string/number/boolean values in `custom`; ensure referral is a string
      referral: referralMeta?.code ?? '',
    },
  }
  const experimentVariantKey = await getHeroExperimentVariant(ldUser, 'default')

  const variant = resolveVariant({
    locale,
    dictionaryHero: dictionary.hero,
    landingContent,
    experimentVariantKey,
    countryCode,
    referralMeta,
  }) ?? fallbackVariant

  await trackServerEvent({
    event: 'hero_variant_rendered',
    properties: {
      locale,
      variant: variant.key,
      source: landingContent ? 'contentful' : 'dictionary',
      countryCode,
      referralCode: referralMeta?.code,
      experimentVariantKey,
    },
  })

  return { variant, source: landingContent ? 'contentful' : 'dictionary' }
}

function resolveVariant(args: {
  locale: AppLocale
  dictionaryHero: MarketingDictionary['hero']
  landingContent: LandingContent | null
  experimentVariantKey?: string
  countryCode?: string
  referralMeta?: ReturnType<typeof getReferralMeta>
}): HeroVariant | null {
  const { locale, dictionaryHero, landingContent, experimentVariantKey, countryCode, referralMeta } = args

  if (referralMeta) {
    return mergeVariant('referral', dictionaryHero, landingContent, {
      tagline: referralMeta.heroTagline || dictionaryHero.referralTagline,
      badge: 'Referral Bonus',
    }, locale)
  }

  if (experimentVariantKey && experimentVariantKey !== 'default') {
    const experimentVariant = landingContent?.variants?.find((variant) => variant.key === experimentVariantKey)
    if (experimentVariant) {
      return normalizeVariant(experimentVariant, locale, 'experiment')
    }
  }

  if (countryCode && isAfricanCountry(countryCode)) {
    return mergeVariant('local', dictionaryHero, landingContent, { tagline: landingContent?.heroLocalTagline || dictionaryHero.localTagline }, locale)
  }

  if (countryCode && !isAfricanCountry(countryCode)) {
    return mergeVariant('diaspora', dictionaryHero, landingContent, { tagline: landingContent?.heroDiasporaTagline || dictionaryHero.diasporaTagline }, locale)
  }

  return mergeVariant('default', dictionaryHero, landingContent, {}, locale)
}

function mergeVariant(
  key: HeroVariant['key'],
  dictionaryHero: any,
  landingContent: LandingContent | null,
  overrides: Partial<HeroVariant>,
  locale: AppLocale,
): HeroVariant {
  const base: any = landingContent || {}
  return {
    key,
    title: (overrides.title ?? base.heroTitle ?? dictionaryHero.title) ?? '',
    highlight: (overrides.highlight ?? base.heroHighlight ?? dictionaryHero.highlight) ?? '',
    description: (overrides.description ?? base.heroDescription ?? dictionaryHero.description) ?? '',
    primaryCta: (overrides.primaryCta ?? base.heroPrimaryCta ?? dictionaryHero.primaryCta) ?? '',
    secondaryCta: (overrides.secondaryCta ?? base.heroSecondaryCta ?? dictionaryHero.secondaryCta) ?? '',
    tagline: (overrides.tagline ?? landingContent?.heroSafetyTagline ?? dictionaryHero.safetyTagline ?? dictionaryHero.description) ?? '',
    badge: overrides.badge,
    alignment: overrides.alignment || 'center',
    direction: overrides.direction || (isRtlLocale(locale) ? 'rtl' : 'ltr'),
  }
}

function createVariantFromSource(key: HeroVariant['key'], heroSource: any): HeroVariant {
  return {
    key,
    title: heroSource?.title ?? '',
    highlight: heroSource?.highlight ?? '',
    description: heroSource?.description ?? '',
    primaryCta: heroSource?.primaryCta ?? '',
    secondaryCta: heroSource?.secondaryCta ?? '',
    tagline: heroSource?.safetyTagline ?? '',
    alignment: 'center',
    direction: 'ltr',
  }
}

function isAfricanCountry(countryCode?: string): boolean {
  if (!countryCode) return false
  return AFRICA_COUNTRY_CODES.has(countryCode)
}

const AFRICA_COUNTRY_CODES = new Set([
  'AO',
  'BF',
  'BI',
  'BJ',
  'BW',
  'CD',
  'CF',
  'CG',
  'CI',
  'CM',
  'DJ',
  'DZ',
  'EG',
  'ER',
  'ET',
  'GA',
  'GH',
  'GM',
  'GN',
  'GQ',
  'KE',
  'LR',
  'LS',
  'LY',
  'MA',
  'ML',
  'MR',
  'MU',
  'MW',
  'MZ',
  'NA',
  'NE',
  'NG',
  'RW',
  'SC',
  'SD',
  'SL',
  'SN',
  'SO',
  'SS',
  'SZ',
  'TD',
  'TG',
  'TN',
  'TZ',
  'UG',
  'ZA',
  'ZM',
  'ZW',
])

export async function extractHeroContextFromHeaders(locale: string, searchParams: Record<string, string | string[] | undefined> = {}) {
  const headerStore = await headers()
  const countryCode = headerStore.get('x-vercel-ip-country')
  const referralCode = resolveSearchParam(searchParams, 'ref')
  return {
    locale: normalizeLocale(locale),
    countryCode,
    referralCode,
    userAgent: headerStore.get('user-agent'),
  }
}

function resolveSearchParam(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key]
  if (!value) return null
  if (Array.isArray(value)) {
    return value[0] || null
  }
  return value
}

function normalizeVariant(variant: NonNullable<LandingContent['variants']>[number], locale: AppLocale, defaultKey: HeroVariant['key']): HeroVariant {
  return {
    key: (variant.key as HeroVariant['key']) || defaultKey,
    title: variant.title ?? '',
    highlight: variant.highlight ?? '',
    description: variant.description ?? '',
    primaryCta: variant.primaryCta ?? '',
    secondaryCta: variant.secondaryCta ?? '',
    tagline: variant.tagline ?? '',
    badge: variant.badge,
    alignment: variant.alignment || 'center',
    direction: isRtlLocale(locale) ? 'rtl' : 'ltr',
  }
}
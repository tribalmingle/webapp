import { cache } from 'react'

import type { AppLocale } from '@/lib/i18n/locales'
import { getFallbackBlogPosts, getFallbackEvents } from '@/lib/marketing/cms-fallbacks'

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID
const DELIVERY_TOKEN = process.env.CONTENTFUL_DELIVERY_TOKEN
const ENVIRONMENT = process.env.CONTENTFUL_ENVIRONMENT || 'master'
const LANDING_CONTENT_TYPE = process.env.CONTENTFUL_LANDING_CONTENT_TYPE || 'landingPage'
const TESTIMONIAL_CONTENT_TYPE = process.env.CONTENTFUL_TESTIMONIAL_CONTENT_TYPE || 'marketingTestimonial'
const CONTENTFUL_BASE = SPACE_ID ? `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/${ENVIRONMENT}` : null
const REVALIDATE_SECONDS = 300

interface ContentfulCollection<TFields> {
  items: Array<{
    sys: { id: string }
    fields: TFields
  }>
}

async function contentfulFetch<TFields>(locale: AppLocale, params: Record<string, string>): Promise<ContentfulCollection<TFields> | null> {
  if (!CONTENTFUL_BASE || !DELIVERY_TOKEN) {
    return null
  }

  const url = new URL(`${CONTENTFUL_BASE}/entries`)
  Object.entries({ locale, limit: '10', ...params }).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${DELIVERY_TOKEN}`,
    },
    next: { revalidate: REVALIDATE_SECONDS },
  })

  if (!response.ok) {
    console.warn('Contentful request failed', { status: response.status, statusText: response.statusText })
    return null
  }

  return (await response.json()) as ContentfulCollection<TFields>
}

interface LandingFeatureFields {
  title?: string
  description?: string
  icon?: string
}

interface LandingContentFields {
  heroTitle?: string
  heroHighlight?: string
  heroDescription?: string
  heroPrimaryCta?: string
  heroSecondaryCta?: string
  heroSubcopy?: string
  heroDiasporaTagline?: string
  heroLocalTagline?: string
  heroReferralTagline?: string
  heroSafetyTagline?: string
  featureDeckTitle?: string
  featureCollection?: { sys: { id: string } }
  heroVariantCollection?: { sys: { id: string } }
}

interface HeroVariantFields {
  key?: string
  title?: string
  highlight?: string
}

interface MarketingBlogPostFields {
  slug?: string
  title?: string
  excerpt?: string
  category?: string
  readingTime?: number
  heroImage?: {
    fields?: { file?: { url?: string } }
  }
  publishedAt?: string
}

export type MarketingBlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  category?: string
  readingTime?: number
  heroImage?: string
  publishedAt: string
}

interface MarketingEventFields {
  title?: string
  city?: string
  country?: string
  startDate?: string
  endDate?: string
  description?: string
  heroImage?: {
    fields?: { file?: { url?: string } }
  }
  rsvpUrl?: string
  isVirtual?: boolean
}

export type MarketingEvent = {
  id: string
  title: string
  city: string
  country: string
  startDate: string
  endDate?: string
  description: string
  heroImage?: string
  rsvpUrl?: string
  isVirtual?: boolean
}

export interface LandingContent {
  heroTitle?: string
  heroHighlight?: string
  heroDescription?: string
  heroPrimaryCta?: string
  heroSecondaryCta?: string
  heroSubcopy?: string
  heroDiasporaTagline?: string
  heroLocalTagline?: string
  heroReferralTagline?: string
  heroSafetyTagline?: string
  featureDeckTitle?: string
  features?: LandingFeatureFields[]
  variants?: HeroVariantEntry[]
}

export interface HeroVariantEntry {
  key?: string
  title?: string
  highlight?: string
  description?: string
  primaryCta?: string
  secondaryCta?: string
  tagline?: string
  badge?: string
  alignment?: 'left' | 'center'
}

export const fetchMarketingBlogPosts = cache(async (
  locale: AppLocale,
  limit = 3,
): Promise<MarketingBlogPost[]> => {
  const collection = await contentfulFetch<MarketingBlogPostFields>(locale, {
    content_type: 'marketingBlogPost',
    order: '-fields.publishedAt',
    limit: String(limit),
  })

  if (!collection) {
    return getFallbackBlogPosts(locale, limit)
  }

  const posts = collection.items
    .map((item) => ({
      id: item.sys.id,
      slug: item.fields.slug?.trim() || '',
      title: item.fields.title?.trim() || '',
      excerpt: item.fields.excerpt?.trim() || '',
      category: item.fields.category?.trim(),
      readingTime: item.fields.readingTime,
      heroImage: item.fields.heroImage?.fields?.file?.url,
      publishedAt: item.fields.publishedAt || new Date().toISOString(),
    }))
    .filter((post) => Boolean(post.slug && post.title && post.excerpt))
    .slice(0, limit)

  return posts.length > 0 ? posts : getFallbackBlogPosts(locale, limit)
})

export const fetchMarketingEvents = cache(async (
  locale: AppLocale,
  limit = 4,
): Promise<MarketingEvent[]> => {
  const nowIso = new Date().toISOString()
  const collection = await contentfulFetch<MarketingEventFields>(locale, {
    content_type: 'marketingEvent',
    order: 'fields.startDate',
    'fields.startDate[gte]': nowIso,
    limit: String(limit),
  })

  if (!collection) {
    return getFallbackEvents(locale, limit)
  }

  const events = collection.items
    .map((item) => ({
      id: item.sys.id,
      title: item.fields.title?.trim() || '',
      city: item.fields.city?.trim() || '',
      country: item.fields.country?.trim() || '',
      startDate: item.fields.startDate || nowIso,
      endDate: item.fields.endDate,
      description: item.fields.description?.trim() || '',
      heroImage: item.fields.heroImage?.fields?.file?.url,
      rsvpUrl: item.fields.rsvpUrl,
      isVirtual: item.fields.isVirtual,
    }))
    .filter((event) => Boolean(event.title && event.city))
    .slice(0, limit)

  return events.length > 0 ? events : getFallbackEvents(locale, limit)
})

interface MarketingTestimonialFields {
  name?: string
  location?: string
  tribe?: string
  quote?: string
  rating?: number
}

export interface MarketingTestimonial {
  id: string
  name: string
  location?: string
  tribe?: string
  quote: string
  rating?: number
}

const getLinkedFeatures = cache(async (featureCollectionId: string, locale: AppLocale): Promise<LandingFeatureFields[]> => {
  const collection = await contentfulFetch<LandingFeatureFields>(locale, {
    content_type: 'landingFeature',
    'links_to_entry': featureCollectionId,
    limit: '10',
  })

  if (!collection) {
    return []
  }

  return collection.items.map((item) => ({
    title: item.fields.title,
    description: item.fields.description,
    icon: item.fields.icon,
  }))
})

const getLinkedHeroVariants = cache(async (variantCollectionId: string, locale: AppLocale): Promise<HeroVariantEntry[]> => {
  const collection = await contentfulFetch<HeroVariantFields>(locale, {
    content_type: 'heroVariant',
    'links_to_entry': variantCollectionId,
    limit: '10',
  })

  if (!collection) {
    return []
  }

  return collection.items.map((item) => {
    const fieldsAny: any = item.fields as any
    return {
      key: item.fields.key,
      title: item.fields.title,
      highlight: item.fields.highlight,
      // Contentful fields may not match generated typings in all environments — coerce via `any`.
      description: fieldsAny.description,
      primaryCta: fieldsAny.primaryCta,
      secondaryCta: fieldsAny.secondaryCta,
      tagline: fieldsAny.tagline,
      badge: fieldsAny.badge,
      alignment: fieldsAny.alignment,
    }
  })
})

export const fetchLandingContent = cache(async (locale: AppLocale): Promise<LandingContent | null> => {
  const collection = await contentfulFetch<LandingContentFields>(locale, {
    content_type: LANDING_CONTENT_TYPE,
    limit: '1',
  })

  if (!collection || collection.items.length === 0) {
    return null
  }

  const { fields } = collection.items[0]
  const features = fields.featureCollection?.sys?.id
    ? await getLinkedFeatures(fields.featureCollection.sys.id, locale)
    : undefined
  const variants = fields.heroVariantCollection?.sys?.id
    ? await getLinkedHeroVariants(fields.heroVariantCollection.sys.id, locale)
    : undefined

  return {
    heroTitle: fields.heroTitle,
    heroHighlight: fields.heroHighlight,
    heroDescription: fields.heroDescription,
    heroPrimaryCta: fields.heroPrimaryCta,
    heroSecondaryCta: fields.heroSecondaryCta,
    heroSubcopy: fields.heroSubcopy,
    heroDiasporaTagline: fields.heroDiasporaTagline,
    heroLocalTagline: fields.heroLocalTagline,
    heroReferralTagline: fields.heroReferralTagline,
    heroSafetyTagline: fields.heroSafetyTagline,
    featureDeckTitle: fields.featureDeckTitle,
    features,
    variants,
  }
})

export const fetchMarketingTestimonials = cache(async (
  locale: AppLocale,
  limit = 6,
): Promise<MarketingTestimonial[]> => {
  const collection = await contentfulFetch<MarketingTestimonialFields>(locale, {
    content_type: TESTIMONIAL_CONTENT_TYPE,
    order: '-sys.createdAt',
    limit: String(limit),
  })

  if (!collection) {
    return []
  }

  return collection.items
    .map((item) => ({
      id: item.sys.id,
      name: item.fields.name?.trim() || 'Member',
      location: item.fields.location,
      tribe: item.fields.tribe,
      quote: item.fields.quote?.trim() || '',
      rating: item.fields.rating,
    }))
    .filter((testimonial) => Boolean(testimonial.quote))
})
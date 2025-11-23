import type { EntrySkeletonType } from "contentful"

import type { Locale } from "@/lib/i18n/config"
import { getDictionary, type MarketingDictionary } from "@/lib/i18n/dictionaries"

import { getOptionalContentfulClient } from "./client"

type EntryLike<T> = {
  fields?: T | undefined
}

interface HeroEntrySkeleton extends EntrySkeletonType {
  contentTypeId: "marketingHero"
  fields: HeroEntryFields
}

interface TestimonialEntrySkeleton extends EntrySkeletonType {
  contentTypeId: "testimonialQuote"
  fields: TestimonialEntryFields
}

interface MetricEntrySkeleton extends EntrySkeletonType {
  contentTypeId: "marketingMetric"
  fields: MetricEntryFields
}

interface CtaEntrySkeleton extends EntrySkeletonType {
  contentTypeId: "ctaBlock"
  fields: CtaEntryFields
}

interface EventEntrySkeleton extends EntrySkeletonType {
  contentTypeId: "marketingEvent"
  fields: EventEntryFields
}

interface BlogEntrySkeleton extends EntrySkeletonType {
  contentTypeId: "marketingArticle"
  fields: BlogEntryFields
}

interface MapClusterEntrySkeleton extends EntrySkeletonType {
  contentTypeId: "tribeCluster"
  fields: MapClusterEntryFields
}

export interface MarketingContent {
  hero: {
    eyebrow: string
    headline: string
    body: string
    primaryCta: string
    secondaryCta: string
  }
  testimonials: {
    title: string
    quotes: Array<{ name: string; tribe: string; quote: string }>
  }
  metrics: {
    title: string
    items: Array<{ label: string; value: string }>
  }
  events: {
    title: string
    items: Array<{ city: string; region?: string; date: string; description: string; status?: string; href?: string }>
  }
  blog: {
    title: string
    posts: Array<{ title: string; excerpt: string; href: string; readTime: string }>
  }
  map: {
    title: string
    subtitle: string
    clusters: Array<{ city: string; region?: string; members: number; lat: number; lng: number }>
  }
  cta: {
    title: string
    body: string
    button: string
  }
}

interface HeroEntryFields {
  eyebrow?: string
  headline?: string
  body?: string
  primaryCtaLabel?: string
  secondaryCtaLabel?: string
}

interface TestimonialEntryFields {
  name?: string
  tribe?: string
  quote?: string
  groupTitle?: string
}

interface MetricEntryFields {
  label?: string
  value?: string
  groupTitle?: string
}

interface CtaEntryFields {
  title?: string
  body?: string
  buttonLabel?: string
}

interface EventEntryFields {
  city?: string
  region?: string
  dateLabel?: string
  description?: string
  status?: string
  ctaHref?: string
}

interface BlogEntryFields {
  title?: string
  excerpt?: string
  slug?: string
  externalUrl?: string
  readTimeLabel?: string
}

interface MapClusterEntryFields {
  city?: string
  region?: string
  members?: number
  latitude?: number
  longitude?: number
}

export async function loadMarketingContent(locale: Locale): Promise<MarketingContent> {
  const dictionary = getDictionary(locale)
  const fallback = mapDictionaryToContent(dictionary)
  const client = getOptionalContentfulClient()

  if (!client) {
    return fallback
  }

  try {
    const [heroEntries, testimonialEntries, metricEntries, eventEntries, blogEntries, mapEntries, ctaEntries] =
      await Promise.all([
      client.getEntries<HeroEntrySkeleton>({ content_type: "marketingHero", locale, limit: 1 }),
      client.getEntries<TestimonialEntrySkeleton>({ content_type: "testimonialQuote", locale }),
      client.getEntries<MetricEntrySkeleton>({ content_type: "marketingMetric", locale }),
        client.getEntries<EventEntrySkeleton>({ content_type: "marketingEvent", locale }),
        client.getEntries<BlogEntrySkeleton>({ content_type: "marketingArticle", locale }),
        client.getEntries<MapClusterEntrySkeleton>({ content_type: "tribeCluster", locale }),
      client.getEntries<CtaEntrySkeleton>({ content_type: "ctaBlock", locale, limit: 1 }),
      ])

    return {
      hero: mergeHero(heroEntries.items.at(0), fallback.hero),
      testimonials: mergeTestimonials(testimonialEntries.items, fallback.testimonials),
      metrics: mergeMetrics(metricEntries.items, fallback.metrics),
      events: mergeEvents(eventEntries.items, fallback.events),
      blog: mergeBlogPosts(blogEntries.items, fallback.blog),
      map: mergeMapClusters(mapEntries.items, fallback.map),
      cta: mergeCta(ctaEntries.items.at(0), fallback.cta),
    }
  } catch (error) {
    console.warn(`[marketing-app] Failed to load Contentful marketing content for locale ${locale}`, error)
    return fallback
  }
}

function mapDictionaryToContent(dictionary: MarketingDictionary): MarketingContent {
  return {
    hero: {
      eyebrow: dictionary.hero.eyebrow,
      headline: dictionary.hero.headline,
      body: dictionary.hero.body,
      primaryCta: dictionary.hero.ctaPrimary,
      secondaryCta: dictionary.hero.ctaSecondary,
    },
    testimonials: {
      title: dictionary.testimonials.title,
      quotes: dictionary.testimonials.quotes.map((quote: any) => ({
        name: quote.name,
        tribe: quote.tribe,
        quote: quote.quote,
      })),
    },
    metrics: {
      title: dictionary.metrics.title,
      items: dictionary.metrics.items.map((metric: any) => ({ ...metric })),
    },
    events: {
      title: dictionary.events.title,
      items: dictionary.events.items.map((event: any) => ({ ...event })),
    },
    blog: {
      title: dictionary.blog.title,
      posts: dictionary.blog.posts.map((post: any) => ({ ...post })),
    },
    map: {
      title: dictionary.map.title,
      subtitle: dictionary.map.subtitle,
      clusters: dictionary.map.clusters.map((cluster: any) => ({ ...cluster })),
    },
    cta: {
      title: dictionary.cta.title,
      body: dictionary.cta.body,
      button: dictionary.cta.button,
    },
  }
}

function mergeHero(entry: EntryLike<HeroEntryFields> | undefined, fallback: MarketingContent["hero"]): MarketingContent["hero"] {
  if (!entry) {
    return fallback
  }
  const fields = entry.fields ?? {}
  return {
    eyebrow: fields.eyebrow ?? fallback.eyebrow,
    headline: fields.headline ?? fallback.headline,
    body: fields.body ?? fallback.body,
    primaryCta: fields.primaryCtaLabel ?? fallback.primaryCta,
    secondaryCta: fields.secondaryCtaLabel ?? fallback.secondaryCta,
  }
}

function mergeTestimonials(
  entries: Array<EntryLike<TestimonialEntryFields>>,
  fallback: MarketingContent["testimonials"],
): MarketingContent["testimonials"] {
  if (!entries.length) {
    return fallback
  }
  const quotes = entries
    .map((entry) => ({
      name: entry.fields?.name,
      tribe: entry.fields?.tribe,
      quote: entry.fields?.quote,
      groupTitle: entry.fields?.groupTitle,
    }))
    .filter((quote) => quote.name && quote.quote)
    .map((quote) => ({ name: quote.name as string, tribe: quote.tribe ?? "", quote: quote.quote as string }))

  if (!quotes.length) {
    return fallback
  }

  const titleFromEntries = entries.find((entry) => entry.fields?.groupTitle)?.fields?.groupTitle

  return {
    title: titleFromEntries ?? fallback.title,
    quotes,
  }
}

function mergeMetrics(
  entries: Array<EntryLike<MetricEntryFields>>,
  fallback: MarketingContent["metrics"],
): MarketingContent["metrics"] {
  if (!entries.length) {
    return fallback
  }

  const items = entries
    .map((entry) => ({ label: entry.fields?.label, value: entry.fields?.value, groupTitle: entry.fields?.groupTitle }))
    .filter((metric) => metric.label && metric.value)
    .map((metric) => ({ label: metric.label as string, value: metric.value as string }))

  if (!items.length) {
    return fallback
  }

  const titleFromEntries = entries.find((entry) => entry.fields?.groupTitle)?.fields?.groupTitle

  return {
    title: titleFromEntries ?? fallback.title,
    items,
  }
}

function mergeCta(entry: EntryLike<CtaEntryFields> | undefined, fallback: MarketingContent["cta"]): MarketingContent["cta"] {
  if (!entry) {
    return fallback
  }
  const fields = entry.fields ?? {}
  return {
    title: fields.title ?? fallback.title,
    body: fields.body ?? fallback.body,
    button: fields.buttonLabel ?? fallback.button,
  }
}

function mergeEvents(
  entries: Array<EntryLike<EventEntryFields>>,
  fallback: MarketingContent["events"],
): MarketingContent["events"] {
  if (!entries.length) {
    return fallback
  }
  const items = entries
    .map((entry) => ({
      city: entry.fields?.city,
      region: entry.fields?.region,
      date: entry.fields?.dateLabel,
      description: entry.fields?.description,
      status: entry.fields?.status,
      href: entry.fields?.ctaHref,
    }))
    .filter((event) => event.city && event.date && event.description)
    .map((event) => ({
      city: event.city as string,
      region: event.region,
      date: event.date as string,
      description: event.description as string,
      status: event.status,
      href: event.href,
    }))

  if (!items.length) {
    return fallback
  }

  return {
    title: fallback.title,
    items,
  }
}

function mergeBlogPosts(
  entries: Array<EntryLike<BlogEntryFields>>,
  fallback: MarketingContent["blog"],
): MarketingContent["blog"] {
  if (!entries.length) {
    return fallback
  }

  const posts = entries
    .map((entry) => ({
      title: entry.fields?.title,
      excerpt: entry.fields?.excerpt,
      href: entry.fields?.externalUrl ?? (entry.fields?.slug ? `/stories/${entry.fields.slug}` : undefined),
      readTime: entry.fields?.readTimeLabel,
    }))
    .filter((post) => post.title && post.excerpt && post.href)
    .map((post) => ({
      title: post.title as string,
      excerpt: post.excerpt as string,
      href: post.href as string,
      readTime: post.readTime ?? fallback.posts[0]?.readTime ?? "",
    }))

  if (!posts.length) {
    return fallback
  }

  return {
    title: fallback.title,
    posts,
  }
}

function mergeMapClusters(
  entries: Array<EntryLike<MapClusterEntryFields>>,
  fallback: MarketingContent["map"],
): MarketingContent["map"] {
  if (!entries.length) {
    return fallback
  }

  const clusters = entries
    .map((entry) => ({
      city: entry.fields?.city,
      region: entry.fields?.region,
      members: entry.fields?.members,
      lat: entry.fields?.latitude,
      lng: entry.fields?.longitude,
    }))
    .filter((cluster) => cluster.city && typeof cluster.members === "number" && cluster.lat && cluster.lng)
    .map((cluster) => ({
      city: cluster.city as string,
      region: cluster.region,
      members: cluster.members as number,
      lat: cluster.lat as number,
      lng: cluster.lng as number,
    }))

  if (!clusters.length) {
    return fallback
  }

  return {
    title: fallback.title,
    subtitle: fallback.subtitle,
    clusters,
  }
}

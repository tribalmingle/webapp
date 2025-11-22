import type { AppLocale } from '@/lib/i18n/locales'
import type { MarketingBlogPost, MarketingEvent } from '@/lib/contentful'

type Localized<T> = T & { locales: AppLocale[] }

const BLOG_FALLBACKS: Array<Localized<MarketingBlogPost>> = [
  {
    locales: ['en', 'fr'],
    id: 'blog-rituals',
    slug: 'modern-tribal-rituals',
    title: 'Modern rituals rooted in heritage',
    excerpt: 'How diaspora couples keep palm wine ceremonies and kola nut blessings alive across continents.',
    category: 'Heritage',
    readingTime: 5,
    heroImage: '/images/blog/rituals.jpg',
    publishedAt: '2025-10-01T00:00:00.000Z',
  },
  {
    locales: ['en', 'pt'],
    id: 'blog-dating-safety',
    slug: 'safety-on-tribal-mingle',
    title: 'Safety protocols designed for intentional dating',
    excerpt: 'A look inside Tribal Mingle verification, AI trust scoring, and concierge moderation.',
    category: 'Trust & Safety',
    readingTime: 4,
    heroImage: '/images/blog/safety.jpg',
    publishedAt: '2025-09-18T00:00:00.000Z',
  },
  {
    locales: ['en', 'ar'],
    id: 'blog-diaspora-love',
    slug: 'diaspora-love-stories',
    title: 'Diaspora love stories from Lagos to London',
    excerpt: 'Three couples share how they bridged distance, language, and family expectations.',
    category: 'Stories',
    readingTime: 6,
    heroImage: '/images/blog/diaspora.jpg',
    publishedAt: '2025-09-05T00:00:00.000Z',
  },
]

const EVENT_FALLBACKS: Array<Localized<MarketingEvent>> = [
  {
    locales: ['en', 'fr'],
    id: 'event-lagos-supper',
    title: 'Chef-led Supper Club',
    city: 'Lagos',
    country: 'Nigeria',
    startDate: '2025-12-05T19:00:00.000Z',
    description: 'Taste regional pairings while meeting vetted Igbo, Yoruba, and Benin creatives.',
    heroImage: '/images/events/lagos-supper.jpg',
    rsvpUrl: 'https://tribalmingle.com/events/lagos-supper',
    isVirtual: false,
  },
  {
    locales: ['en', 'pt'],
    id: 'event-luanda-panel',
    title: 'Luanda Intentional Dating Forum',
    city: 'Luanda',
    country: 'Angola',
    startDate: '2025-12-12T16:00:00.000Z',
    description: 'Panel with relationship coaches on balancing career and culture.',
    heroImage: '/images/events/luanda-forum.jpg',
    rsvpUrl: 'https://tribalmingle.com/events/luanda-forum',
    isVirtual: false,
  },
  {
    locales: ['en', 'ar'],
    id: 'event-virtual-ama',
    title: 'Virtual AMA with matchmakers',
    city: 'Online',
    country: 'Global',
    startDate: '2025-11-30T18:00:00.000Z',
    description: 'Live Q&A on building trust when dating across borders.',
    heroImage: '/images/events/virtual-ama.jpg',
    rsvpUrl: 'https://tribalmingle.com/events/ama',
    isVirtual: true,
  },
]

export function getFallbackBlogPosts(locale: AppLocale, limit: number): MarketingBlogPost[] {
  return BLOG_FALLBACKS.filter((entry) => entry.locales.includes(locale)).slice(0, limit).map(({ locales, ...rest }) => rest)
}

export function getFallbackEvents(locale: AppLocale, limit: number): MarketingEvent[] {
  return EVENT_FALLBACKS.filter((entry) => entry.locales.includes(locale)).slice(0, limit).map(({ locales, ...rest }) => rest)
}

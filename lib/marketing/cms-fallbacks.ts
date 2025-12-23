import type { AppLocale } from '@/lib/i18n/locales'
import type { MarketingBlogPost, MarketingEvent } from '@/lib/contentful'

type Localized<T> = T & { locales: AppLocale[] }

const BLOG_FALLBACKS: Array<Localized<MarketingBlogPost>> = [
  {
    locales: ['en', 'fr', 'pt', 'ar'],
    id: 'blog-rituals',
    slug: 'modern-tribal-rituals',
    title: 'Modern rituals rooted in heritage',
    excerpt: 'How diaspora couples keep palm wine ceremonies and kola nut blessings alive across continents.',
    category: 'Heritage',
    readingTime: 5,
    heroImage: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=800&auto=format&fit=crop', // Cultural celebration
    publishedAt: '2025-10-01T00:00:00.000Z',
  },
  {
    locales: ['en', 'fr', 'pt', 'ar'],
    id: 'blog-dating-safety',
    slug: 'safety-on-tribal-mingle',
    title: 'Safety protocols designed for intentional dating',
    excerpt: 'A look inside Tribal Mingle verification, AI trust scoring, and concierge moderation.',
    category: 'Trust & Safety',
    readingTime: 4,
    heroImage: 'https://images.unsplash.com/photo-1621784563330-caee0b138a00?q=80&w=800&auto=format&fit=crop', // Couple smiling
    publishedAt: '2025-09-18T00:00:00.000Z',
  },
  {
    locales: ['en', 'fr', 'pt', 'ar'],
    id: 'blog-diaspora-love',
    slug: 'diaspora-love-stories',
    title: 'Diaspora love stories from Lagos to London',
    excerpt: 'Three couples share how they bridged distance, language, and family expectations.',
    category: 'Stories',
    readingTime: 6,
    heroImage: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800&auto=format&fit=crop', // Happy couple/Community
    publishedAt: '2025-09-05T00:00:00.000Z',
  },
]

const EVENT_FALLBACKS: Array<Localized<MarketingEvent>> = [
  {
    locales: ['en', 'fr', 'pt', 'ar'],
    id: 'event-london-mixer',
    title: 'Heritage & Cocktails Evening',
    city: 'London',
    country: 'United Kingdom',
    startDate: '2026-01-15T19:00:00.000Z',
    description: 'Exclusive mixer for diaspora professionals. Meet vetted singles over craft cocktails and culture.',
    heroImage: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=800&auto=format&fit=crop',
    rsvpUrl: 'https://tribalmingle.com/events/london-mixer',
    isVirtual: false,
  },
  {
    locales: ['en', 'fr', 'pt', 'ar'],
    id: 'event-lagos-supper',
    title: 'Chef-led Supper Club',
    city: 'Lagos',
    country: 'Nigeria',
    startDate: '2026-01-20T19:00:00.000Z',
    description: 'Taste regional pairings while meeting vetted Igbo, Yoruba, and Benin creatives.',
    heroImage: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop',
    rsvpUrl: 'https://tribalmingle.com/events/lagos-supper',
    isVirtual: false,
  },
  {
    locales: ['en', 'fr', 'pt', 'ar'],
    id: 'event-newyork-rooftop',
    title: 'Rooftop Singles Soirée',
    city: 'New York',
    country: 'United States',
    startDate: '2026-01-25T18:30:00.000Z',
    description: 'Connect with diaspora singles at an exclusive Manhattan rooftop venue with skyline views.',
    heroImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800&auto=format&fit=crop',
    rsvpUrl: 'https://tribalmingle.com/events/newyork-rooftop',
    isVirtual: false,
  },
  {
    locales: ['en', 'fr', 'pt', 'ar'],
    id: 'event-manchester-social',
    title: 'Cultural Speed Dating',
    city: 'Manchester',
    country: 'United Kingdom',
    startDate: '2026-02-01T17:00:00.000Z',
    description: 'Fast-paced connections for serious singles. Share stories, heritage, and hopes over tea.',
    heroImage: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800&auto=format&fit=crop',
    rsvpUrl: 'https://tribalmingle.com/events/manchester-social',
    isVirtual: false,
  },
]

export function getFallbackBlogPosts(locale: AppLocale, limit: number): MarketingBlogPost[] {
  return BLOG_FALLBACKS.filter((entry) => entry.locales.includes(locale)).slice(0, limit).map(({ locales, ...rest }) => rest)
}

export function getFallbackEvents(locale: AppLocale, limit: number): MarketingEvent[] {
  return EVENT_FALLBACKS.filter((entry) => entry.locales.includes(locale)).slice(0, limit).map(({ locales, ...rest }) => rest)
}

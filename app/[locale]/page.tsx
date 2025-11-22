import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heart, Shield, Star, Users, Zap } from 'lucide-react'

import { fetchLandingContent, fetchMarketingTestimonials, fetchMarketingBlogPosts, fetchMarketingEvents } from '@/lib/contentful'
import { getMarketingDictionary } from '@/lib/i18n/dictionaries'
import { marketingLocaleMeta, normalizeLocale, SUPPORTED_LOCALES } from '@/lib/i18n/locales'
import { extractHeroContextFromHeaders, getHeroVariant } from '@/lib/marketing/hero'
import { HeroSection } from '@/components/marketing/hero-section'
import { TribeMapSection } from '@/components/marketing/tribe-map-section'
import { BlogHighlightsSection } from '@/components/marketing/blog-highlights-section'
import { EventsSpotlightSection } from '@/components/marketing/events-spotlight-section'

export const revalidate = 300

const ICON_MAP = {
  zap: Zap,
  shield: Shield,
  users: Users,
  heart: Heart,
}

type PageProps = {
  params: Promise<{
    locale: string
  }>
  searchParams?: Promise<Record<string, string | string[]>>
}

export default async function MarketingPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params
  const locale = normalizeLocale(rawLocale)
  if (!SUPPORTED_LOCALES.includes(locale)) {
    notFound()
  }

  const searchParamsResolved = searchParams ? await searchParams : {}

  const [dictionary, landingContent, cmsTestimonials, blogPosts, upcomingEvents] = await Promise.all([
    getMarketingDictionary(locale),
    fetchLandingContent(locale),
    fetchMarketingTestimonials(locale, 6),
    fetchMarketingBlogPosts(locale, 3),
    fetchMarketingEvents(locale, 4),
  ])

  const heroContext = await extractHeroContextFromHeaders(locale, searchParamsResolved)
  const { variant: heroVariant } = await getHeroVariant(heroContext)

  const featuresFromCms = landingContent?.features?.filter((feature) => feature.title && feature.description)
  const featureDeck = (featuresFromCms && featuresFromCms.length > 0 ? featuresFromCms : dictionary.features).map((feature, index) => ({
    key: `${feature.title}-${index}`,
    title: feature.title || '',
    description: feature.description || '',
    iconName: feature.icon ?? dictionary.features[index % dictionary.features.length]?.icon ?? 'zap',
  }))

  const testimonials = (cmsTestimonials.length > 0
    ? cmsTestimonials
    : dictionary.testimonialsFallback.map((item, index) => ({
        id: `fallback-${index}`,
        name: item.name,
        location: item.location,
        tribe: item.tribe,
        quote: item.content,
        rating: item.rating,
      })))
    .slice(0, 6)

  const localeMeta = marketingLocaleMeta[locale]

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-background to-purple-50">
      <header className="supports-backdrop-blur:bg-background/80 sticky top-0 z-50 border-b border-purple-100 bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/triballogo.png" alt="Tribal Mingle" className="h-12 w-12 object-contain" />
            <div className="text-xs uppercase tracking-wide text-purple-500">
              {localeMeta.region} · {locale.toUpperCase()}
            </div>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-muted-foreground md:flex">
            <a href="#features" className="transition hover:text-primary">
              {dictionary.footer.features}
            </a>
            <a href="#stories" className="transition hover:text-primary">
              Stories
            </a>
            <a href="#contact" className="transition hover:text-primary">
              {dictionary.footer.contact}
            </a>
          </nav>
          <Link
            href="/sign-up"
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-90"
          >
            {heroVariant.primaryCta}
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
            <HeroSection variant={heroVariant} subcopy={dictionary.hero.subcopy} />
            <div className="rounded-3xl border border-purple-100 bg-white/70 p-6 shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-400">{dictionary.hero.featureDeckTitle}</p>
              <div className="mt-6 grid gap-4">
                {featureDeck.map((feature) => {
                  const Icon = ICON_MAP[feature.iconName as keyof typeof ICON_MAP] ?? Zap
                  return (
                    <div
                      key={feature.key}
                      className="flex items-start gap-4 rounded-2xl border border-purple-50 bg-gradient-to-r from-white to-purple-50/70 p-4"
                    >
                      <div className="rounded-full bg-accent/10 p-3 text-accent">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{feature.title}</p>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <TribeMapSection locale={locale} copy={dictionary.mapSection} />

        <section id="features" className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {dictionary.hero.featureDeckTitle}
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {featureDeck.map((feature) => {
                const Icon = ICON_MAP[feature.iconName as keyof typeof ICON_MAP] ?? Zap
                return (
                  <div key={`${feature.key}-grid`} className="rounded-2xl border border-border/60 bg-gradient-to-br from-blue-50/50 to-purple-50/70 p-6">
                    <div className="flex items-center gap-3 text-accent">
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{feature.title}</span>
                    </div>
                    <p className="mt-4 text-lg font-semibold text-foreground">{feature.title}</p>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-purple-50/70 to-blue-50/70 py-20">
          <BlogHighlightsSection posts={blogPosts} locale={locale} copy={dictionary.cmsSections.blog} />
        </section>

        <section className="bg-white py-20">
          <EventsSpotlightSection events={upcomingEvents} locale={locale} copy={dictionary.cmsSections.events} />
        </section>

        <section id="stories" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-400">Community Voices</p>
              <h2 className="mt-2 text-4xl font-bold tracking-tight text-foreground">Stories from our tribal community</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Verified members across Africa and the diaspora share why intentional dating matters.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <article key={testimonial.id} className="flex h-full flex-col rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-primary">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[testimonial.location, testimonial.tribe].filter(Boolean).join(' · ')}
                      </p>
                      {testimonial.rating ? (
                        <div className="mt-1 flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={`${testimonial.id}-star-${index}`}
                              className={`h-3 w-3 ${index + 1 <= (testimonial.rating || 0) ? 'text-yellow-400 fill-yellow-300' : 'text-muted-foreground'}`}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-4 flex-1 text-sm text-muted-foreground">
                    “{truncateQuote(testimonial.quote)}”
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-primary to-secondary py-20 text-white">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Premium Preview</p>
            <h2 className="mt-4 text-4xl font-bold">{dictionary.ctaSection.title}</h2>
            <p className="mt-4 text-lg text-white/80">{dictionary.ctaSection.description}</p>
            <Link href="/sign-up" className="mt-8 inline-block rounded-full bg-white px-10 py-4 text-lg font-semibold text-primary shadow-lg">
              {dictionary.ctaSection.cta}
            </Link>
          </div>
        </section>
      </main>

      <footer id="contact" className="bg-foreground py-12 text-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h4 className="font-semibold">{dictionary.footer.company}</h4>
              <ul className="mt-3 space-y-2 text-sm text-background/70">
                <li><Link href="/about" className="hover:text-white">{dictionary.footer.about}</Link></li>
                <li className="text-background/50">Blog ({dictionary.footer.comingSoon})</li>
                <li className="text-background/50">Careers ({dictionary.footer.comingSoon})</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">{dictionary.footer.product}</h4>
              <ul className="mt-3 space-y-2 text-sm text-background/70">
                <li><a href="#features" className="hover:text-white">{dictionary.footer.features}</a></li>
                <li className="text-background/50">Pricing ({dictionary.footer.comingSoon})</li>
                <li className="text-background/50">FAQ ({dictionary.footer.comingSoon})</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">{dictionary.footer.legal}</h4>
              <ul className="mt-3 space-y-2 text-sm text-background/70">
                <li><Link href="/privacy" className="hover:text-white">{dictionary.footer.privacy}</Link></li>
                <li><Link href="/terms" className="hover:text-white">{dictionary.footer.terms}</Link></li>
                <li><Link href="/help" className="hover:text-white">{dictionary.footer.contact}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">{dictionary.footer.connect}</h4>
              <ul className="mt-3 space-y-2 text-sm text-background/70">
                <li><a href="https://instagram.com" className="hover:text-white">Instagram</a></li>
                <li><a href="https://twitter.com" className="hover:text-white">Twitter</a></li>
                <li><a href="https://linkedin.com" className="hover:text-white">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-background/60">
            &copy; {new Date().getFullYear()} Tribal Mingle. {dictionary.footer.copyright}
          </div>
        </div>
      </footer>
    </div>
  )
}

function truncateQuote(quote?: string, limit = 220) {
  if (!quote) {
    return ''
  }
  if (quote.length <= limit) {
    return quote
  }
  return `${quote.slice(0, limit)}...`
}
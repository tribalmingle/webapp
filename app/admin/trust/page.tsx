import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heart, Shield, Star, Users, Zap, ArrowRight, Crown, Sparkles, MapPin, TrendingUp } from 'lucide-react'

import { fetchLandingContent, fetchMarketingTestimonials, fetchMarketingBlogPosts, fetchMarketingEvents } from '@/lib/contentful'
import { getMarketingDictionary } from '@/lib/i18n/dictionaries'
import { marketingLocaleMeta, normalizeLocale, SUPPORTED_LOCALES } from '@/lib/i18n/locales'
import { extractHeroContextFromHeaders, getHeroVariant } from '@/lib/marketing/hero'
import { HeroSection } from '@/components/marketing/hero-section'
import { TribeMapSection } from '@/components/marketing/tribe-map-section'
import { BlogHighlightsSection } from '@/components/marketing/blog-highlights-section'
import { HeroImageCarousel } from '@/components/marketing/hero-image-carousel'
import { EventsSpotlightSection } from '@/components/marketing/events-spotlight-section'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { StaggerGrid, SlideUp, FadeIn, ScaleIn } from '@/components/motion'

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
    <div className="min-h-screen bg-background-primary">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 border-b border-border-gold/20">
        {/* Animated gradient background matching hero */}
        <div className="absolute inset-0 bg-hero-gradient">
          <div className="absolute top-0 left-20 w-64 h-64 bg-purple-royal/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-0 right-20 w-64 h-64 bg-gold-warm/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <img src="/triballogo.png" alt="TribalMingle" className="h-16 w-auto object-contain" />
          </div>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-text-secondary md:flex">
            <a href="#features" className="transition-colors hover:text-gold-warm">
              {dictionary.footer.features}
            </a>
            <a href="#stories" className="transition-colors hover:text-gold-warm">
              Stories
            </a>
            <a href="#contact" className="transition-colors hover:text-gold-warm">
              {dictionary.footer.contact}
            </a>
          </nav>
          <Link href="/sign-up">
            <Button variant="gold" size="default">
              {heroVariant.primaryCta}
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Premium Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-hero-gradient">
            {/* Floating gradient orbs */}
            <div className="absolute top-20 left-20 w-96 h-96 bg-purple-royal/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-gold-warm/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          
          <div className="relative z-10 mx-auto max-w-7xl px-6 pt-4 pb-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Hero Copy */}
              <SlideUp>
                <Badge variant="gold" className="mb-6">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Africa's Premier Dating Platform
                </Badge>
                
                <h1 className="text-display-lg font-display text-text-primary mb-6">
                  Find Love Within
                  <span className="block bg-gold-gradient bg-clip-text text-transparent mt-2">
                    Your Tribe
                  </span>
                </h1>
                
                <p className="text-body-lg text-text-secondary mb-4 max-w-xl">
                  AI-powered matching for African professionals seeking meaningful connections
                  rooted in culture, values, and shared heritage.
                </p>
                
                <p className="text-sm text-gold-warm font-semibold mb-8 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gold-warm/20 text-gold-warm text-xs">✓</span>
                  Exclusively for professionals 30 years and above
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/sign-up">
                    <Button variant="gold" size="xl" className="shadow-glow-gold-strong group">
                      Start Your Journey
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  
                  <Link href="#video">
                    <Button variant="outline" size="xl">
                      Watch Video
                    </Button>
                  </Link>
                </div>
                
                {/* Social proof */}
                <div className="mt-12 flex items-center gap-6">
                  <div>
                    <div className="text-3xl font-bold text-text-primary">10,000+</div>
                    <div className="text-sm text-text-tertiary">Active Members</div>
                  </div>
                  <div className="w-px h-12 bg-border-gold" />
                  <div>
                    <div className="text-3xl font-bold text-text-primary">2,500+</div>
                    <div className="text-sm text-text-tertiary">Successful Matches</div>
                  </div>
                </div>
              </SlideUp>
              
              {/* Right: Hero Image Carousel */}
              <FadeIn delay={0.3}>
                <div className="relative w-full">
                  <div className="absolute inset-0 bg-gold-gradient opacity-20 blur-3xl rounded-full -z-10" />
                  <HeroImageCarousel />
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* TODO: REVIEW BY FEBRUARY 20, 2026 - Re-enable tribe map once we have enough members */}
        {/* <TribeMapSection locale={locale} copy={dictionary.mapSection} /> */}

        {/* Premium Features Section */}
        <section id="features" className="bg-background-secondary py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SlideUp>
              <div className="text-center mb-12">
                <Badge variant="gold" className="mb-4">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium Features
                </Badge>
                <h2 className="text-h1 font-display text-text-primary">
                  Everything You Need to Find Your Match
                </h2>
                <p className="text-body text-text-secondary mt-4 max-w-2xl mx-auto">
                  World-class tools powered by AI to connect you with compatible partners
                </p>
              </div>
            </SlideUp>
            
            <StaggerGrid columns={2}>
              {featureDeck.map((feature) => {
                const Icon = ICON_MAP[feature.iconName as keyof typeof ICON_MAP] ?? Zap
                return (
                  <Card key={`${feature.key}-grid`} variant="glass" className="p-8 card-lift">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gold-gradient flex items-center justify-center shadow-glow-gold">
                        <Icon className="h-6 w-6 text-background-primary" />
                      </div>
                      <h3 className="text-h4 text-text-primary">{feature.title}</h3>
                    </div>
                    <p className="text-body-sm text-text-secondary">{feature.description}</p>
                  </Card>
                )
              })}
            </StaggerGrid>
          </div>
        </section>

        <section className="bg-background-primary py-20">
          <BlogHighlightsSection posts={blogPosts} locale={locale} copy={dictionary.cmsSections.blog} />
        </section>

        <section className="bg-background-secondary py-20">
          <EventsSpotlightSection events={upcomingEvents} locale={locale} copy={dictionary.cmsSections.events} />
        </section>

        <section id="stories" className="px-4 py-20 sm:px-6 lg:px-8 bg-background-secondary">
          <div className="mx-auto max-w-5xl">
            <SlideUp>
              <div className="text-center mb-12">
                <Badge variant="purple" className="mb-4">
                  <Crown className="w-3 h-3 mr-1" />
                  Community Voices
                </Badge>
                <h2 className="text-h1 font-display text-text-primary">
                  Stories from Our Tribal Community
                </h2>
                <p className="text-body text-text-secondary mt-4 max-w-2xl mx-auto">
                  Verified members across Africa and the diaspora share why intentional dating matters.
                </p>
              </div>
            </SlideUp>
            <StaggerGrid columns={3}>
              {testimonials.map((testimonial, index) => (
                <FadeIn key={testimonial.id} delay={index * 0.1}>
                  <Card variant="glass" className="flex h-full flex-col p-6 card-lift">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-gradient shadow-lg text-white font-semibold">
                      {testimonial.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text-primary truncate">{testimonial.name}</p>
                        <p className="text-body-xs text-text-tertiary truncate">
                        {[testimonial.location, testimonial.tribe].filter(Boolean).join(' · ')}
                      </p>
                      {testimonial.rating ? (
                        <div className="mt-1 flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={`${testimonial.id}-star-${index}`}
                              className={`h-3 w-3 ${index + 1 <= (testimonial.rating || 0) ? 'text-gold-warm fill-gold-warm' : 'text-text-tertiary'}`}
                            />
                          ))}
                        </div>
                      ) : null}
                      </div>
                    </div>
                    <p className="flex-1 text-body-sm text-text-secondary italic">
                    “{truncateQuote(testimonial.quote)}”
                  </p>
                  </Card>
                </FadeIn>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* Premium CTA Section */}
        <section className="relative bg-purple-gradient py-32 text-white overflow-hidden">
          {/* Animated background orb */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-warm/20 rounded-full blur-3xl animate-pulse" />
          </div>
          
          <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <ScaleIn>
              <Badge variant="gold" className="mb-6">
                <Sparkles className="w-3 h-3 mr-1" />
                Premium Preview
              </Badge>
              <h2 className="text-display-md font-display mb-6">{dictionary.ctaSection.title}</h2>
              <p className="text-body-lg text-white/90 mb-8">{dictionary.ctaSection.description}</p>
              <Link href="/sign-up">
                <Button variant="gold" size="xl" className="shadow-glow-gold-strong">
                  {dictionary.ctaSection.cta}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </ScaleIn>
          </div>
        </section>
      </main>

      {/* Premium Footer */}
      <footer id="contact" className="bg-background-primary border-t border-border-gold/20 py-12 text-text-secondary">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h4 className="font-semibold text-text-primary">{dictionary.footer.company}</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-gold-warm transition-colors">{dictionary.footer.about}</Link></li>
                <li className="text-text-tertiary">Blog ({dictionary.footer.comingSoon})</li>
                <li className="text-text-tertiary">Careers ({dictionary.footer.comingSoon})</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary">{dictionary.footer.product}</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a href="#features" className="hover:text-gold-warm transition-colors">{dictionary.footer.features}</a></li>
                <li className="text-text-tertiary">Pricing ({dictionary.footer.comingSoon})</li>
                <li className="text-text-tertiary">FAQ ({dictionary.footer.comingSoon})</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary">{dictionary.footer.legal}</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-gold-warm transition-colors">{dictionary.footer.privacy}</Link></li>
                <li><Link href="/terms" className="hover:text-gold-warm transition-colors">{dictionary.footer.terms}</Link></li>
                <li><Link href="/help" className="hover:text-gold-warm transition-colors">{dictionary.footer.contact}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary">{dictionary.footer.connect}</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a href="https://instagram.com" className="hover:text-gold-warm transition-colors">Instagram</a></li>
                <li><a href="https://twitter.com" className="hover:text-gold-warm transition-colors">Twitter</a></li>
                <li><a href="https://linkedin.com" className="hover:text-gold-warm transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-border-gold/10 pt-6 text-center text-xs text-text-tertiary">
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
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heart, Shield, Star, Users, Zap, ArrowRight, Crown, Sparkles, MapPin, TrendingUp, Play } from 'lucide-react'
import { MobileNav } from '@/components/marketing/mobile-nav'

import { fetchLandingContent, fetchMarketingTestimonials, fetchMarketingBlogPosts, fetchMarketingEvents } from '@/lib/contentful'
import { getMarketingDictionary } from '@/lib/i18n/dictionaries'
import { marketingLocaleMeta, normalizeLocale, SUPPORTED_LOCALES } from '@/lib/i18n/locales'
import { extractHeroContextFromHeaders, getHeroVariant } from '@/lib/marketing/hero'
import { HeroSection } from '@/components/marketing/hero-section'
import { TribeMapSection } from '@/components/marketing/tribe-map-section'
import { BlogHighlightsSection } from '@/components/marketing/blog-highlights-section'
import { HeroImageCarousel } from '@/components/marketing/hero-image-carousel'
import { CountUpStats, MouseParallax, MagneticWrapper, GlowCard, Marquee } from '@/components/ui/interactive-elements'
import { EventsSpotlightSection } from '@/components/marketing/events-spotlight-section'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { StaggerGrid, SlideUp, FadeIn, ScaleIn } from '@/components/motion'
import { ScrollFadeIn } from '@/components/motion/scroll-fade-in'
import { LiveSignupFeed } from '@/components/marketing/live-signup-feed'
import { CountdownTimer } from '@/components/marketing/countdown-timer'
import { FeatureCard } from '@/components/marketing/feature-card'
import { TestimonialCard } from '@/components/marketing/testimonial-card'
import { DATING_TIPS } from '@/lib/dating-tips/tips-data'

export const revalidate = 300

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
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-gold/20">
        {/* Animated gradient background matching hero */}
        <div className="absolute inset-0 bg-hero-gradient">
          <div className="absolute top-0 left-20 w-64 h-64 bg-purple-royal/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-0 right-20 w-64 h-64 bg-gold-warm/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative mx-auto flex h-14 md:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <MobileNav 
            primaryCta={heroVariant.primaryCta} 
            dictionary={{
              footer: {
                features: dictionary.footer.features,
                contact: dictionary.footer.contact
              }
            }} 
          />
          <div className="flex items-center">
            <img src="/triballogo.png" alt="TribalMingle" className="h-12 md:h-16 w-auto object-contain" />
          </div>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-text-secondary md:flex">
            <a href="#features" className="transition-colors hover:text-purple-royal">
              How It Works
            </a>
            <a href="#stories" className="transition-colors hover:text-purple-royal">
              Success Stories
            </a>
            <a href="#events" className="transition-colors hover:text-purple-royal">
              Events
            </a>
            <a href="#dating-tips" className="transition-colors hover:text-purple-royal">
              Dating Advice & Tips
            </a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="default" className="border-gold-warm text-gold-warm hover:bg-gold-warm hover:text-white">
                Login
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-purple-gradient" size="default">
                {heroVariant.primaryCta}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Premium Hero Section */}
        <section className="relative min-h-[calc(100dvh-4rem)] md:min-h-screen flex items-center justify-center overflow-hidden px-4 pt-16 md:pt-20 pb-12">
          {/* Dark purple gradient background */}
          <div className="absolute inset-0 bg-hero-gradient">
            <MouseParallax strength={0.02}>
              {/* Floating gradient orbs */}
              <div className="absolute top-20 left-20 w-48 h-48 md:w-96 md:h-96 bg-purple-royal/30 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-20 right-20 w-96 h-96 bg-gold-warm/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </MouseParallax>
          </div>
          
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          
          <div className="relative z-10 mx-auto max-w-7xl px-6 pt-4 pb-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Hero Copy */}
              <SlideUp>
                <Badge variant="gold" className="mb-6 bg-gold-warm text-white border-transparent shadow-md">
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
                
                <p className="text-sm text-text-secondary font-semibold mb-8 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gold-warm text-white text-xs">✓</span>
                  Exclusively for professionals 30 years and above
                </p>
                
                <div className="flex flex-col gap-4 w-full sm:flex-row sm:w-auto">
                  <Link href="/sign-up" className="w-full sm:w-auto">
                    <MagneticWrapper>
                      <Button className="bg-purple-gradient w-full sm:w-auto min-h-[44px] min-w-[44px]" size="xl">
                        Start Your Journey
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </MagneticWrapper>
                  </Link>
                  
                  <Link href="#video" className="w-full sm:w-auto">
                    <Button variant="outline" size="xl" className="w-full sm:w-auto min-h-[44px] min-w-[44px]">
                      Watch Video
                    </Button>
                  </Link>
                </div>
                
                {/* Social proof */}
                <div className="mt-12 flex items-center gap-6">
                  <CountUpStats value={10000} label="Active Members" suffix="+" />
                  <div className="w-px h-12 bg-border-gold" />
                  <CountUpStats value={2500} label="Successful Matches" suffix="+" />
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
        <section id="features" className="relative bg-neutral-50 py-24 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-linear-to-b from-purple-royal/5 via-transparent to-gold-warm/5" />
            <div className="absolute top-40 right-20 w-[500px] h-[500px] bg-purple-royal/8 rounded-full blur-3xl" />
            <div className="absolute bottom-40 left-20 w-[500px] h-[500px] bg-gold-warm/8 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollFadeIn direction="up">
              <div className="text-center mb-16">
                <Badge variant="gold" className="mb-6 bg-gold-warm text-white border-transparent shadow-md">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium Features
                </Badge>
                <h2 className="text-h1 font-display text-purple-royal-dark mb-6">
                  Everything You Need to Find Your Match
                </h2>
                <p className="text-body-lg text-neutral-700 max-w-3xl mx-auto">
                  World-class tools powered by AI to connect you with compatible partners
                </p>
              </div>
            </ScrollFadeIn>
            
            {/* Updated grid with staggered animation */}
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {featureDeck.map((feature, index) => (
                <FeatureCard
                  key={feature.key}
                  iconName={feature.iconName as 'zap' | 'shield' | 'heart' | 'users' | 'star'}
                  title={feature.title}
                  description={feature.description}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <section className="relative bg-white py-24 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-linear-to-br from-purple-royal/5 via-transparent to-transparent" />
            <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-gold-warm/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10">
            <BlogHighlightsSection posts={blogPosts} locale={locale} copy={dictionary.cmsSections.blog} />
          </div>
        </section>

        {/* Dating Tips Section */}
        <section id="dating-tips" className="relative bg-gradient-to-b from-white via-purple-50 to-white py-24 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-royal/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollFadeIn direction="up">
              <div className="text-center mb-12">
                <Badge variant="gold" className="mb-6 bg-gold-warm text-white border-transparent shadow-md">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Expert Advice
                </Badge>
                <h2 className="text-h1 font-display text-purple-royal-dark mb-4">
                  Dating Advice & Tips
                </h2>
                <p className="text-body-lg text-neutral-700 max-w-3xl mx-auto">
                  Practical guidance for building meaningful relationships
                </p>
              </div>
            </ScrollFadeIn>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {DATING_TIPS.slice(0, 2).sort((a, b) => 
                new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
              ).map((tip, index) => (
                <ScrollFadeIn key={tip.id} delay={index * 0.1} direction="up">
                  <Card className="flex flex-col h-full overflow-hidden hover:shadow-xl transition-all">
                    <div className="relative h-64 w-full overflow-hidden">
                      <img
                        src={tip.featuredImage}
                        alt={tip.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <Badge variant="outline" className="self-start mb-3 text-xs">
                        {tip.category.replace('-', ' ')}
                      </Badge>
                      <h3 className="text-h3 font-display text-purple-royal-dark mb-3">
                        {tip.title}
                      </h3>
                      <p className="text-body-sm text-neutral-700 mb-4 flex-1">
                        {tip.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-neutral-600 mb-4 pb-4 border-t border-neutral-100 pt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-royal to-gold-warm flex items-center justify-center text-white font-bold text-xs">
                            CC
                          </div>
                          <span className="font-bold text-purple-royal">Moving on Clinic by CC</span>
                        </div>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {tip.readingTime} min
                        </span>
                      </div>
                      <Link href={`/${locale}/dating-tips/${tip.id}`}>
                        <Button variant="outline" className="w-full">
                          Read Article <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </ScrollFadeIn>
              ))}
            </div>

            <div className="text-center">
              <Link href={`/${locale}/dating-tips`}>
                <Button size="lg" className="bg-purple-gradient">
                  View All Dating Tips <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Events Section - Redesigned with light background */}
        <section className="relative bg-gradient-to-b from-purple-50 via-white to-neutral-50 py-24 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
            {/* Floating sparkle effects */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-gold-warm/10 rounded-full blur-2xl animate-float" />
            <div className="absolute bottom-40 right-20 w-40 h-40 bg-purple-royal/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-pink-500/10 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }} />
          </div>
          
          <div className="relative z-10">
            <EventsSpotlightSection events={upcomingEvents} locale={locale} copy={dictionary.cmsSections.events} theme="light" />
          </div>
        </section>

        <section id="stories" className="relative px-4 py-20 sm:px-6 lg:px-8 bg-background-primary overflow-hidden">
          {/* Premium background with multiple orbs */}
          <div className="absolute inset-0 bg-linear-to-b from-background-secondary to-background-primary" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-royal/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-gold-warm/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-royal/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 mx-auto max-w-5xl">
            <ScrollFadeIn direction="up">
              <div className="text-center mb-12">
                <Badge variant="purple" className="mb-4 bg-purple-royal text-white border-transparent shadow-md">
                  <Crown className="w-3 h-3 mr-1" />
                  Community Voices
                </Badge>
                <h2 className="text-h1 font-display text-gold-warm">
                  Stories from Our Tribal Community
                </h2>
                <p className="text-body text-white mt-4 max-w-2xl mx-auto">
                  Verified members across Africa and the diaspora share why intentional dating matters.
                </p>
              </div>
            </ScrollFadeIn>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <ScrollFadeIn key={testimonial.id} delay={index * 0.1} direction="up">
                  <TestimonialCard
                  id={testimonial.id}
                  name={testimonial.name}
                  location={testimonial.location}
                  tribe={testimonial.tribe}
                  quote={testimonial.quote}
                  rating={testimonial.rating || 5}
                  hasVideo={index === 0}
                  index={index}
                />
                </ScrollFadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Premium CTA Section */}
        <section className="relative bg-purple-gradient py-32 text-white overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-gold-warm/25 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-20 left-20 w-80 h-80 bg-gold-warm/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }} />
          </div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          
          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <ScrollFadeIn direction="up">
              <Badge variant="gold" className="mb-8 bg-white text-purple-royal border-transparent shadow-lg">
                <Sparkles className="w-4 h-4 mr-2" />
                Join Today
              </Badge>
              <h2 className="text-display-lg font-display mb-6">{dictionary.ctaSection.title}</h2>
              <p className="text-body-xl text-white/95 mb-10 max-w-2xl mx-auto leading-relaxed">
                {dictionary.ctaSection.description}
              </p>
              <Link href="/sign-up">
                <Button className="bg-white text-purple-royal hover:bg-neutral-100 shadow-xl text-lg px-10 py-6 h-16 min-h-[44px] min-w-[44px]">
                  {dictionary.ctaSection.cta}
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </Link>
            </ScrollFadeIn>
          </div>
        </section>
      </main>

      {/* Premium Footer */}
      <footer id="contact" className="relative bg-neutral-950 border-t border-white/10 py-16 text-neutral-400 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-purple-royal/5" />
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4 mb-0 pb-0">
            <div>
              <h4 className="font-semibold text-white">{dictionary.footer.company}</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-purple-royal-light transition-colors">{dictionary.footer.about}</Link></li>
                <li><Link href="/blog" className="hover:text-purple-royal-light transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-purple-royal-light transition-colors">Careers</Link></li>
              </ul>
              {/* Logo - positioned right below Careers */}
              <div className="mt-4">
                <img src="/triballogo.png" alt="Tribal Mingle" className="h-32 w-auto" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white">{dictionary.footer.product}</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a href="#features" className="hover:text-purple-royal-light transition-colors">{dictionary.footer.features}</a></li>
                <li><Link href="/pricing" className="hover:text-purple-royal-light transition-colors">Pricing</Link></li>
                <li><Link href="/faq" className="hover:text-purple-royal-light transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">{dictionary.footer.legal}</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-purple-royal-light transition-colors">{dictionary.footer.privacy}</Link></li>
                <li><Link href="/terms" className="hover:text-purple-royal-light transition-colors">{dictionary.footer.terms}</Link></li>
                <li><Link href="/help" className="hover:text-purple-royal-light transition-colors">{dictionary.footer.contact}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">Stay Connected</h4>
              <p className="mt-3 text-sm text-neutral-500 mb-4">
                Join our waitlist for dating tips and exclusive event invites.
              </p>
              <div className="flex gap-2 mb-6">
                <Input placeholder="Enter your email" className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-purple-royal/50" />
                <Button variant="default" size="icon">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
              <ul className="space-y-2 text-sm">
                <li><a href="https://instagram.com" className="hover:text-purple-royal-light transition-colors">Instagram</a></li>
                <li><a href="https://twitter.com" className="hover:text-purple-royal-light transition-colors">Twitter</a></li>
                <li><a href="https://linkedin.com" className="hover:text-purple-royal-light transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-neutral-600">
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
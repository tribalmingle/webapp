import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { BlogHighlights } from "@/components/sections/blog-highlights"
import { CtaSection } from "@/components/sections/cta-section"
import { EventsGrid } from "@/components/sections/events-grid"
import { HeroSection } from "@/components/sections/hero"
import { MetricsGrid } from "@/components/sections/metrics-grid"
import { TestimonialsSection } from "@/components/sections/testimonials"
import { TribeMapPreview } from "@/components/sections/tribe-map-preview"
import { loadMarketingContent } from "@/lib/contentful/marketing-content"
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isSupportedLocale } from "@/lib/i18n/config"

export const dynamicParams = false
export const revalidate = 900

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isSupportedLocale(params.locale) ? params.locale : DEFAULT_LOCALE
  const content = await loadMarketingContent(locale)

  return {
    title: `${content.hero.headline} · Tribal Mingle`,
    description: content.hero.body,
    alternates: {
      canonical: `/${locale}`,
    },
  }
}

export default async function LocalePage({ params }: { params: { locale: string } }) {
  if (!isSupportedLocale(params.locale)) {
    notFound()
  }
  const content = await loadMarketingContent(params.locale)

  return (
    <main className="space-y-10">
      <HeroSection
        eyebrow={content.hero.eyebrow}
        headline={content.hero.headline}
        body={content.hero.body}
        primaryCta={content.hero.primaryCta}
        secondaryCta={content.hero.secondaryCta}
        locale={params.locale}
      />
      <MetricsGrid title={content.metrics.title} items={content.metrics.items} />
      <TribeMapPreview title={content.map.title} subtitle={content.map.subtitle} clusters={content.map.clusters} />
      <EventsGrid title={content.events.title} items={content.events.items} />
      <TestimonialsSection title={content.testimonials.title} quotes={content.testimonials.quotes} />
      <BlogHighlights title={content.blog.title} posts={content.blog.posts} />
      <CtaSection title={content.cta.title} body={content.cta.body} button={content.cta.button} />
    </main>
  )
}

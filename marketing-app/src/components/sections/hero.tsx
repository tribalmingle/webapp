
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { useLaunchDarklyFlag } from "@/components/feature-flags/launchdarkly-provider"
import { trackMarketingEvent } from "@/lib/analytics/track-event"

interface HeroSectionProps {
  eyebrow: string
  headline: string
  body: string
  primaryCta: string
  secondaryCta: string
  locale: string
}

type HeroPersonalization = Partial<Pick<HeroSectionProps, "eyebrow" | "headline" | "body" | "primaryCta" | "secondaryCta">>

const HERO_VARIANTS: Record<string, HeroPersonalization> = {
  diaspora_scholars: {
    eyebrow: "Diaspora Scholars • Cultural Labs",
    headline: "Chart love maps across Toronto, Accra, and London",
    body: "Pair diaspora professionals with heritage-rooted partners using our concierge matching backlog and guardian network.",
    primaryCta: "Book a concierge intro",
  },
  guardian_focus: {
    eyebrow: "Guardian Approved",
    headline: "Bring guardians, aunties, and trusted voices into the process",
    body: "Family portals and trust automation keep every introduction grounded in tradition and modern safety heuristics.",
    secondaryCta: "Preview guardian portal",
  },
}

export function HeroSection({ eyebrow, headline, body, primaryCta, secondaryCta, locale }: HeroSectionProps) {
  const variantKey = useLaunchDarklyFlag<string>("marketing-hero-variant", "default")
  const personalization = HERO_VARIANTS[variantKey]
  const impressionRef = useRef<string | null>(null)
  const [countryCode, setCountryCode] = useState<string | undefined>(undefined)

  const resolvedCopy = useMemo(() => {
    return {
      eyebrow: personalization?.eyebrow ?? eyebrow,
      headline: personalization?.headline ?? headline,
      body: personalization?.body ?? body,
      primaryCta: personalization?.primaryCta ?? primaryCta,
      secondaryCta: personalization?.secondaryCta ?? secondaryCta,
    }
  }, [personalization, eyebrow, headline, body, primaryCta, secondaryCta])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    if (impressionRef.current === `${variantKey}-${locale}`) {
      return
    }
    impressionRef.current = `${variantKey}-${locale}`
    trackMarketingEvent("hero_variant_rendered", {
      locale,
      variant: variantKey,
    })
  }, [variantKey, locale])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const controller = new AbortController()

    fetch("https://ipapi.co/json/", { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (data?.country_code) {
          setCountryCode(data.country_code)
        }
      })
      .catch(() => {
        /* noop */
      })

    return () => controller.abort()
  }, [])

  const handleCtaClick = (ctaType: "primary" | "secondary") => {
    trackMarketingEvent("marketing_cta_click", {
      ctaType,
      variant: variantKey,
      locale,
      countryCode,
    })
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-brand-purple/10 bg-gradient-to-br from-brand-purple/10 via-white to-brand-sand/70 px-6 py-16 shadow-lg sm:px-12">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-purple/70">{resolvedCopy.eyebrow}</p>
      <div className="mt-4 space-y-6 lg:flex lg:items-center lg:gap-10 lg:space-y-0">
        <div className="lg:w-2/3">
          <h1 className="text-4xl font-semibold leading-tight text-brand-night sm:text-5xl lg:text-6xl">
            {resolvedCopy.headline}
          </h1>
          <p className="mt-6 text-lg text-brand-night/80 sm:text-xl">{resolvedCopy.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/waitlist`}
              className="inline-flex items-center justify-center rounded-full bg-brand-purple px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-brand-night"
              onClick={() => handleCtaClick("primary")}
            >
              {resolvedCopy.primaryCta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/tribes`}
              className="inline-flex items-center justify-center rounded-full border border-brand-purple/30 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-night"
              onClick={() => handleCtaClick("secondary")}
            >
              {resolvedCopy.secondaryCta}
            </Link>
          </div>
        </div>
        <div className="mt-10 grid flex-1 gap-4 rounded-2xl bg-white/70 p-6 text-sm text-brand-night shadow-inner backdrop-blur lg:mt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-purple/60">Launch signals</p>
          <div className="flex flex-wrap gap-3 text-xs font-medium text-brand-night/70">
            <span className="rounded-full bg-brand-purple/10 px-4 py-1">Diaspora spotlights</span>
            <span className="rounded-full bg-brand-purple/10 px-4 py-1">Guardian approvals</span>
            <span className="rounded-full bg-brand-purple/10 px-4 py-1">AI coach previews</span>
          </div>
          <div className="rounded-2xl border border-brand-purple/20 bg-white/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-purple/60">Featured waitlist cities</p>
            <p className="mt-3 text-lg font-semibold">Accra · London · Toronto · Lagos · Paris</p>
          </div>
        </div>
      </div>
    </section>
  )
}

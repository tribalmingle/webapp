import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle2, Shield, Sparkles, Users } from 'lucide-react'

import { FamilyPortalHeroCtas } from '@/components/family-portal/hero-cta-buttons'
import { FamilyPortalInviteForm } from '@/components/family-portal/invite-form'
import { getMarketingDictionary } from '@/lib/i18n/dictionaries'
import { marketingLocaleMeta, normalizeLocale, SUPPORTED_LOCALES } from '@/lib/i18n/locales'

export const revalidate = 300

const ICON_MAP = {
  shield: Shield,
  users: Users,
  sparkles: Sparkles,
} as const

const CTA_TARGET_ID = 'invite-flow'
const TRUST_SECTION_ID = 'trust-safeguards'
const FAQ_SECTION_ID = 'family-faq'

const WORKFLOW_STUB_ACTION = '/api/guardian-invites/request'

const ANALYTICS_PLACEHOLDERS = {
  heroPrimary: 'family-portal.hero.primary-cta',
  heroSecondary: 'family-portal.hero.secondary-cta',
  inviteSubmit: 'family-portal.invite.submit',
} as const

type PageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function FamilyPortalPage({ params }: PageProps) {
  const { locale: rawLocale } = await params
  const locale = normalizeLocale(rawLocale)

  if (!SUPPORTED_LOCALES.includes(locale)) {
    notFound()
  }

  const dictionary = await getMarketingDictionary(locale)
  const copy = dictionary.familyPortal

  if (!copy) {
    notFound()
  }

  const localeMeta = marketingLocaleMeta[locale]

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#F4F0FF] via-white to-[#E8F6FF]">
      <header className="supports-backdrop-blur:bg-background/80 sticky top-0 z-40 border-b border-purple-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={`/${locale}`} className="flex items-center gap-3 text-primary" prefetch={false}>
            <img src="/triballogo.png" alt="Tribal Mingle" className="h-12 w-12" />
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500">
              {localeMeta.region} · {locale.toUpperCase()}
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex">
            <a href="#pillars" className="transition hover:text-primary">
              Pillars
            </a>
            <a href={`#${TRUST_SECTION_ID}`} className="transition hover:text-primary">
              {copy.trustSignals.title}
            </a>
            <a href={`#${FAQ_SECTION_ID}`} className="transition hover:text-primary">
              {copy.faq.title}
            </a>
          </nav>
          <Link
            href="/sign-up"
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-90"
          >
            {dictionary.ctaSection.cta}
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[3fr,2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-500">{copy.hero.eyebrow}</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{copy.hero.title}</h1>
              <p className="mt-4 text-lg text-muted-foreground">{copy.hero.description}</p>
              <FamilyPortalHeroCtas
                locale={locale}
                primaryLabel={copy.hero.primaryCta}
                secondaryLabel={copy.hero.secondaryCta}
                primaryTarget={`#${CTA_TARGET_ID}`}
                secondaryTarget={`#${TRUST_SECTION_ID}`}
              />
            </div>
            <div className="rounded-3xl border border-purple-100 bg-white/90 p-8 shadow-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-400">Trusted friend snapshot</p>
              <div className="mt-6 space-y-4 text-sm text-muted-foreground">
                {copy.trustSignals.items.slice(0, 3).map((item, index) => (
                  <div key={`snapshot-${index}`} className="flex items-start gap-3 rounded-2xl border border-purple-50 bg-purple-50/60 p-4">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-xs text-muted-foreground">
                *Analytics placeholders ready for Segment hook-ins once the invite API ships.
              </div>
            </div>
          </div>
        </section>

        <section id="pillars" className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">{copy.hero.eyebrow}</h2>
            <p className="mt-3 text-center text-muted-foreground">The essentials every trusted friend told us they needed.</p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {copy.pillars.map((pillar, index) => {
                const Icon = ICON_MAP[pillar.icon as keyof typeof ICON_MAP] ?? Shield
                return (
                  <div key={`${pillar.title}-${index}`} className="rounded-3xl border border-border/60 bg-gradient-to-br from-purple-50/80 to-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 text-primary">
                      <Icon className="h-6 w-6" />
                      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">{pillar.title}</span>
                    </div>
                    <p className="mt-4 text-lg font-semibold text-foreground">{pillar.title}</p>
                    <p className="text-sm text-muted-foreground">{pillar.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-gradient-to-br from-blue-50/60 to-purple-50/60 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">{copy.howItWorks.title}</p>
              <h2 className="mt-3 text-3xl font-bold text-foreground">{copy.hero.title}</h2>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {copy.howItWorks.steps.map((step, index) => (
                <div key={`${step.title}-${index}`} className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
                    {index + 1}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link href={`#${CTA_TARGET_ID}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                {copy.howItWorks.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section id={TRUST_SECTION_ID} className="bg-white py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground">{copy.trustSignals.title}</h2>
            <p className="mt-3 text-base text-muted-foreground">
              Controls and audit trails your trusted friends can rely on.
            </p>
            <div className="mt-10 space-y-4">
              {copy.trustSignals.items.map((item, index) => (
                <div key={`trust-${index}`} className="flex items-start gap-3 rounded-2xl border border-purple-100 bg-purple-50/50 p-5">
                  <CheckCircle2 className="mt-1 h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id={CTA_TARGET_ID} className="bg-gradient-to-r from-primary to-secondary py-20 text-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-white/20 bg-white/5 p-8 shadow-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">Trusted friend invite beta</p>
              <h2 className="mt-4 text-3xl font-bold">Request early access</h2>
              <p className="mt-2 text-white/80">
                Share how you plan to involve your family and we&apos;ll fast-track your trusted friend dashboard setup.
              </p>
              <FamilyPortalInviteForm
                action={WORKFLOW_STUB_ACTION}
                locale={locale}
                regionHint={localeMeta.region}
                submitLabel={copy.hero.primaryCta}
              />
              <p className="mt-4 text-xs text-white/80">
                This form is a stub. We&apos;ll confirm via email until the automated trusted friend workflow is live.
              </p>
            </div>
          </div>
        </section>

        <section id={FAQ_SECTION_ID} className="bg-white py-20">
          <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:px-8 lg:grid-cols-[1.2fr,0.8fr]">
            <div>
              <h2 className="text-3xl font-bold text-foreground">{copy.faq.title}</h2>
              <div className="mt-6 space-y-4">
                {copy.faq.items.map((item, index) => (
                  <details key={`${item.question}-${index}`} className="rounded-2xl border border-border/70 p-4">
                    <summary className="cursor-pointer text-lg font-semibold text-foreground">
                      {item.question}
                    </summary>
                    <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-purple-100 bg-purple-50/60 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-500">{copy.support.title}</p>
              <p className="mt-3 text-lg text-muted-foreground">{copy.support.description}</p>
              <Link
                href={copy.support.contactHref}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm"
              >
                {copy.support.contactCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-xs text-muted-foreground">{copy.support.responseTime}</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-foreground py-8 text-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 text-sm text-background/80">
          <span>&copy; {new Date().getFullYear()} Tribal Mingle</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white">
              {dictionary.footer.privacy}
            </Link>
            <Link href="/terms" className="hover:text-white">
              {dictionary.footer.terms}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

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
    <div className="flex min-h-screen flex-col bg-background-primary">
      <header className="sticky top-0 z-50 border-b border-border-gold/20 bg-background-primary/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={`/${locale}`} className="flex items-center gap-3" prefetch={false}>
            <img src="/triballogo.png" alt="Tribal Mingle" className="h-16 w-auto object-contain" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-text-secondary md:flex">
            <a href="#pillars" className="transition-colors hover:text-gold-warm">
              Pillars
            </a>
            <a href={`#${TRUST_SECTION_ID}`} className="transition-colors hover:text-gold-warm">
              {copy.trustSignals.title}
            </a>
            <a href={`#${FAQ_SECTION_ID}`} className="transition-colors hover:text-gold-warm">
              {copy.faq.title}
            </a>
          </nav>
          <Link
            href="/sign-up"
            className="rounded bg-gold-gradient px-6 py-2.5 text-sm font-semibold text-bg-primary shadow-glow-gold transition hover:scale-105"
          >
            {dictionary.ctaSection.cta}
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-4 py-16 sm:px-6 lg:px-8 bg-background-primary">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[3fr,2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold-warm">{copy.hero.eyebrow}</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl font-display">{copy.hero.title}</h1>
              <p className="mt-4 text-lg text-text-secondary">{copy.hero.description}</p>
              <FamilyPortalHeroCtas
                locale={locale}
                primaryLabel={copy.hero.primaryCta}
                secondaryLabel={copy.hero.secondaryCta}
                primaryTarget={`#${CTA_TARGET_ID}`}
                secondaryTarget={`#${TRUST_SECTION_ID}`}
              />
            </div>
            <div className="rounded-3xl border border-border-gold/30 bg-bg-secondary/60 backdrop-blur-xl p-8 shadow-premium">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-royal">Trusted friend snapshot</p>
              <div className="mt-6 space-y-4 text-sm text-text-secondary">
                {copy.trustSignals.items.slice(0, 3).map((item, index) => (
                  <div key={`snapshot-${index}`} className="flex items-start gap-3 rounded-2xl border border-purple-royal/20 bg-purple-royal/10 p-4">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-gold-warm" />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-xs text-text-tertiary">
                *Analytics placeholders ready for Segment hook-ins once the invite API ships.
              </div>
            </div>
          </div>
        </section>

        <section id="pillars" className="bg-bg-secondary py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight text-text-primary font-display">{copy.hero.eyebrow}</h2>
            <p className="mt-3 text-center text-text-secondary">The essentials every trusted friend told us they needed.</p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {copy.pillars.map((pillar, index) => {
                const Icon = ICON_MAP[pillar.icon as keyof typeof ICON_MAP] ?? Shield
                return (
                  <div key={`${pillar.title}-${index}`} className="rounded-3xl border border-border-gold/20 bg-bg-tertiary/60 backdrop-blur-xl p-6 shadow-premium hover:border-border-gold/50 transition-all">
                    <div className="flex items-center gap-3 text-purple-royal">
                      <Icon className="h-6 w-6" />
                      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-text-tertiary">{pillar.title}</span>
                    </div>
                    <p className="mt-4 text-lg font-semibold text-text-primary">{pillar.title}</p>
                    <p className="text-sm text-text-secondary">{pillar.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-background-primary py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-royal">{copy.howItWorks.title}</p>
              <h2 className="mt-3 text-3xl font-bold text-text-primary font-display">{copy.hero.title}</h2>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {copy.howItWorks.steps.map((step, index) => (
                <div key={`${step.title}-${index}`} className="rounded-3xl border border-border-gold/30 bg-bg-secondary/60 backdrop-blur-xl p-6 shadow-premium">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-gradient shadow-lg text-lg font-semibold text-white">
                    {index + 1}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-text-primary">{step.title}</h3>
                  <p className="mt-2 text-sm text-text-secondary">{step.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link href={`#${CTA_TARGET_ID}`} className="inline-flex items-center gap-2 text-sm font-semibold text-gold-warm hover:text-gold-warm-light transition-colors">
                {copy.howItWorks.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section id={TRUST_SECTION_ID} className="bg-bg-secondary py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-text-primary font-display">{copy.trustSignals.title}</h2>
            <p className="mt-3 text-base text-text-secondary">
              Controls and audit trails your trusted friends can rely on.
            </p>
            <div className="mt-10 space-y-4">
              {copy.trustSignals.items.map((item, index) => (
                <div key={`trust-${index}`} className="flex items-start gap-3 rounded-2xl border border-purple-royal/20 bg-purple-royal/10 backdrop-blur-sm p-5">
                  <CheckCircle2 className="mt-1 h-5 w-5 text-gold-warm shrink-0" />
                  <p className="text-sm text-text-secondary">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id={CTA_TARGET_ID} className="bg-purple-gradient py-20 text-white relative overflow-hidden">
          {/* Animated background orb */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-warm/20 rounded-full blur-3xl animate-pulse" />
          </div>
          
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="rounded-3xl border border-white/20 bg-white/5 backdrop-blur-sm p-8 shadow-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold-warm">Trusted friend invite beta</p>
              <h2 className="mt-4 text-3xl font-bold font-display">Request early access</h2>
              <p className="mt-2 text-white/90">
                Share how you plan to involve your family and we&apos;ll fast-track your trusted friend dashboard setup.
              </p>
              <FamilyPortalInviteForm
                action={WORKFLOW_STUB_ACTION}
                locale={locale}
                regionHint={localeMeta.region}
                submitLabel={copy.hero.primaryCta}
              />
              <p className="mt-4 text-xs text-white/70">
                This form is a stub. We&apos;ll confirm via email until the automated trusted friend workflow is live.
              </p>
            </div>
          </div>
        </section>

        <section id={FAQ_SECTION_ID} className="bg-background-primary py-20">
          <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:px-8 lg:grid-cols-[1.2fr,0.8fr]">
            <div>
              <h2 className="text-3xl font-bold text-text-primary font-display">{copy.faq.title}</h2>
              <div className="mt-6 space-y-4">
                {copy.faq.items.map((item, index) => (
                  <details key={`${item.question}-${index}`} className="rounded-2xl border border-border-gold/30 bg-bg-secondary p-4 hover:border-border-gold/50 transition-colors">
                    <summary className="cursor-pointer text-lg font-semibold text-text-primary">
                      {item.question}
                    </summary>
                    <p className="mt-2 text-sm text-text-secondary">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-purple-royal/30 bg-purple-royal/10 backdrop-blur-sm p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-royal">{copy.support.title}</p>
              <p className="mt-3 text-lg text-text-secondary">{copy.support.description}</p>
              <Link
                href={copy.support.contactHref}
                className="mt-6 inline-flex items-center gap-2 rounded bg-purple-gradient px-6 py-3 text-sm font-semibold text-white shadow-lg hover:scale-105 transition-transform"
              >
                {copy.support.contactCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-xs text-text-tertiary">{copy.support.responseTime}</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-bg-tertiary border-t border-border-gold/20 py-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 text-sm text-text-tertiary">
          <span>&copy; {new Date().getFullYear()} Tribal Mingle</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gold-warm transition-colors">
              {dictionary.footer.privacy}
            </Link>
            <Link href="/terms" className="hover:text-gold-warm transition-colors">
              {dictionary.footer.terms}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

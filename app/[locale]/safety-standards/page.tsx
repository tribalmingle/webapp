import type { Metadata } from 'next'
import { SiteHeader } from '@/components/marketing/site-header'
import { normalizeLocale } from '@/lib/i18n/locales'

export const metadata: Metadata = {
  title: 'Safety Standards | TribalMingle',
  description: 'Read TribalMingle standards against child sexual abuse and exploitation (CSAE) and how to report safety concerns.',
}

const effectiveDate = 'February 2, 2026'

type PageProps = {
  params: Promise<{ locale: string }>
}

export default async function SafetyStandardsPage({ params }: PageProps) {
  const { locale: rawLocale } = await params
  const locale = normalizeLocale(rawLocale)

  return (
    <main className="min-h-screen bg-background-primary">
      <SiteHeader locale={locale} />
      <div className="mx-auto max-w-4xl px-6 pb-16 pt-28">
        <div className="rounded-3xl border border-neutral-200/60 bg-white/70 p-8 shadow-sm backdrop-blur dark:border-neutral-800/60 dark:bg-neutral-950/70">
          <div className="flex flex-col gap-3">
            <span className="inline-flex w-fit items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/10 dark:text-purple-200">
              Child Safety Standards
            </span>
            <h1 className="text-3xl font-semibold tracking-tight">TribalMingle Safety Standards</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Effective date: {effectiveDate}</p>
            <p className="text-base text-neutral-700 dark:text-neutral-300">
              TribalMingle is committed to protecting children and preventing child sexual abuse and exploitation (CSAE).
              We do not allow any content or behavior that endangers minors. This page describes our standards and how to report concerns.
            </p>
          </div>

          <ol className="mt-8 space-y-6">
            <li className="rounded-2xl border border-neutral-200/60 p-6 dark:border-neutral-800/60">
              <h2 className="text-lg font-semibold">1. Zero‑tolerance policy</h2>
              <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
                We prohibit any CSAE content, grooming, solicitation, sexualization of minors, or any activity that exploits or harms children.
                Accounts involved in CSAE are removed and reported to relevant authorities.
              </p>
            </li>

            <li className="rounded-2xl border border-neutral-200/60 p-6 dark:border-neutral-800/60">
              <h2 className="text-lg font-semibold">2. Age requirements</h2>
              <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
                TribalMingle is for adults only (18+). We use age‑gating and review signals to prevent underage access.
                We remove any account suspected of being underage.
              </p>
            </li>

            <li className="rounded-2xl border border-neutral-200/60 p-6 dark:border-neutral-800/60">
              <h2 className="text-lg font-semibold">3. Detection & enforcement</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
                <li>Automated detection to flag risky content and behaviors.</li>
                <li>Human moderation review for reported and flagged content.</li>
                <li>Immediate enforcement actions, including removal and permanent bans.</li>
              </ul>
            </li>

            <li className="rounded-2xl border border-neutral-200/60 p-6 dark:border-neutral-800/60">
              <h2 className="text-lg font-semibold">4. Reporting to authorities</h2>
              <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
                When required by law, we report CSAE to appropriate authorities and preserve relevant records.
                We cooperate with law enforcement investigations.
              </p>
            </li>

            <li className="rounded-2xl border border-neutral-200/60 p-6 dark:border-neutral-800/60">
              <h2 className="text-lg font-semibold">5. User reporting</h2>
              <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
                You can report any profile, message, or content that violates these standards. We prioritize
                child safety reports and respond as quickly as possible.
              </p>
            </li>

            <li className="rounded-2xl border border-neutral-200/60 p-6 dark:border-neutral-800/60">
              <h2 className="text-lg font-semibold">6. Contact</h2>
              <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
                If you need help or want to report safety concerns, contact us immediately:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
                <li>Email: <a className="font-medium text-purple-700 hover:text-purple-800 dark:text-purple-200" href="mailto:support@tribalmingle.com">support@tribalmingle.com</a></li>
                <li>Safety team: <a className="font-medium text-purple-700 hover:text-purple-800 dark:text-purple-200" href="mailto:safety@tribalmingle.com">safety@tribalmingle.com</a></li>
              </ul>
            </li>
          </ol>

          <div className="mt-8 rounded-2xl border border-neutral-200/60 bg-neutral-50 p-6 text-sm text-neutral-700 dark:border-neutral-800/60 dark:bg-neutral-900/40 dark:text-neutral-300">
            <h2 className="text-base font-semibold">Additional resources</h2>
            <p className="mt-2">
              If you or someone else is in immediate danger, contact local emergency services.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

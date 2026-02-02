import type { Metadata } from 'next'
import { SiteHeader } from '@/components/marketing/site-header'
import { normalizeLocale } from '@/lib/i18n/locales'

export const metadata: Metadata = {
  title: 'Privacy Policy | TribalMingle',
  description: 'Learn how TribalMingle collects, uses, and protects your information.',
}

const effectiveDate = 'February 1, 2026'

type PageProps = {
  params: Promise<{ locale: string }>
}

export default async function PrivacyPolicyPage({ params }: PageProps) {
  const { locale: rawLocale } = await params
  const locale = normalizeLocale(rawLocale)

  return (
    <main className="min-h-screen bg-background-primary">
      <SiteHeader locale={locale} />
      <div className="mx-auto max-w-4xl px-6 pb-16 pt-28">
      <div className="rounded-3xl border border-neutral-200/60 bg-white/70 p-8 shadow-sm backdrop-blur dark:border-neutral-800/60 dark:bg-neutral-950/70">
        <div className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
            Privacy Policy
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">Your privacy at TribalMingle</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Effective date: {effectiveDate}</p>
          <p className="text-base text-neutral-700 dark:text-neutral-300">
            TribalMingle ("we", "us", "our") provides the TribalMingle mobile application and website
            (collectively, the "Service"). This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use the Service.
          </p>
        </div>

        <ol className="mt-8 space-y-6">
          <li className="rounded-2xl border border-neutral-200/60 p-6 dark:border-neutral-800/60">
            <h2 className="text-lg font-semibold">1. Information we collect</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
              <li><strong>Account Information:</strong> name, email address, phone number, date of birth, and login credentials.</li>
              <li><strong>Profile Content:</strong> photos, bio, preferences, and other information you choose to share.</li>
              <li><strong>Messages and Interactions:</strong> messages, likes, matches, and other in‑app interactions.</li>
              <li><strong>Location Data:</strong> approximate or precise location (with your permission) to enable nearby matches.</li>
              <li><strong>Device and Usage Data:</strong> device identifiers, IP address, app version, crash logs, and analytics.</li>
              <li><strong>Payment Information:</strong> in‑app purchase status and related metadata (payment processing is handled by app stores).</li>
            </ul>
          </li>

          <li className="rounded-2xl border border-neutral-200/60 p-6 dark:border-neutral-800/60">
            <h2 className="text-lg font-semibold">2. How we use information</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
              <li>Provide, operate, and improve the Service.</li>
              <li>Match you with other users and personalize your experience.</li>
              <li>Communicate with you about updates, security, and support.</li>
              <li>Prevent fraud, abuse, and policy violations.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </li>

          <li className="rounded-2xl border border-neutral-200/60 p-6 dark:border-neutral-800/60">
            <h2 className="text-lg font-semibold">3. How we share information</h2>
            <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">We may share information in the following circumstances:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
              <li><strong>With other users:</strong> profile information you choose to make visible.</li>
              <li><strong>Service providers:</strong> analytics, hosting, customer support, and security partners.</li>
              <li><strong>Legal requests:</strong> to comply with law, enforce policies, or protect rights and safety.</li>
              <li><strong>Business transfers:</strong> in connection with a merger, acquisition, or asset sale.</li>
            </ul>
          </li>

          <li className="rounded-2xl border border-neutral-200/60 p-6 dark:border-neutral-800/60">
            <h2 className="text-lg font-semibold">4. Your choices</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
              <li>Update or correct your profile information in the app.</li>
              <li>Manage location permissions in your device settings.</li>
              <li>Opt out of marketing communications where available.</li>
              <li>Request account deletion by contacting us (see Contact Us).</li>
            </ul>
          </li>

          <li className="rounded-2xl border border-neutral-200/60 p-6 dark:border-neutral-800/60">
            <h2 className="text-lg font-semibold">5. Data retention</h2>
            <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
              We retain information for as long as necessary to provide the Service and fulfill the purposes described
              in this policy, unless a longer retention period is required by law.
            </p>
          </li>

          <li className="rounded-2xl border border-neutral-200/60 p-6 dark:border-neutral-800/60">
            <h2 className="text-lg font-semibold">6. Security</h2>
            <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
              We use reasonable administrative, technical, and physical safeguards designed to protect your information.
              No method of transmission or storage is 100% secure.
            </p>
          </li>

          <li className="rounded-2xl border border-neutral-200/60 p-6 dark:border-neutral-800/60">
            <h2 className="text-lg font-semibold">7. Children’s privacy</h2>
            <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
              TribalMingle is intended for adults 18+. We do not knowingly collect personal information from anyone under 18.
            </p>
          </li>

          <li className="rounded-2xl border border-neutral-200/60 p-6 dark:border-neutral-800/60">
            <h2 className="text-lg font-semibold">8. International transfers</h2>
            <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
              Your information may be processed outside of your country. We take steps to ensure appropriate safeguards
              for cross‑border transfers where required.
            </p>
          </li>

          <li className="rounded-2xl border border-neutral-200/60 p-6 dark:border-neutral-800/60">
            <h2 className="text-lg font-semibold">9. Changes to this policy</h2>
            <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">
              We may update this Privacy Policy from time to time. We will post the updated policy with a new effective date.
            </p>
          </li>
        </ol>

        <div className="mt-8 rounded-2xl border border-neutral-200/60 bg-neutral-50 p-6 text-sm text-neutral-700 dark:border-neutral-800/60 dark:bg-neutral-900/40 dark:text-neutral-300">
          <h2 className="text-base font-semibold">10. Contact & deletion requests</h2>
          <p className="mt-2">
            Questions or requests? Email <a className="font-medium text-rose-700 hover:text-rose-800 dark:text-rose-200" href="mailto:support@tribalmingle.com">support@tribalmingle.com</a>.
          </p>
          <p className="mt-2">
            To request account and data deletion, email <a className="font-medium text-rose-700 hover:text-rose-800 dark:text-rose-200" href="mailto:privacy@tribalmingle.com?subject=Account%20Deletion%20Request">privacy@tribalmingle.com</a>.
          </p>
        </div>
      </div>
      </div>
    </main>
  )
}

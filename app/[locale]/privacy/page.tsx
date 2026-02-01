import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | TribalMingle',
  description: 'Learn how TribalMingle collects, uses, and protects your information.',
}

const effectiveDate = 'February 1, 2026'

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Effective date: {effectiveDate}</p>

      <section className="prose prose-neutral dark:prose-invert mt-8 max-w-none">
        <p>
          TribalMingle ("we", "us", "our") provides the TribalMingle mobile application and website
          (collectively, the "Service"). This Privacy Policy explains how we collect, use, disclose,
          and safeguard your information when you use the Service.
        </p>

        <h2>Information We Collect</h2>
        <ul>
          <li><strong>Account Information:</strong> name, email address, phone number, date of birth, and login credentials.</li>
          <li><strong>Profile Content:</strong> photos, bio, preferences, and other information you choose to share.</li>
          <li><strong>Messages and Interactions:</strong> messages, likes, matches, and other in‑app interactions.</li>
          <li><strong>Location Data:</strong> approximate or precise location (with your permission) to enable nearby matches.</li>
          <li><strong>Device and Usage Data:</strong> device identifiers, IP address, app version, crash logs, and analytics.</li>
          <li><strong>Payment Information:</strong> in‑app purchase status and related metadata (payment processing is handled by app stores).</li>
        </ul>

        <h2>How We Use Information</h2>
        <ul>
          <li>Provide, operate, and improve the Service.</li>
          <li>Match you with other users and personalize your experience.</li>
          <li>Communicate with you about updates, security, and support.</li>
          <li>Prevent fraud, abuse, and policy violations.</li>
          <li>Comply with legal obligations.</li>
        </ul>

        <h2>How We Share Information</h2>
        <p>We may share information in the following circumstances:</p>
        <ul>
          <li><strong>With other users:</strong> profile information you choose to make visible.</li>
          <li><strong>Service providers:</strong> analytics, hosting, customer support, and security partners.</li>
          <li><strong>Legal requests:</strong> to comply with law, enforce policies, or protect rights and safety.</li>
          <li><strong>Business transfers:</strong> in connection with a merger, acquisition, or asset sale.</li>
        </ul>

        <h2>Your Choices</h2>
        <ul>
          <li>Update or correct your profile information in the app.</li>
          <li>Manage location permissions in your device settings.</li>
          <li>Opt out of marketing communications where available.</li>
          <li>Request account deletion by contacting us (see Contact Us).</li>
        </ul>

        <h2>Data Retention</h2>
        <p>
          We retain information for as long as necessary to provide the Service and fulfill the purposes described
          in this policy, unless a longer retention period is required by law.
        </p>

        <h2>Security</h2>
        <p>
          We use reasonable administrative, technical, and physical safeguards designed to protect your information.
          No method of transmission or storage is 100% secure.
        </p>

        <h2>Children’s Privacy</h2>
        <p>
          TribalMingle is intended for adults 18+. We do not knowingly collect personal information from anyone under 18.
        </p>

        <h2>International Transfers</h2>
        <p>
          Your information may be processed outside of your country. We take steps to ensure appropriate safeguards
          for cross‑border transfers where required.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the updated policy with a new effective date.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have questions or requests, contact us at <a href="mailto:support@tribalmingle.com">support@tribalmingle.com</a>.
        </p>
      </section>
    </main>
  )
}

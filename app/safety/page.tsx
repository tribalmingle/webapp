'use client'

import { AlertCircle, Heart, Shield, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Button } from '@/components/ui/button'

const SAFETY_TIPS = [
  {
    icon: Shield,
    title: 'Protect your access',
    description: 'Keep credentials secure and rotate passwords every season.',
    bullets: ['Use a password manager', 'Enable passkeys + 2FA', 'Never share OTP codes'],
  },
  {
    icon: AlertCircle,
    title: 'Plan your meetings',
    description: 'Set expectations before meeting anyone from the platform.',
    bullets: ['Meet in public, daylight spaces', "Share location with guardians", 'Tell a friend your check-in time'],
  },
  {
    icon: Heart,
    title: 'Guard personal details',
    description: 'Reveal finances or addresses only after verifying identity.',
    bullets: ['Keep banking info private', 'Video chat before meeting', 'Pause if someone pressures you'],
  },
  {
    icon: Users,
    title: 'Report signals quickly',
    description: 'We act fast on fraud, harassment, or impersonation reports.',
    bullets: ['Flag spam or fake profiles', 'Report payment requests', 'Use concierge hotline for immediate help'],
  },
]

const RED_FLAGS = [
  'Requests for money, crypto, or gift cards',
  'Refusing to video chat or verify identity',
  'Pushing conversations off-platform immediately',
  'Inconsistent backstories or recycled photos',
  'Love bombing and rushing commitments',
  'Demanding intimate photos or private info',
  'Threatening to share conversations publicly',
  'Evasive answers about guardians or profession',
]

const COMMUNITY_GUARDRAILS = [
  {
    title: 'Respectful communication',
    copy: 'Harassment, hate speech, or intimidation results in immediate removal.',
  },
  {
    title: 'Authentic presence',
    copy: 'Use recent photos and truthful bios. Catfishing violates membership terms.',
  },
  {
    title: 'Privacy first',
    copy: "Never share screenshots or DMs without consent. Protect your match's confidentiality.",
  },
  {
    title: 'See something, say something',
    copy: 'Use concierge chat or the report button—our trust team reviews 24/7.',
  },
]

export default function SafetyPage() {
  return (
    <MemberAppShell
      title="Safety & guardianship"
      description="Concierge-backed playbooks to keep every ritual grounded and secure."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/help">Concierge hotline</Link>
          </Button>
          <Button variant="secondary">Report an issue</Button>
        </div>
      }
    >
      <div className="space-y-10">
        <section className="grid gap-4 md:grid-cols-2">
          {SAFETY_TIPS.map((tip) => (
            <SafetyCard key={tip.title} {...tip} />
          ))}
        </section>

        <section className="rounded-3xl border border-red-200 bg-red-50/80 p-6">
          <p className="text-sm uppercase tracking-wide text-red-500">Signals to pause</p>
          <h2 className="mt-2 text-2xl font-semibold text-red-900">Red flags to escalate</h2>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {RED_FLAGS.map((flag) => (
              <li key={flag} className="flex gap-3 text-sm text-red-900">
                <span aria-hidden>⚠</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-border bg-card/80 p-6">
          <h2 className="text-2xl font-semibold">Community guardrails</h2>
          <p className="text-sm text-muted-foreground">Every member agrees to these expectations before joining a tribe.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {COMMUNITY_GUARDRAILS.map((rule) => (
              <article key={rule.title} className="rounded-2xl border border-border/60 p-4">
                <h3 className="text-base font-semibold capitalize">{rule.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{rule.copy}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </MemberAppShell>
  )
}

function SafetyCard({
  icon: Icon,
  title,
  description,
  bullets,
}: {
  icon: LucideIcon
  title: string
  description: string
  bullets: string[]
}) {
  return (
    <article className="rounded-3xl border border-border bg-card/80 p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2 text-muted-foreground">
            <span className="text-primary">•</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}

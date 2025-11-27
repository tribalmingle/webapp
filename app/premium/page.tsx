'use client'

import { Gift, Crown, Share2, TrendingUp, Zap } from 'lucide-react'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'

const PREMIUM_FEATURES = [
  { icon: Zap, title: 'Profile boost', description: 'Get concierge boosts for 24 hours of priority placement.', action: 'Boost now', price: '£4.99' },
  { icon: Gift, title: 'Virtual gestures', description: 'Send curated gifts and rituals to spark new conversations.', action: 'Send gift', price: 'From £0.99' },
  { icon: TrendingUp, title: 'Insights', description: 'See who viewed you, guardian approvals, and conversion stats.', action: 'View insights', price: 'Included' },
  { icon: Share2, title: 'Referral rewards', description: 'Invite friends, unlock boosts, and concierge credits.', action: 'Invite now', price: 'Rewards' },
]

const PLAN_OPTIONS = [
  {
    name: 'Basic',
    price: '£12/mo',
    perks: ['3 intro messages', 'Browse tribes', 'Limited likes'],
  },
  {
    name: 'Premium',
    price: '£32/mo',
    perks: ['Unlimited messages', 'Unlimited likes', 'AI concierge suggestions'],
    popular: true,
  },
  {
    name: 'VIP',
    price: '£82/mo',
    perks: ['Everything in Premium', 'Priority concierge', 'Monthly boosts + events'],
  },
]

const PAYMENT_HISTORY = [
  { date: '18 Nov 2025', plan: 'VIP quarterly', amount: '£246', status: 'Paid' },
  { date: '18 Aug 2025', plan: 'VIP quarterly', amount: '£246', status: 'Paid' },
  { date: '18 May 2025', plan: 'VIP quarterly', amount: '£246', status: 'Paid' },
]

export default function PremiumPage() {
  const { user } = useAuth()

  return (
    <MemberAppShell
      title="Premium concierge"
      description="Unlock boosts, rituals, and guardian briefings tailored to you."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost">View perks</Button>
          <Button variant="secondary">Manage billing</Button>
        </div>
      }
    >
      <div className="space-y-8">
        <section className="rounded-3xl border border-border bg-linear-to-r from-primary/90 to-accent/90 p-6 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-white/80">Current plan</p>
              <h2 className="text-3xl font-bold">{(user?.subscriptionPlan || 'Premium').toUpperCase()}</h2>
              <p className="text-white/80">Renews {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="rounded-3xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold">
              Concierge priority active
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {PREMIUM_FEATURES.map((feature) => (
            <PremiumFeatureCard key={feature.title} {...feature} />
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground">Membership tiers</p>
              <h2 className="text-2xl font-semibold">Upgrade your ritual</h2>
            </div>
            <Button variant="outline" size="sm">
              Compare benefits
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PLAN_OPTIONS.map((plan) => (
              <PremiumPlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card/80 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground">Payment history</p>
              <h2 className="text-2xl font-semibold">Latest invoices</h2>
            </div>
            <Button variant="ghost" size="sm">
              Download receipts
            </Button>
          </div>
          <div className="mt-6 space-y-3">
            {PAYMENT_HISTORY.map((payment) => (
              <div
                key={payment.date}
                className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold">{payment.plan}</p>
                  <p className="text-muted-foreground">{payment.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{payment.amount}</p>
                  <p className="text-emerald-500">{payment.status}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MemberAppShell>
  )
}

function PremiumFeatureCard({ icon: Icon, title, description, action, price }: (typeof PREMIUM_FEATURES)[number]) {
  return (
    <div className="rounded-3xl border border-border bg-card/80 p-5">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm font-semibold text-accent">{price}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <Button variant="ghost" size="sm" className="mt-4 px-0 text-sm font-semibold">
        {action}
      </Button>
    </div>
  )
}

function PremiumPlanCard({ plan }: { plan: (typeof PLAN_OPTIONS)[number] }) {
  return (
    <div
      className={`rounded-3xl border-2 p-6 ${
        plan.popular ? 'border-accent shadow-[0_15px_50px_-25px_rgba(0,0,0,0.6)]' : 'border-border'
      }`}
    >
      {plan.popular && (
        <span className="mb-3 block text-center text-xs font-semibold text-accent">Most popular</span>
      )}
      <h3 className="text-xl font-semibold">{plan.name}</h3>
      <p className="mt-2 text-3xl font-bold text-accent">{plan.price}</p>
      <ul className="mt-4 space-y-2 text-sm">
        {plan.perks.map((perk) => (
          <li key={perk} className="flex items-center gap-2">
            <span className="text-accent">•</span>
            {perk}
          </li>
        ))}
      </ul>
      <Button className="mt-6 w-full" variant={plan.popular ? 'default' : 'outline'}>
        Choose plan
      </Button>
    </div>
  )
}

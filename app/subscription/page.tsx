'use client'

import { useState } from 'react'
import { Check, Crown, Sparkles, Star, Zap } from 'lucide-react'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useFeatureFlag } from '@/lib/hooks/use-feature-flag'

function FeatureGate({ children }: { children: React.ReactNode }) {
  const subscriptionEnabled = useFeatureFlag('subscription-v1')
  
  if (!subscriptionEnabled) {
    return (
      <MemberAppShell>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <h1>Subscription Plans</h1>
          <p>Premium subscriptions are currently in beta and not available for your account.</p>
          <p>Check back soon for exclusive membership tiers!</p>
        </div>
      </MemberAppShell>
    )
  }
  
  return <>{children}</>
}

type MembershipPlan = {
  id: string
  name: string
  price: string
  period: string
  icon: typeof Star
  color: string
  features: string[]
  popular?: boolean
}

const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '£0',
    period: 'forever',
    icon: Star,
    color: 'from-gray-400 to-gray-600',
    features: ['Basic profile', 'Limited swipes per day', 'Standard matching', 'Basic filters'],
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '£15',
    period: 'per month',
    icon: Zap,
    color: 'from-blue-500 to-blue-700',
    features: [
      'Unlimited swipes',
      'See who likes you',
      'Advanced filters',
      'Boost once every month',
      'Read receipts',
      'Priority support',
    ],
  },
  {
    id: '3-months',
    name: '3 Months',
    price: '£35',
    period: 'save £10',
    icon: Crown,
    color: 'from-purple-500 to-purple-700',
    popular: true,
    features: [
      'Everything in Monthly',
      'Profile boost 3x/month',
      'Unlimited rewinds',
      'Travel mode',
      'Premium badge',
      'Priority concierge',
    ],
  },
  {
    id: '6-months',
    name: '6 Months',
    price: '£60',
    period: 'save £30',
    icon: Sparkles,
    color: 'from-orange-500 to-orange-700',
    features: [
      'Everything in 3 Months',
      'Profile boost 5x/month',
      'VIP matching algorithm',
      'Exclusive events access',
      'Dedicated account manager',
      'Verification priority',
    ],
  },
]

export default function SubscriptionPage() {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const currentPlan = user?.subscriptionPlan || 'free'

  const handleUpgrade = async (planId: string) => {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/subscription/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })

      const data = await response.json()

      if (data.success) {
        updateUser(data.user)
        const plan = MEMBERSHIP_PLANS.find((item) => item.id === planId)
        setMessage(`Successfully updated to the ${plan?.name || ''} plan!`)
      } else {
        setMessage(data.message || 'Failed to update subscription')
      }
    } catch (error) {
      setMessage('Error updating subscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FeatureGate>
      <MemberAppShell
        title="Membership"
        description="Upgrade your concierge experience and unlock tribe-only perks."
        actions={<Button variant="secondary">Manage billing</Button>}
      >
        <div className="space-y-10">
          <section className="rounded-3xl border border-border bg-card/80 p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Choose your ritual</p>
            <h1 className="mt-2 text-4xl font-bold">Find the plan that matches your pace</h1>
            <p className="mt-3 text-base text-muted-foreground">
              Premium tiers open concierge boosts, curated intros, and guardian updates without limits.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/70 px-4 py-2 text-sm font-semibold">
              Current plan: {MEMBERSHIP_PLANS.find((plan) => plan.id === currentPlan)?.name || 'Free'}
            </div>
          </section>

        {message && (
          <div
            className={`rounded-3xl border px-4 py-3 text-center text-sm font-semibold ${
              message.includes('Successfully') ? 'border-green-200 bg-green-50 text-green-900' : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            {message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {MEMBERSHIP_PLANS.map((plan) => (
            <MembershipPlanCard
              key={plan.id}
              plan={plan}
              isCurrent={plan.id === currentPlan}
              loading={loading}
              onSelect={() => handleUpgrade(plan.id)}
            />
          ))}
        </section>

        <section className="rounded-3xl bg-linear-to-br from-primary/10 via-transparent to-accent/10 p-8">
          <h2 className="text-2xl font-semibold text-center">Why go premium?</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Unlimited matching',
                copy: 'Remove daily limits and see everyone who already liked you.',
              },
              {
                title: 'Priority visibility',
                copy: 'Concierge boosts put you at the top of discovery moments.',
              },
              {
                title: 'Exclusive rituals',
                copy: 'Unlock travel mode, guardian briefs, and VIP events.',
              },
            ].map((benefit) => (
              <div key={benefit.title} className="rounded-2xl border border-white/40 bg-white/30 p-6 backdrop-blur">
                <h3 className="text-lg font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{benefit.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-border bg-card/80 p-8">
          <h2 className="text-2xl font-semibold text-center">Frequently asked questions</h2>
          <div className="mt-6 space-y-4">
            {[
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. You keep access until the end of your billing cycle and can return to Free instantly.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We support all major cards and Apple/Google Pay. Billing is handled securely by Stripe.',
              },
              {
                q: 'Is my payment information secure?',
                a: 'Payments are encrypted end-to-end and we never store full card numbers in our systems.',
              },
              {
                q: 'Can I change my plan later?',
                a: 'Upgrade or downgrade anytime—changes prorate automatically.',
              },
            ].map((item) => (
              <div key={item.q} className="rounded-2xl border border-border/70 p-5">
                <p className="font-semibold">{item.q}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MemberAppShell>
    </FeatureGate>
  )
}

function MembershipPlanCard({
  plan,
  isCurrent,
  loading,
  onSelect,
}: {
  plan: MembershipPlan
  isCurrent: boolean
  loading: boolean
  onSelect: () => void
}) {
  const Icon = plan.icon

  return (
    <div
      className={`relative rounded-3xl border-2 p-6 transition hover:-translate-y-1 hover:shadow-xl ${
        plan.popular ? 'border-accent shadow-lg' : 'border-border'
      } ${isCurrent ? 'ring-2 ring-accent' : ''}`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-semibold text-accent-foreground">
          Most popular
        </div>
      )}

      <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br ${plan.color}`}>
        <Icon className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-center text-2xl font-semibold">{plan.name}</h3>
      <p className="mt-2 text-center text-sm text-muted-foreground">{plan.period}</p>
      <p className="mt-4 text-center text-4xl font-bold">{plan.price}</p>

      <ul className="mt-6 space-y-3 text-sm">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="h-4 w-4 text-accent" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className="mt-6 w-full"
        variant={plan.popular ? 'default' : 'outline'}
        disabled={isCurrent || loading}
        onClick={onSelect}
      >
        {isCurrent ? 'Current plan' : loading ? 'Processing...' : plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
      </Button>
    </div>
  )
}

import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { getSubscription, startTrial, activateSubscription, cancelSubscription, downgradeToFree } from '@/lib/services/subscription-service'
import { revalidatePath } from 'next/cache'

async function ensureInitialTrial(userId: string) {
  const sub = await getSubscription(userId)
  if (!sub) {
    // Auto-provision trial for first visit (placeholder product logic)
    return startTrial(userId)
  }
  return sub
}

export default async function SubscriptionSettingsPage() {
  const user = await getCurrentUser()
  if (!user) return <div className="p-6">Please sign in</div>
  const subscription = await ensureInitialTrial(user.userId)

  const upgradePlans: { plan: string; label: string; description: string }[] = [
    { plan: 'concierge', label: 'Concierge', description: 'Priority matching & intros' },
    { plan: 'guardian', label: 'Guardian', description: 'Advanced safety & guardian tools' },
    { plan: 'premium_plus', label: 'Premium+', description: 'All features + boosts bundle' },
  ]

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Subscription</h1>
      <div className="border rounded p-4 space-y-2 bg-white/50 dark:bg-neutral-900/50">
        <p><strong>Current Plan:</strong> {subscription.plan}</p>
        {subscription.status === 'trialing' && subscription.trialEndsAt && (
          <p className="text-sm text-amber-600">Trial ends {subscription.trialEndsAt.toLocaleDateString()}</p>
        )}
        {subscription.renewsAt && subscription.status === 'active' && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Renews {subscription.renewsAt.toLocaleDateString()}</p>
        )}
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Status: {subscription.status}</p>
        {subscription.stripeSubscriptionId && (
          <p className="text-xs text-neutral-500">Stripe Sub ID: {subscription.stripeSubscriptionId}</p>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-medium">Upgrade</h2>
        <div className="grid gap-4">
          {upgradePlans.map(p => (
            <form
              key={p.plan}
              action={async () => {
                await activateSubscription(user.userId, p.plan as any)
                revalidatePath('/settings/subscription')
              }}
            >
              <div className="flex items-center justify-between border rounded p-3">
                <div>
                  <p className="font-semibold">{p.label}</p>
                  <p className="text-xs text-neutral-500">{p.description}</p>
                </div>
                <button
                  type="submit"
                  disabled={subscription.plan === p.plan}
                  className="px-3 py-1 text-sm rounded bg-indigo-600 text-white disabled:opacity-40"
                >
                  {subscription.plan === p.plan ? 'Current' : 'Upgrade'}
                </button>
              </div>
            </form>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-medium">Manage</h2>
        <form
          action={async () => {
            await downgradeToFree(user.userId)
            revalidatePath('/settings/subscription')
          }}
        >
          <button type="submit" className="px-4 py-2 text-sm rounded bg-neutral-200 dark:bg-neutral-700">
            Downgrade to Free
          </button>
        </form>
        <form
          action={async () => {
            await cancelSubscription(user.userId)
            revalidatePath('/settings/subscription')
          }}
        >
          <button type="submit" className="px-4 py-2 text-sm rounded bg-red-600 text-white">
            Cancel Subscription
          </button>
        </form>
      </div>

      <p className="text-xs text-neutral-500">(Stripe billing + proration logic pending; current operations are stubbed and not tied to real payments.)</p>
    </div>
  )
}

import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { getSnapshot, credit, debit } from '@/lib/services/wallet-service'
import { revalidatePath } from 'next/cache'
import { useFeatureFlag } from '@/lib/hooks/use-feature-flag'

async function getData(userId: string) {
  return getSnapshot(userId)
}

function FeatureGate({ children }: { children: React.ReactNode }) {
  'use client'
  const walletEnabled = useFeatureFlag('wallet-v1')
  
  if (!walletEnabled) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h1>Coin Wallet</h1>
        <p>The coin wallet feature is currently in beta and not available for your account.</p>
        <p>Check back soon to manage your coin balance!</p>
      </div>
    )
  }
  
  return <>{children}</>
}

export default async function WalletPage() {
  const user = await getCurrentUser()
  if (!user) return <div className="p-6">Please sign in</div>
  const snapshot = await getData(user.userId)

  return (
    <FeatureGate>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Wallet</h1>
        <div className="border rounded p-4 bg-white/60 dark:bg-neutral-900/60">
          <p className="text-lg font-medium">Balance: {snapshot.balance} coins</p>
          <p className="text-xs text-neutral-500">(Test environment: manual credit/debit buttons)</p>
        </div>

        <div className="flex gap-4">
          <form action={async () => { await credit(user.userId, 100, 'test_credit'); revalidatePath('/wallet') }}>
            <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white text-sm">+100 Credit</button>
          </form>
          <form action={async () => { try { await debit(user.userId, 50, 'test_debit') } catch {} revalidatePath('/wallet') }}>
            <button type="submit" className="px-4 py-2 rounded bg-red-600 text-white text-sm">-50 Debit</button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-medium mb-2">Recent Transactions</h2>
          <ul className="space-y-1 text-sm">
            {snapshot.transactions.slice(0,50).map(tx => (
              <li key={tx.id} className="flex justify-between border-b border-neutral-200 dark:border-neutral-700 py-1">
                <span>{tx.type === 'credit' ? '➕' : '➖'} {tx.type} {tx.amount} {tx.reference && <em className="text-neutral-500">({tx.reference})</em>}</span>
                <span className="text-neutral-500">{new Date(tx.createdAt).toLocaleTimeString()}</span>
              </li>
            ))}
            {snapshot.transactions.length === 0 && <li className="text-neutral-500">No transactions yet.</li>}
          </ul>
        </div>
        <p className="text-xs text-neutral-500">(Stripe coin bundle purchase flow to replace manual credit/debit in production.)</p>
      </div>
    </FeatureGate>
  )
}

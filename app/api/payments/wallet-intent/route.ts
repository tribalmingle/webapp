import { randomUUID } from 'crypto'

import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { trackServerEvent } from '@/lib/analytics/segment'
import { getProviderAvailability, resolveWalletOptions } from '@/lib/payments/wallet-config-service'

const payloadSchema = z.object({
  planId: z.enum(['monthly', '3-months', '6-months']),
  walletProvider: z.enum(['apple_pay', 'google_pay']),
  region: z.string().min(2).max(32).optional(),
})

const planCatalog: Record<string, { amountCents: number; currency: string }> = {
  monthly: { amountCents: 1500, currency: 'GBP' },
  '3-months': { amountCents: 3500, currency: 'GBP' },
  '6-months': { amountCents: 6000, currency: 'GBP' },
}

export async function POST(request: Request) {
  const authUser = await getCurrentUser()
  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  const payload = await safeJson(request)
  const validation = payloadSchema.safeParse(payload)

  if (!validation.success) {
    return NextResponse.json({ success: false, errors: validation.error.flatten().fieldErrors }, { status: 400 })
  }

  const regionHint = validation.data.region ?? inferRegion(authUser)
  const options = await resolveWalletOptions(regionHint)
  const provider = getProviderAvailability(options, validation.data.walletProvider)

  if (!provider.enabled) {
    return NextResponse.json(
      { success: false, error: `${formatProviderLabel(validation.data.walletProvider)} is not available for this region` },
      { status: 409 },
    )
  }

  const catalogEntry = planCatalog[validation.data.planId]
  const intentId = randomUUID()
  const clientSecret = randomUUID().replace(/-/g, '')

  await trackServerEvent({
    userId: authUser.userId,
    event: 'wallet.intent.created',
    properties: {
      planId: validation.data.planId,
      provider: validation.data.walletProvider,
      region: options.region,
      amountCents: catalogEntry.amountCents,
      currency: catalogEntry.currency,
    },
  })

  return NextResponse.json({
    success: true,
    intent: {
      id: intentId,
      clientSecret,
      provider: validation.data.walletProvider,
      region: options.region,
      amountCents: catalogEntry.amountCents,
      currency: catalogEntry.currency,
    },
  })
}

async function safeJson(request: Request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

function inferRegion(user: Record<string, unknown>) {
  const locale = typeof user.locale === 'string' ? user.locale : undefined
  const country = typeof user.country === 'string' ? user.country : undefined
  return locale ?? country ?? undefined
}

function formatProviderLabel(provider: 'apple_pay' | 'google_pay') {
  return provider === 'apple_pay' ? 'Apple Pay' : 'Google Pay'
}

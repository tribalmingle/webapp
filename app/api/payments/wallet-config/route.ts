import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import {
  getWalletConfig,
  listWalletConfigs,
  upsertWalletConfig,
  walletConfigInputSchema,
} from '@/lib/payments/wallet-config-service'

const querySchema = z.object({
  region: z.string().min(2).max(32).optional(),
})

export async function GET(request: Request) {
  const authUser = await getCurrentUser()
  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  if (!userIsAdmin(authUser)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams))

  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  if (parsed.data.region) {
    const config = await getWalletConfig(parsed.data.region)
    if (!config) {
      return NextResponse.json({ success: false, error: 'Wallet config not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, config })
  }

  const configs = await listWalletConfigs()
  return NextResponse.json({ success: true, configs })
}

export async function POST(request: Request) {
  const authUser = await getCurrentUser()
  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  if (!userIsAdmin(authUser)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const payload = await safeJson(request)
  const validation = walletConfigInputSchema.safeParse(payload)

  if (!validation.success) {
    return NextResponse.json({ success: false, errors: validation.error.flatten().fieldErrors }, { status: 400 })
  }

  const config = await upsertWalletConfig(validation.data)
  return NextResponse.json({ success: true, config })
}

async function safeJson(request: Request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

function userIsAdmin(user: { roles?: string[] }) {
  if (!Array.isArray(user.roles)) {
    return false
  }
  return user.roles.includes('admin') || user.roles.includes('ops')
}

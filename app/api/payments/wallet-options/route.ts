import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { resolveWalletOptions } from '@/lib/payments/wallet-config-service'

const querySchema = z.object({
  region: z.string().min(2).max(32).optional(),
})

export async function GET(request: Request) {
  const authUser = await getCurrentUser()
  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  const url = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams))

  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const inferredRegion = inferRegion(authUser)
  const options = await resolveWalletOptions(parsed.data.region ?? inferredRegion)
  return NextResponse.json({ success: true, options })
}

function inferRegion(user: Record<string, unknown>) {
  const locale = typeof user.locale === 'string' ? user.locale : undefined
  const country = typeof user.country === 'string' ? user.country : undefined
  return locale ?? country ?? undefined
}

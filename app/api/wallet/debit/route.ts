import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { debit } from '@/lib/services/wallet-service'

const schema = z.object({ amount: z.number().int().positive(), reference: z.string().optional(), idempotencyKey: z.string().min(8).optional() })

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  let body: unknown; try { body = await req.json() } catch { body = {} }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  try {
    const newBalance = await debit(user.userId, parsed.data.amount, parsed.data.reference, parsed.data.idempotencyKey)
    return NextResponse.json({ success: true, balance: newBalance })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'debit_failed' }, { status: 400 })
  }
}

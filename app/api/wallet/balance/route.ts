import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getBalance } from '@/lib/services/wallet-service'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  const balance = await getBalance(user.userId)
  return NextResponse.json({ success: true, balance })
}

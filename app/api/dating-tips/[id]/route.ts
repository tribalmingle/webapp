import { NextResponse } from 'next/server'
import { DATING_TIPS } from '@/lib/dating-tips/tips-data'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tip = DATING_TIPS.find((item) => item.id === id)
    if (!tip) {
      return NextResponse.json({ success: false, message: 'Tip not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, tip })
  } catch (error) {
    console.error('[dating-tips] detail error', error)
    return NextResponse.json({ success: false, message: 'Unable to load tip' }, { status: 500 })
  }
}

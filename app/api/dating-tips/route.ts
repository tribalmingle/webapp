import { NextRequest, NextResponse } from 'next/server'
import { DATING_TIPS } from '@/lib/dating-tips/tips-data'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '50', 10))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10))

    let tips = [...DATING_TIPS]
    if (category) {
      tips = tips.filter((tip) => tip.category === category)
    }

    tips.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    const paged = tips.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      tips: paged,
      total: tips.length,
      hasMore: offset + limit < tips.length,
    })
  } catch (error) {
    console.error('[dating-tips] list error', error)
    return NextResponse.json({ success: false, message: 'Unable to load tips' }, { status: 500 })
  }
}

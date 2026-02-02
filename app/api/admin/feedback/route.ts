import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Math.min(Number(searchParams.get('limit') || 100), 500)

    const db = await getMongoDb()
    const feedbackCollection = db.collection('feedback')

    const query: Record<string, unknown> = {}
    if (status) query.status = status

    const feedback = await feedbackCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    const items = feedback.map((item) => ({
      id: item._id?.toString(),
      name: item.name,
      email: item.email,
      feedback: item.feedback,
      status: item.status || 'new',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      readAt: item.readAt,
    }))

    return NextResponse.json({ success: true, feedback: items })
  } catch (error) {
    console.error('Admin feedback fetch failed:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load feedback.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { ensureAdminRequest } from '@/lib/admin/auth'
import { submitAppeal, processAppeal } from '@/lib/services/moderation-service'
import { getMongoDb } from '@/lib/mongodb'

/**
 * GET /api/admin/moderation/appeals - List appeals
 */
export async function GET(req: NextRequest) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  if (!['superadmin', 'moderator'].includes(auth.session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit

    const db = await getMongoDb()
    const filter: Record<string, unknown> = {}

    if (status) {
      filter.status = status
    }

    const [appeals, totalCount] = await Promise.all([
      db
        .collection('appeals')
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('appeals').countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      appeals: appeals.map((a) => ({ ...a, _id: a._id.toString() })),
      totalCount,
      page,
      limit,
    })
  } catch (error: any) {
    console.error('Error fetching appeals:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch appeals' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/moderation/appeals - Process an appeal
 */
export async function POST(req: NextRequest) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  if (!['superadmin', 'moderator'].includes(auth.session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { appealId, result, newAction, reason } = body

    if (!appealId || !result || !reason) {
      return NextResponse.json(
        { error: 'appealId, result, and reason required' },
        { status: 400 }
      )
    }

    if (!['upheld', 'overturned', 'modified'].includes(result)) {
      return NextResponse.json(
        { error: 'result must be: upheld, overturned, or modified' },
        { status: 400 }
      )
    }

    if (result === 'modified' && !newAction) {
      return NextResponse.json(
        { error: 'newAction required when result is modified' },
        { status: 400 }
      )
    }

    await processAppeal(appealId, {
      result,
      newAction,
      reason,
      decidedBy: auth.session.email,
    })

    return NextResponse.json({
      success: true,
      message: `Appeal ${result}`,
    })
  } catch (error: any) {
    console.error('Error processing appeal:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process appeal' },
      { status: 500 }
    )
  }
}

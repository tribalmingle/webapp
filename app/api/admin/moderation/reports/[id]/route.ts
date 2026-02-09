import { NextRequest, NextResponse } from 'next/server'
import { ensureAdminRequest } from '@/lib/admin/auth'
import {
  assignReport,
  escalateReport,
  resolveReport,
} from '@/lib/services/moderation-service'
import { getMongoDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/moderation/reports/[id] - Get report details
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  if (!['superadmin', 'moderator', 'support'].includes(auth.session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params
    const db = await getMongoDb()

    const report = await db.collection('reports').findOne({
      _id: new ObjectId(id),
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Get reporter info
    const reporter = await db.collection('users').findOne(
      { _id: new ObjectId(report.reporterId) },
      { projection: { email: 1, status: 1 } }
    )

    // Get reported user info
    const reportedUser = await db.collection('users').findOne(
      { _id: new ObjectId(report.reportedUserId) },
      { projection: { email: 1, status: 1 } }
    )

    const reportedProfile = await db.collection('profiles').findOne(
      { userId: report.reportedUserId },
      { projection: { firstName: 1, displayName: 1, trustScore: 1, mediaGallery: 1 } }
    )

    // Get prior reports against reported user
    const priorReports = await db
      .collection('reports')
      .find({
        reportedUserId: report.reportedUserId,
        _id: { $ne: new ObjectId(id) },
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    // Get moderation history
    const moderationHistory = await db
      .collection('moderation_actions')
      .find({ targetUserId: report.reportedUserId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    return NextResponse.json({
      success: true,
      report: {
        ...report,
        _id: report._id.toString(),
      },
      reporter: reporter
        ? { ...reporter, _id: reporter._id.toString() }
        : null,
      reportedUser: reportedUser
        ? {
            ...reportedUser,
            _id: reportedUser._id.toString(),
            profile: reportedProfile,
          }
        : null,
      priorReports: priorReports.map((r) => ({
        ...r,
        _id: r._id.toString(),
      })),
      moderationHistory: moderationHistory.map((a) => ({
        ...a,
        _id: a._id.toString(),
      })),
    })
  } catch (error: any) {
    console.error('Error fetching report:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch report' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/moderation/reports/[id] - Report actions (assign, escalate, resolve)
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  if (!['superadmin', 'moderator', 'support'].includes(auth.session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { action } = body

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 })
    }

    const actorId = auth.session.email

    switch (action) {
      case 'assign':
        if (!body.moderatorId) {
          return NextResponse.json(
            { error: 'moderatorId required' },
            { status: 400 }
          )
        }
        await assignReport(id, body.moderatorId, actorId)
        break

      case 'escalate':
        if (!body.level || !body.reason) {
          return NextResponse.json(
            { error: 'level and reason required' },
            { status: 400 }
          )
        }
        // Only superadmin can escalate to legal
        if (body.level === 'legal' && auth.session.role !== 'superadmin') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        await escalateReport(id, {
          level: body.level,
          reason: body.reason,
          escalatedBy: actorId,
        })
        break

      case 'resolve':
        if (!body.moderationAction || !body.reason) {
          return NextResponse.json(
            { error: 'moderationAction and reason required' },
            { status: 400 }
          )
        }
        // Ban requires superadmin
        if (body.moderationAction === 'ban' && auth.session.role !== 'superadmin') {
          return NextResponse.json({ error: 'Only superadmin can ban users' }, { status: 403 })
        }
        await resolveReport(id, {
          action: body.moderationAction,
          reason: body.reason,
          notes: body.notes,
          resolvedBy: actorId,
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Report ${action} successful`,
    })
  } catch (error: any) {
    console.error('Error performing report action:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform action' },
      { status: 500 }
    )
  }
}

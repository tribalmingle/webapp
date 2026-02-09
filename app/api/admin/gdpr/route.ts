import { NextRequest, NextResponse } from 'next/server'
import { ensureAdminRequest } from '@/lib/admin/auth'
import {
  requestDataExport,
  processDataExport,
  requestAccountDeletion,
  cancelDeletionRequest,
  processAccountDeletion,
  getDataInventory,
  verifyAuditLogIntegrity,
  runDataRetentionCleanup,
} from '@/lib/services/gdpr-service'
import { getMongoDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

/**
 * GET /api/admin/gdpr - Get GDPR overview and data inventory
 */
export async function GET(req: NextRequest) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  // Only superadmin can access GDPR data
  if (auth.session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    const db = await getMongoDb()

    if (action === 'inventory') {
      const inventory = await getDataInventory()
      return NextResponse.json({ success: true, inventory })
    }

    if (action === 'verify-audit') {
      const startDate = searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined
      const endDate = searchParams.get('endDate')
        ? new Date(searchParams.get('endDate')!)
        : undefined

      const result = await verifyAuditLogIntegrity(startDate, endDate)
      return NextResponse.json({ success: true, ...result })
    }

    // Default: return overview
    const [
      pendingExports,
      completedExports,
      pendingDeletions,
      completedDeletions,
      recentAuditLogs,
    ] = await Promise.all([
      db.collection('gdpr_data_exports').countDocuments({
        status: { $in: ['pending', 'processing'] },
      }),
      db.collection('gdpr_data_exports').countDocuments({
        status: 'completed',
        completedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      db.collection('deletion_requests').countDocuments({
        status: { $in: ['pending', 'approved', 'processing'] },
      }),
      db.collection('deletion_requests').countDocuments({
        status: 'completed',
        deletedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      db
        .collection('admin_audit_log')
        .find({ action: { $regex: /^(data_export|deletion|consent)/ } })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray(),
    ])

    return NextResponse.json({
      success: true,
      overview: {
        exports: { pending: pendingExports, completedLast30Days: completedExports },
        deletions: { pending: pendingDeletions, completedLast30Days: completedDeletions },
      },
      recentActivity: recentAuditLogs.map((l) => ({
        ...l,
        _id: l._id.toString(),
      })),
    })
  } catch (error: any) {
    console.error('Error fetching GDPR data:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch GDPR data' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/gdpr - GDPR actions
 */
export async function POST(req: NextRequest) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  if (auth.session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'export': {
        const { userId, format, collections } = body
        if (!userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 })
        }
        const request = await requestDataExport(userId, format, collections)
        return NextResponse.json({
          success: true,
          request: { ...request, _id: request._id.toString() },
        })
      }

      case 'process-export': {
        const { requestId } = body
        if (!requestId) {
          return NextResponse.json({ error: 'requestId required' }, { status: 400 })
        }
        await processDataExport(requestId)
        return NextResponse.json({
          success: true,
          message: 'Export processing started',
        })
      }

      case 'delete': {
        const { userId, reason } = body
        if (!userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 })
        }
        const request = await requestAccountDeletion(userId, reason)
        return NextResponse.json({
          success: true,
          request: { ...request, _id: request._id.toString() },
        })
      }

      case 'approve-deletion': {
        const { requestId } = body
        if (!requestId) {
          return NextResponse.json({ error: 'requestId required' }, { status: 400 })
        }
        const db = await getMongoDb()
        await db.collection('deletion_requests').updateOne(
          { _id: new ObjectId(requestId), status: 'pending' },
          {
            $set: {
              status: 'approved',
              approvedBy: auth.session.email,
              approvedAt: new Date(),
              updatedAt: new Date(),
            },
          }
        )
        return NextResponse.json({
          success: true,
          message: 'Deletion approved',
        })
      }

      case 'process-deletion': {
        const { requestId } = body
        if (!requestId) {
          return NextResponse.json({ error: 'requestId required' }, { status: 400 })
        }
        await processAccountDeletion(requestId)
        return NextResponse.json({
          success: true,
          message: 'Deletion processing started',
        })
      }

      case 'run-retention-cleanup': {
        const result = await runDataRetentionCleanup()
        return NextResponse.json({
          success: true,
          ...result,
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error processing GDPR action:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process action' },
      { status: 500 }
    )
  }
}

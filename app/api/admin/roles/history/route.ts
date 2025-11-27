import { NextRequest, NextResponse } from 'next/server'
import { withRBAC } from '@/lib/middleware/rbac'
import { getMongoDb as getDb } from '@/lib/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'

/**
 * GET /api/admin/roles/history
 * Get role change history
 */
export const GET = withRBAC(
  async (request: NextRequest) => {
    const db = await getDb()
    
    // Get role change history from audit logs
    const history = await db
      .collection(COLLECTIONS.AUDIT_LOGS)
      .find({
        eventType: { $in: ['role.granted', 'role.revoked', 'user.role_changed'] },
      })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray()

    // Enrich with user names
    const enrichedHistory = await Promise.all(
      history.map(async (record: any) => {
        const user = await db
          .collection(COLLECTIONS.USERS)
          .findOne({ _id: record.targetId })
        
        const changedBy = await db
          .collection(COLLECTIONS.USERS)
          .findOne({ _id: record.actorId })

        return {
          _id: record._id.toString(),
          userId: record.targetId?.toString(),
          userName: user?.name || user?.email || 'Unknown User',
          fromRole: record.metadata?.fromRole || 'none',
          toRole: record.metadata?.toRole || 'none',
          changedBy: record.actorId?.toString(),
          changedByName: changedBy?.name || changedBy?.email || 'System',
          reason: record.metadata?.reason,
          timestamp: record.timestamp,
        }
      })
    )

    return NextResponse.json({ history: enrichedHistory })
  },
  { operation: 'VIEW_AUDIT' }
)

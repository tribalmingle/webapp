import { NextRequest, NextResponse } from 'next/server'
import { withRBAC } from '@/lib/middleware/rbac'
import { getMongoDb as getDb } from '@/lib/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'
import { ObjectId } from 'mongodb'
import { logAuditEvent, AuditSeverity } from '@/lib/services/audit-service'

/**
 * POST /api/admin/roles/revoke
 * Revoke a user's role (set to viewer)
 */
export const POST = withRBAC(
  async (request: NextRequest, authenticatedUser: any) => {
    if (!authenticatedUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, reason } = body as {
      userId: string
      reason?: string
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const db = await getDb()
    
    // Get current user data
    const targetUser = await db
      .collection(COLLECTIONS.USERS)
      .findOne({ _id: new ObjectId(userId) })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const previousRole = targetUser.role || 'viewer'

    // Revoke role (set to viewer - the lowest level)
    await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role: 'viewer',
          roleAssignedAt: new Date(),
          roleAssignedBy: new ObjectId(authenticatedUser.id),
        },
      }
    )

    // Log the role revocation
    await logAuditEvent({
      eventType: 'role.revoked',
      severity: AuditSeverity.WARNING,
      actorId: authenticatedUser.id,
      targetId: userId,
      action: `Revoked role: ${previousRole}`,
      metadata: {
        fromRole: previousRole,
        toRole: 'viewer',
        reason,
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      userAgent: request.headers.get('user-agent') || '',
    })

    return NextResponse.json({
      success: true,
      message: 'Role revoked successfully',
    })
  },
  { operation: 'EDIT_USER' }
)

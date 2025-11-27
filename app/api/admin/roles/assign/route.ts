import { NextRequest, NextResponse } from 'next/server'
import { withRBAC } from '@/lib/middleware/rbac'
import { getMongoDb as getDb } from '@/lib/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'
import { ObjectId } from 'mongodb'
import { AdminRole } from '@/lib/auth/roles'
import { logAuditEvent, AuditSeverity } from '@/lib/services/audit-service'

/**
 * POST /api/admin/roles/assign
 * Assign a role to a user
 */
export const POST = withRBAC(
  async (request: NextRequest, authenticatedUser: any) => {
    if (!authenticatedUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, role, reason } = body as {
      userId: string
      role: AdminRole
      reason?: string
    }

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      )
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

    // Update user role
    await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role,
          roleAssignedAt: new Date(),
          roleAssignedBy: new ObjectId(authenticatedUser.id),
        },
      }
    )

    // Log the role assignment
    await logAuditEvent({
      eventType: 'role.granted',
      severity: AuditSeverity.WARNING,
      actorId: authenticatedUser.id,
      targetId: userId,
      action: `Assigned role: ${role}`,
      metadata: {
        fromRole: previousRole,
        toRole: role,
        reason,
      },
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      userAgent: request.headers.get('user-agent') || '',
    })

    return NextResponse.json({
      success: true,
      message: `Role ${role} assigned to user`,
    })
  },
  { operation: 'EDIT_USER' }
)

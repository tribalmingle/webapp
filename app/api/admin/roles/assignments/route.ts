import { NextRequest, NextResponse } from 'next/server'
import { withRBAC } from '@/lib/middleware/rbac'
import { getMongoDb as getDb } from '@/lib/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'

/**
 * GET /api/admin/roles/assignments
 * Get all user role assignments
 */
export const GET = withRBAC(
  async (request: NextRequest) => {
    const db = await getDb()
    
    // Get all users with roles
    const users = await db
      .collection(COLLECTIONS.USERS)
      .find({
        role: { $exists: true, $ne: null },
      })
      .project({
        _id: 1,
        email: 1,
        name: 1,
        role: 1,
        roleAssignedAt: 1,
        roleAssignedBy: 1,
      })
      .toArray()

    // Enrich with assigner information
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        let assignedByName = 'System'
        if (user.roleAssignedBy) {
          const assigner = await db
            .collection(COLLECTIONS.USERS)
            .findOne({ _id: user.roleAssignedBy })
          assignedByName = assigner?.name || 'Unknown'
        }

        return {
          _id: user._id.toString(),
          userId: user._id.toString(),
          email: user.email,
          name: user.name || user.email,
          currentRole: user.role || 'viewer',
          assignedAt: user.roleAssignedAt || new Date(),
          assignedBy: user.roleAssignedBy?.toString() || 'system',
          assignedByName,
        }
      })
    )

    return NextResponse.json({ users: enrichedUsers })
  },
  { operation: 'VIEW_USER' }
)

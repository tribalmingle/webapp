import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/db/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, targetUserId, reportId, reason, evidence, duration } = body

    const moderationActions = await getCollection(COLLECTIONS.MODERATION_ACTIONS)
    const users = await getCollection(COLLECTIONS.USERS)

    // Create moderation action record
    const actionRecord = {
      _id: new ObjectId(),
      moderatorId: new ObjectId(user.userId),
      targetUserId: new ObjectId(targetUserId),
      action,
      reportId: reportId ? new ObjectId(reportId) : null,
      reason,
      evidence,
      duration, // for suspensions/bans
      createdAt: new Date(),
      expiresAt: duration ? new Date(Date.now() + duration * 1000) : null,
    }

    await moderationActions.insertOne(actionRecord as any)

    // Apply action to user
    switch (action) {
      case 'warn':
        await users.updateOne(
          { _id: new ObjectId(targetUserId) },
          { 
            $push: { trustWarnings: actionRecord as any },
            $set: { updatedAt: new Date() },
          }
        )
        break

      case 'suspend':
        await users.updateOne(
          { _id: new ObjectId(targetUserId) },
          { 
            $set: { 
              accountStatus: 'suspended',
              suspendedUntil: actionRecord.expiresAt,
              updatedAt: new Date(),
            },
          }
        )
        break

      case 'ban':
        await users.updateOne(
          { _id: new ObjectId(targetUserId) },
          { 
            $set: { 
              accountStatus: 'banned',
              bannedAt: new Date(),
              updatedAt: new Date(),
            },
          }
        )
        break

      case 'approve':
      case 'reject':
        // Handle verification approvals/rejections
        break
    }

    // Update report status if linked
    if (reportId) {
      const reports = await getCollection(COLLECTIONS.TRUST_REPORTS)
      await reports.updateOne(
        { _id: new ObjectId(reportId) },
        { 
          $set: { 
            status: 'resolved',
            resolvedAt: new Date(),
            resolution: action,
            resolvedBy: new ObjectId(user.userId),
          },
        }
      )
    }

    return NextResponse.json({ success: true, actionId: actionRecord._id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

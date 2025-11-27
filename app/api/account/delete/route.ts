/**
 * Account Deletion API
 * GDPR compliance - right to erasure
 */

import { NextRequest, NextResponse } from 'next/server'
// Authentication will be handled by middleware or custom auth
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'
import { getMongoDb } from '@/lib/mongodb'
import { CollectionNames } from '@/lib/data/collection-names'
import { ObjectId } from 'mongodb'
import { queueAccountDeletion, cancelAccountDeletion } from '@/lib/jobs/account-deletion'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Request account deletion
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Implement proper authentication
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { reason, feedback } = body

    const db = await getMongoDb()

    // Check if there's already a pending deletion
    const existingDeletion = await db
      .collection(CollectionNames.ACCOUNT_DELETIONS)
      .findOne({
        user_id: new ObjectId(userId),
        status: { $in: ['pending', 'processing'] },
      })

    if (existingDeletion) {
      const gracePeriodEnd = new Date(existingDeletion.created_at)
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30)

      return NextResponse.json(
        {
          error: 'Deletion already scheduled',
          deletionId: existingDeletion._id.toString(),
          status: existingDeletion.status,
          scheduledFor: gracePeriodEnd,
          canCancel: existingDeletion.status === 'pending',
        },
        { status: 409 }
      )
    }

    // Calculate deletion date (30 days grace period)
    const now = new Date()
    const deletionDate = new Date(now)
    deletionDate.setDate(deletionDate.getDate() + 30)

    // Create deletion request record
    const deletionRecord = {
      user_id: new ObjectId(userId),
      status: 'pending',
      reason: reason || 'not_specified',
      feedback: feedback || null,
      requested_at: now,
      scheduled_for: deletionDate,
      created_at: now,
      updated_at: now,
    }

    const result = await db
      .collection(CollectionNames.ACCOUNT_DELETIONS)
      .insertOne(deletionRecord)

    const deletionId = result.insertedId.toString()

    // Queue the account deletion job (with 30-day delay)
    await queueAccountDeletion(userId, '30')

    // Soft-delete user account immediately (can be restored during grace period)
    await db.collection(CollectionNames.USERS).updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          deletion_scheduled_at: now,
          deletion_scheduled_for: deletionDate,
          updated_at: now,
        },
      }
    )

    console.log('[account-delete] Account deletion scheduled', {
      userId,
      deletionId,
      scheduledFor: deletionDate,
    })

    return NextResponse.json({
      deletionId,
      status: 'pending',
      scheduledFor: deletionDate,
      gracePeriodDays: 30,
      message: `Your account will be permanently deleted on ${deletionDate.toLocaleDateString()}. You can cancel this request within 30 days.`,
    })
  } catch (error) {
    console.error('[account-delete] Error requesting deletion', error)
    return NextResponse.json(
      { error: 'Failed to request account deletion' },
      { status: 500 }
    )
  }
}

/**
 * Cancel account deletion (during grace period)
 */
export async function DELETE(request: NextRequest) {
  try {
    // TODO: Implement proper authentication
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const db = await getMongoDb()

    // Find pending deletion request
    const deletionRecord = await db
      .collection(CollectionNames.ACCOUNT_DELETIONS)
      .findOne({
        user_id: new ObjectId(userId),
        status: 'pending',
      })

    if (!deletionRecord) {
      return NextResponse.json(
        { error: 'No pending deletion found' },
        { status: 404 }
      )
    }

    // Cancel the deletion
    await cancelAccountDeletion(userId)

    // Restore user account
    await db.collection(CollectionNames.USERS).updateOne(
      { _id: new ObjectId(userId) },
      {
        $unset: {
          deletion_scheduled_at: '',
          deletion_scheduled_for: '',
        },
        $set: {
          updated_at: new Date(),
        },
      }
    )

    console.log('[account-delete] Account deletion cancelled', { userId })

    return NextResponse.json({
      message: 'Account deletion cancelled successfully',
      status: 'cancelled',
    })
  } catch (error) {
    console.error('[account-delete] Error cancelling deletion', error)
    return NextResponse.json(
      { error: 'Failed to cancel account deletion' },
      { status: 500 }
    )
  }
}

/**
 * Get deletion status
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Implement proper authentication
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const db = await getMongoDb()

    // Get deletion record
    const deletionRecord = await db
      .collection(CollectionNames.ACCOUNT_DELETIONS)
      .findOne(
        {
          user_id: new ObjectId(userId),
          status: { $in: ['pending', 'processing', 'completed'] },
        },
        { sort: { created_at: -1 } }
      )

    if (!deletionRecord) {
      return NextResponse.json({
        hasDeletion: false,
        message: 'No deletion scheduled',
      })
    }

    const now = new Date()
    const scheduledFor = new Date(deletionRecord.scheduled_for)
    const daysRemaining = Math.ceil(
      (scheduledFor.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    return NextResponse.json({
      hasDeletion: true,
      deletionId: deletionRecord._id.toString(),
      status: deletionRecord.status,
      requestedAt: deletionRecord.requested_at,
      scheduledFor: deletionRecord.scheduled_for,
      daysRemaining: Math.max(0, daysRemaining),
      canCancel: deletionRecord.status === 'pending' && daysRemaining > 0,
    })
  } catch (error) {
    console.error('[account-delete] Error getting deletion status', error)
    return NextResponse.json(
      { error: 'Failed to get deletion status' },
      { status: 500 }
    )
  }
}

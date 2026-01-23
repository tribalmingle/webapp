import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const userPayload = await getCurrentUser()
    
    if (!userPayload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    const db = await getMongoDb()
    const passesCollection = db.collection('passes')
    const usersCollection = db.collection('users')

    let currentUserObjectId: ObjectId | null = null
    if (userPayload.userId && ObjectId.isValid(userPayload.userId)) {
      currentUserObjectId = new ObjectId(userPayload.userId)
    } else if (userPayload.email) {
      const currentUserDoc = await usersCollection.findOne(
        { email: userPayload.email.toLowerCase() },
        { projection: { _id: 1 } }
      )
      if (currentUserDoc?._id) {
        currentUserObjectId = currentUserDoc._id
      }
    }

    // Check if already passed
    const normalizedPassedUserId =
      typeof userId === 'string'
        ? userId
        : userId?.userId ?? userId?.id ?? userId?._id ?? userId?.$oid

    const passedUserObjectId =
      normalizedPassedUserId && ObjectId.isValid(String(normalizedPassedUserId))
        ? new ObjectId(String(normalizedPassedUserId))
        : null

    const now = new Date()
    const expiresAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)

    const existingPass = await passesCollection.findOne({
      $and: [
        {
          $or: [
            ...(currentUserObjectId ? [{ userId: currentUserObjectId }] : []),
            { userId: userPayload.email },
          ],
        },
        {
          $or: [
            ...(passedUserObjectId ? [{ passedUserId: passedUserObjectId }] : []),
            { passedUserId: normalizedPassedUserId },
          ],
        },
        {
          $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
        },
      ],
    })

    if (existingPass) {
      return NextResponse.json(
        { success: false, message: 'Already passed this user' },
        { status: 400 }
      )
    }

    // Create pass
    await passesCollection.updateOne(
      {
        $and: [
          {
            $or: [
              ...(currentUserObjectId ? [{ userId: currentUserObjectId }] : []),
              { userId: userPayload.email },
            ],
          },
          {
            $or: [
              ...(passedUserObjectId ? [{ passedUserId: passedUserObjectId }] : []),
              { passedUserId: normalizedPassedUserId },
            ],
          },
        ],
      },
      {
        $set: {
          userId: currentUserObjectId || userPayload.email,
          passedUserId: passedUserObjectId || normalizedPassedUserId,
          expiresAt,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      message: 'User snoozed successfully',
      expiresAt
    })

  } catch (error: any) {
    console.error('[likes/pass] Error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

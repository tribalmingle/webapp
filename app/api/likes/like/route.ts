import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { MatchingService } from '@/lib/services/matching-service'
import { enqueuePushEvent } from '@/lib/services/push-events-service'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    
    if (!user?.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { userId } = body

    const likedUserIdValue =
      typeof userId === 'string'
        ? userId
        : userId?.userId ?? userId?.id ?? userId?._id ?? userId?.$oid

    if (!likedUserIdValue) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const likesCollection = db.collection('likes')
    const usersCollection = db.collection('users')
    const notificationsCollection = db.collection('notifications')

    let currentUserObjectId: ObjectId | null = null
    if (ObjectId.isValid(user.userId)) {
      currentUserObjectId = new ObjectId(user.userId)
    } else if (user.email) {
      const currentUserDoc = await usersCollection.findOne(
        { email: user.email.toLowerCase() },
        { projection: { _id: 1 } }
      )
      if (currentUserDoc?._id) {
        currentUserObjectId = currentUserDoc._id
      }
    }

    if (!currentUserObjectId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    let likedUserObjectId: ObjectId | null = null
    if (ObjectId.isValid(likedUserIdValue)) {
      likedUserObjectId = new ObjectId(likedUserIdValue)
    } else {
      const userDoc = await usersCollection.findOne({
        email: String(likedUserIdValue).toLowerCase(),
      })
      if (userDoc?._id) {
        likedUserObjectId = userDoc._id
      }
    }

    if (!likedUserObjectId) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Check if already liked
    const existingLike = await likesCollection.findOne({
      userId: currentUserObjectId,
      likedUserId: likedUserObjectId
    })

    if (existingLike) {
      return NextResponse.json(
        { success: false, message: 'Already liked this user' },
        { status: 400 }
      )
    }

    // Create like
    await likesCollection.insertOne({
      userId: currentUserObjectId,
      likedUserId: likedUserObjectId,
      createdAt: new Date()
    })

    const now = new Date()
    const senderDoc = await usersCollection.findOne(
      { _id: currentUserObjectId },
      { projection: { name: 1, profilePhotos: 1, profilePhoto: 1 } }
    )
    const senderName = senderDoc?.name || 'Someone'
    const senderPhoto = senderDoc?.profilePhotos?.[0] || senderDoc?.profilePhoto || undefined

    await notificationsCollection.insertOne({
      userId: likedUserObjectId,
      category: 'match',
      type: 'like_received',
      channel: 'in_app',
      templateId: 'like_received_v1',
      payload: {
        heading: 'New like',
        body: `${senderName} liked you.`,
        senderId: currentUserObjectId.toHexString(),
        senderName,
        senderPhoto,
      },
      status: 'sent',
      priority: 'normal',
      createdAt: now,
      updatedAt: now,
    })

    try {
      await enqueuePushEvent({
        type: 'like',
        recipientUserId: likedUserObjectId.toHexString(),
        senderUserId: currentUserObjectId.toHexString(),
        senderName,
        senderPhoto,
      })
    } catch (error) {
      console.warn('[likes] push enqueue failed', error)
    }

    const mutualLike = await likesCollection.findOne({
      userId: likedUserObjectId,
      likedUserId: currentUserObjectId,
    })

    if (mutualLike) {
      const matchesCollection = db.collection('matches')
      const pairHash = MatchingService.pairHash(currentUserObjectId.toHexString(), likedUserObjectId.toHexString())
      const existingMatch = await matchesCollection.findOne({ pairHash })
      if (!existingMatch) {
        const memberIds = [currentUserObjectId, likedUserObjectId].sort((a, b) =>
          a.toHexString().localeCompare(b.toHexString())
        )
        await matchesCollection.insertOne({
          memberIds,
          pairHash,
          state: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          confirmedAt: new Date(),
        })
      }

      const likedDoc = await usersCollection.findOne(
        { _id: likedUserObjectId },
        { projection: { name: 1, profilePhotos: 1, profilePhoto: 1 } }
      )
      const likedName = likedDoc?.name || 'New match'
      const likedPhoto = likedDoc?.profilePhotos?.[0] || likedDoc?.profilePhoto || undefined

      const matchNotifications = [
        {
          userId: likedUserObjectId,
          otherId: currentUserObjectId,
          otherName: senderName,
          otherPhoto: senderPhoto,
        },
        {
          userId: currentUserObjectId,
          otherId: likedUserObjectId,
          otherName: likedName,
          otherPhoto: likedPhoto,
        },
      ]

      await notificationsCollection.insertMany(
        matchNotifications.map((item) => ({
          userId: item.userId,
          category: 'match',
          type: 'match_created',
          channel: 'in_app',
          templateId: 'match_created_v1',
          payload: {
            heading: 'It’s a match!',
            body: `You matched with ${item.otherName}.`,
            matchId: pairHash,
            otherId: item.otherId.toHexString(),
            otherName: item.otherName,
            otherPhoto: item.otherPhoto,
          },
          status: 'sent',
          priority: 'high',
          createdAt: now,
          updatedAt: now,
        }))
      )

      try {
        await enqueuePushEvent({
          type: 'match',
          recipientUserId: likedUserObjectId.toHexString(),
          senderUserId: currentUserObjectId.toHexString(),
          senderName,
          senderPhoto,
        })

        await enqueuePushEvent({
          type: 'match',
          recipientUserId: currentUserObjectId.toHexString(),
          senderUserId: likedUserObjectId.toHexString(),
          senderName: likedName,
          senderPhoto: likedPhoto,
        })
      } catch (error) {
        console.warn('[likes] match push enqueue failed', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User liked successfully',
      mutual: Boolean(mutualLike)
    })
  } catch (error) {
    console.error('Error liking user:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

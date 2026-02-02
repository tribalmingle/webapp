import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCurrentUser } from '@/lib/auth'
import { getMongoDb } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const db = await getMongoDb()
    const usersCollection = db.collection('users')
    const notificationsCollection = db.collection('notifications')
    const messagesCollection = db.collection('messages')
    const likesCollection = db.collection('likes')
    const viewsCollection = db.collection('profile_views')

    let userObjectId: ObjectId | null = null
    if (user.userId && ObjectId.isValid(user.userId)) {
      userObjectId = new ObjectId(user.userId)
    } else if (user.email) {
      const userDoc = await usersCollection.findOne({ email: user.email.toLowerCase() }, { projection: { _id: 1 } })
      if (userDoc?._id) userObjectId = userDoc._id
    }

    if (!userObjectId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const senderCache = new Map<string, { name?: string; photo?: string }>()

    const resolveSenderByEmail = async (email: string) => {
      const key = email.toLowerCase()
      if (senderCache.has(key)) return senderCache.get(key)!
      const doc = await usersCollection.findOne(
        { email: key },
        { projection: { name: 1, profilePhotos: 1, profilePhoto: 1 } }
      )
      const sender = {
        name: doc?.name,
        photo: doc?.profilePhotos?.[0] || doc?.profilePhoto,
      }
      senderCache.set(key, sender)
      return sender
    }

    const resolveSenderById = async (id: ObjectId) => {
      const key = id.toHexString()
      if (senderCache.has(key)) return senderCache.get(key)!
      const doc = await usersCollection.findOne(
        { _id: id },
        { projection: { name: 1, profilePhotos: 1, profilePhoto: 1, email: 1 } }
      )
      const sender = {
        name: doc?.name,
        photo: doc?.profilePhotos?.[0] || doc?.profilePhoto,
      }
      senderCache.set(key, sender)
      if (doc?.email) senderCache.set(doc.email.toLowerCase(), sender)
      return sender
    }

    if (user.email) {
      const recentMessages = await messagesCollection
        .find({ receiverId: user.email.toLowerCase() })
        .sort({ createdAt: -1 })
        .limit(25)
        .toArray()

      for (const message of recentMessages) {
        const sender = await resolveSenderByEmail(String(message.senderId))
        await notificationsCollection.updateOne(
          { dedupeKey: `message:${message._id}` },
          {
            $setOnInsert: {
              userId: userObjectId,
              category: 'message',
              type: 'message_received',
              channel: 'in_app',
              templateId: 'message_received_v1',
              payload: {
                heading: `New message from ${sender.name || 'Member'}`,
                body: String(message.message || '').slice(0, 140),
                senderName: sender.name,
                senderEmail: message.senderId,
                senderPhoto: sender.photo,
              },
              status: 'sent',
              priority: 'high',
              createdAt: message.createdAt || now,
              updatedAt: now,
              dedupeKey: `message:${message._id}`,
            },
          },
          { upsert: true }
        )
      }
    }

    const recentLikes = await likesCollection
      .find({ likedUserId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(25)
      .toArray()

    for (const like of recentLikes) {
      if (!like.userId) continue
      const sender = await resolveSenderById(like.userId)
      await notificationsCollection.updateOne(
        { dedupeKey: `like:${like._id}` },
        {
          $setOnInsert: {
            userId: userObjectId,
            category: 'match',
            type: 'like_received',
            channel: 'in_app',
            templateId: 'like_received_v1',
            payload: {
              heading: 'New like',
              body: `${sender.name || 'Someone'} liked you.`,
              senderName: sender.name,
              senderPhoto: sender.photo,
            },
            status: 'sent',
            priority: 'normal',
            createdAt: like.createdAt || now,
            updatedAt: now,
            dedupeKey: `like:${like._id}`,
          },
        },
        { upsert: true }
      )
    }

    if (user.email) {
      const recentViews = await viewsCollection
        .find({ viewedUserId: user.email.toLowerCase() })
        .sort({ viewedAt: -1 })
        .limit(25)
        .toArray()

      for (const view of recentViews) {
        const sender = await resolveSenderByEmail(String(view.userId))
        await notificationsCollection.updateOne(
          { dedupeKey: `view:${view._id}` },
          {
            $setOnInsert: {
              userId: userObjectId,
              category: 'growth',
              type: 'profile_view',
              channel: 'in_app',
              templateId: 'profile_view_v1',
              payload: {
                heading: 'Profile viewed',
                body: `${sender.name || 'Someone'} viewed your profile.`,
                viewerName: sender.name,
                viewerEmail: view.userId,
                viewerPhoto: sender.photo,
              },
              status: 'sent',
              priority: 'normal',
              createdAt: view.viewedAt || now,
              updatedAt: now,
              dedupeKey: `view:${view._id}`,
            },
          },
          { upsert: true }
        )
      }
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit') || 100), 200)

    const docs = await notificationsCollection
      .find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    const notifications = docs.map((doc) => ({
      id: doc._id?.toString(),
      title: doc.payload?.heading || doc.payload?.title || doc.type || 'Notification',
      body: doc.payload?.body || doc.payload?.message || undefined,
      data: doc.payload || {},
      read: Boolean(doc.readAt),
      createdAt: doc.createdAt?.toISOString?.() || doc.createdAt,
    }))

    const unreadCount = docs.filter((doc) => !doc.readAt).length

    return NextResponse.json({ success: true, notifications, unreadCount })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

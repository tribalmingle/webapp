import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getMongoDb } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { enqueuePushEvent } from '@/lib/services/push-events-service'

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
    const { receiverId, message } = body

    if (!receiverId || !message) {
      return NextResponse.json(
        { success: false, message: 'Receiver ID and message are required' },
        { status: 400 }
      )
    }

    const db = await getMongoDb()
    const messagesCollection = db.collection('messages')
    const usersCollection = db.collection('users')
    const notificationsCollection = db.collection('notifications')

    let receiverEmail = String(receiverId).toLowerCase()
    let receiverDoc = null as any

    if (!receiverEmail.includes('@')) {
      const maybeObjectId = receiverId
      const objectId = typeof maybeObjectId === 'string' && ObjectId.isValid(maybeObjectId)
        ? new ObjectId(maybeObjectId)
        : null
      receiverDoc = await usersCollection.findOne(objectId ? { _id: objectId } : { email: receiverEmail })
      if (receiverDoc?.email) {
        receiverEmail = String(receiverDoc.email).toLowerCase()
      }
    } else {
      receiverDoc = await usersCollection.findOne({ email: receiverEmail })
    }

    if (!receiverEmail.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Receiver not found' },
        { status: 400 }
      )
    }

    // Create message
    const newMessage = {
      senderId: userPayload.email,
      receiverId: receiverEmail,
      message,
      createdAt: new Date()
    }

    const result = await messagesCollection.insertOne(newMessage)

    if (receiverDoc?._id) {
      const senderDoc = await usersCollection.findOne(
        { email: userPayload.email },
        { projection: { name: 1, profilePhotos: 1, profilePhoto: 1 } }
      )
      const senderName = senderDoc?.name || 'New message'
      const senderPhoto = senderDoc?.profilePhotos?.[0] || senderDoc?.profilePhoto || undefined
      const now = new Date()

      await notificationsCollection.insertOne({
        userId: receiverDoc._id,
        category: 'message',
        type: 'message_received',
        channel: 'in_app',
        templateId: 'message_received_v1',
        payload: {
          heading: `New message from ${senderName}`,
          body: String(message).slice(0, 140),
          senderName,
          senderEmail: userPayload.email,
          senderPhoto,
        },
        status: 'sent',
        priority: 'high',
        createdAt: now,
        updatedAt: now,
      })

      try {
        await enqueuePushEvent({
          type: 'message',
          recipientUserId: receiverDoc._id.toHexString(),
          senderUserId: String(userPayload.userId || userPayload.email || senderDoc?._id?.toHexString?.() || ''),
          senderName,
          senderPhoto,
          messagePreview: String(message).slice(0, 140),
          threadId: userPayload.email,
        })
      } catch (error) {
        console.warn('[messages] push enqueue failed', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      messageId: result.insertedId.toString()
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

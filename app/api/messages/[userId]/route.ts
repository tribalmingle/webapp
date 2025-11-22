import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const userPayload = await getCurrentUser()
    
    if (!userPayload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userId } = await params

    const db = await getMongoDb()
    const messagesCollection = db.collection('messages')

    // Fetch messages between current user and the other user
    const messages = await messagesCollection
      .find({
        $or: [
          { senderId: userPayload.email, receiverId: userId },
          { senderId: userId, receiverId: userPayload.email }
        ]
      })
      .sort({ createdAt: 1 })
      .toArray()

    const formattedMessages = messages.map(msg => ({
      _id: msg._id.toString(),
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      message: msg.message,
      createdAt: msg.createdAt
    }))

    return NextResponse.json({
      success: true,
      messages: formattedMessages
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

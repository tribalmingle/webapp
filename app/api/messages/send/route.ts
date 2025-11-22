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
    const { receiverId, message } = body

    if (!receiverId || !message) {
      return NextResponse.json(
        { success: false, message: 'Receiver ID and message are required' },
        { status: 400 }
      )
    }

    const db = await getMongoDb()
    const messagesCollection = db.collection('messages')

    // Create message
    const newMessage = {
      senderId: userPayload.email,
      receiverId,
      message,
      createdAt: new Date()
    }

    const result = await messagesCollection.insertOne(newMessage)

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

import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const userPayload = await getCurrentUser()
    
    if (!userPayload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = await getMongoDb()
    const messagesCollection = db.collection('messages')
    const usersCollection = db.collection('users')

    // Get all unique conversations (users who have messaged with current user)
    const sentMessages = await messagesCollection.distinct('receiverId', {
      senderId: userPayload.email
    })

    const receivedMessages = await messagesCollection.distinct('senderId', {
      receiverId: userPayload.email
    })

    // Combine and deduplicate
    const uniqueUserEmails = Array.from(new Set([...sentMessages, ...receivedMessages]))

    // Get conversation details
    const conversations = await Promise.all(
      uniqueUserEmails.map(async (userEmail) => {
        // Get the other user's details
        const otherUser = await usersCollection.findOne({ email: userEmail })
        
        if (!otherUser) return null

        // Get last message
        const lastMessage = await messagesCollection.findOne(
          {
            $or: [
              { senderId: userPayload.email, receiverId: userEmail },
              { senderId: userEmail, receiverId: userPayload.email }
            ]
          },
          { sort: { createdAt: -1 } }
        )

        // Count unread messages
        const unreadCount = await messagesCollection.countDocuments({
          senderId: userEmail,
          receiverId: userPayload.email,
          read: { $ne: true }
        })

        return {
          userId: otherUser.email,
          name: otherUser.name,
          avatar: otherUser.profilePhotos?.[0] || otherUser.profilePhoto || '',
          lastMessage: lastMessage?.message || 'No messages yet',
          time: lastMessage ? formatTimeAgo(lastMessage.createdAt) : '',
          unread: unreadCount,
          online: false // You can implement online status tracking separately
        }
      })
    )

    // Filter out null values and sort by last message time
    const validConversations = conversations.filter(Boolean)

    return NextResponse.json({
      success: true,
      conversations: validConversations
    })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

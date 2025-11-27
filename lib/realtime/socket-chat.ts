/**
 * Phase 5 - Socket.IO Realtime Chat Channels
 * Handles typing indicators, translator status, LiveKit invites, presence sync
 */

import type { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'

// Payload type definitions
interface TypingPayload { threadId: string; receiverId: string }
interface TranslatorStatusPayload { messageId: string; status: 'translating' | 'translated' | 'failed'; receiverId: string }
interface LiveKitInvitePayload { roomName: string; roomUrl: string; receiverId: string }
interface RecalledPayload { messageId: string; threadId: string; receiverId: string }

let io: SocketIOServer | null = null

export function initializeSocketIO(server: HTTPServer) {
  if (io) {
    return io
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true,
    },
  })

  // Authentication middleware
  io.use((socket: Socket, next: (err?: Error) => void) => {
    const userId = socket.handshake.auth.userId
    if (!userId) {
      return next(new Error('Authentication required'))
    }
    socket.data.userId = userId
    next()
  })

  // Chat namespace
  const chatNamespace = io.of('/chat')

  chatNamespace.on('connection', (socket: Socket) => {
    const userId = socket.data.userId
    console.log(`[Socket.IO] User ${userId} connected to chat namespace`)

    // Join user's personal room
    socket.join(`user:${userId}`)

    // Typing indicator
    socket.on('typing:start', (payload: TypingPayload) => {
      const { threadId, receiverId } = payload
      chatNamespace.to(`user:${receiverId}`).emit('typing:indicator', {
        userId,
        threadId,
        isTyping: true,
      })
    })

    socket.on('typing:stop', (payload: TypingPayload) => {
      const { threadId, receiverId } = payload
      chatNamespace.to(`user:${receiverId}`).emit('typing:indicator', {
        userId,
        threadId,
        isTyping: false,
      })
    })

    // Translation status
    socket.on('translator:status', (payload: TranslatorStatusPayload) => {
      const { messageId, status, receiverId } = payload
      chatNamespace.to(`user:${receiverId}`).emit('translator:update', {
        messageId,
        status, // 'translating', 'translated', 'failed'
        userId,
      })
    })

    // LiveKit invite
    socket.on('livekit:invite', (payload: LiveKitInvitePayload) => {
      const { roomName, roomUrl, receiverId } = payload
      chatNamespace.to(`user:${receiverId}`).emit('livekit:incoming', {
        inviterId: userId,
        roomName,
        roomUrl,
        timestamp: new Date().toISOString(),
      })
    })

    // Message recalled
    socket.on('message:recalled', (payload: RecalledPayload) => {
      const { messageId, threadId, receiverId } = payload
      chatNamespace.to(`user:${receiverId}`).emit('message:update', {
        messageId,
        threadId,
        status: 'recalled',
        content: '[Message recalled]',
      })
    })

    // Presence updates
    socket.on('presence:online', () => {
      // Broadcast to user's contacts that they're online
      socket.broadcast.emit('presence:status', {
        userId,
        status: 'online',
        lastSeenAt: new Date().toISOString(),
      })
    })

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User ${userId} disconnected from chat namespace`)
      
      // Broadcast offline status
      socket.broadcast.emit('presence:status', {
        userId,
        status: 'offline',
        lastSeenAt: new Date().toISOString(),
      })
    })
  })

  return io
}

export function getSocketIO(): SocketIOServer | null {
  return io
}

/**
 * Emit to specific user
 */
export function emitToUser(userId: string, event: string, data: any) {
  if (!io) {
    console.warn('[Socket.IO] Server not initialized')
    return
  }

  const chatNamespace = io.of('/chat')
  chatNamespace.to(`user:${userId}`).emit(event, data)
}

/**
 * Broadcast typing indicator
 */
export function broadcastTypingIndicator(userId: string, receiverId: string, threadId: string, isTyping: boolean) {
  emitToUser(receiverId, 'typing:indicator', {
    userId,
    threadId,
    isTyping,
  })
}

/**
 * Broadcast message update (e.g., recalled)
 */
export function broadcastMessageUpdate(receiverId: string, messageId: string, threadId: string, status: string) {
  emitToUser(receiverId, 'message:update', {
    messageId,
    threadId,
    status,
    updatedAt: new Date().toISOString(),
  })
}

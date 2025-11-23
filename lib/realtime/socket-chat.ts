/**
 * Phase 5 - Socket.IO Realtime Chat Channels
 * Handles typing indicators, translator status, LiveKit invites, presence sync
 */

import type { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'

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
  io.use((socket, next) => {
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
    socket.on('typing:start', ({ threadId, receiverId }) => {
      chatNamespace.to(`user:${receiverId}`).emit('typing:indicator', {
        userId,
        threadId,
        isTyping: true,
      })
    })

    socket.on('typing:stop', ({ threadId, receiverId }) => {
      chatNamespace.to(`user:${receiverId}`).emit('typing:indicator', {
        userId,
        threadId,
        isTyping: false,
      })
    })

    // Translation status
    socket.on('translator:status', ({ messageId, status, receiverId }) => {
      chatNamespace.to(`user:${receiverId}`).emit('translator:update', {
        messageId,
        status, // 'translating', 'translated', 'failed'
        userId,
      })
    })

    // LiveKit invite
    socket.on('livekit:invite', ({ roomName, roomUrl, receiverId }) => {
      chatNamespace.to(`user:${receiverId}`).emit('livekit:incoming', {
        inviterId: userId,
        roomName,
        roomUrl,
        timestamp: new Date().toISOString(),
      })
    })

    // Message recalled
    socket.on('message:recalled', ({ messageId, threadId, receiverId }) => {
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

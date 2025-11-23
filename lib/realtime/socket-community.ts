/**
 * Phase 6 - Socket.IO Realtime Community Channels
 * Handles live post creation, comment streaming, reaction updates, poll votes
 */
import type { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'

let io: SocketIOServer | null = null

export function initializeCommunitySocket(server: HTTPServer) {
  if (io) return io

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId
    if (!userId) return next(new Error('Authentication required'))
    socket.data.userId = userId
    next()
  })

  const namespace = io.of('/community')

  namespace.on('connection', (socket: Socket) => {
    const userId = socket.data.userId
    // Join personal room for targeted updates (e.g., moderation decisions impacting user's content)
    socket.join(`user:${userId}`)

    socket.on('club:join', ({ clubId }) => {
      socket.join(`club:${clubId}`)
      namespace.to(socket.id).emit('club:joined', { clubId })
    })

    socket.on('club:leave', ({ clubId }) => {
      socket.leave(`club:${clubId}`)
      namespace.to(socket.id).emit('club:left', { clubId })
    })

    socket.on('poll:vote', ({ clubId, postId, optionId }) => {
      // Broadcast vote increment event (client will refetch or optimistically update)
      namespace.to(`club:${clubId}`).emit('poll:vote', { postId, optionId, actorId: userId, ts: Date.now() })
    })

    socket.on('disconnect', () => {
      // No special handling yet
    })
  })

  return io
}

export function getCommunitySocket(): SocketIOServer | null {
  return io
}

function emitToClub(clubId: string, event: string, data: any) {
  if (!io) return
  io.of('/community').to(`club:${clubId}`).emit(event, data)
}

function emitToUser(userId: string, event: string, data: any) {
  if (!io) return
  io.of('/community').to(`user:${userId}`).emit(event, data)
}

// Broadcast helpers used by service layer after persistence
export const CommunityRealtime = {
  postCreated(clubId: string, post: { id: string }) {
    emitToClub(clubId, 'post:created', { postId: post.id })
  },
  commentAdded(clubId: string, postId: string, commentId: string) {
    emitToClub(clubId, 'comment:added', { postId, commentId })
  },
  reactionUpdated(clubId: string, postId: string, reactions: Array<{ type: string; count: number }>) {
    emitToClub(clubId, 'reaction:update', { postId, reactions })
  },
  postModerated(authorUserId: string, postId: string, state: string) {
    emitToUser(authorUserId, 'post:moderated', { postId, state })
  },
}

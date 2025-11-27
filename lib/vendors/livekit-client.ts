/**
 * LiveKit Client
 * Video and audio call integration for premium features
 */

import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET
const LIVEKIT_WS_URL = process.env.LIVEKIT_WS_URL || 'wss://livekit.tribalmingle.com'

export type LiveKitTokenResult =
  | { success: true; token: string; roomName: string }
  | { success: false; error: string }

export type RoomCreationResult =
  | { success: true; roomName: string; sid: string }
  | { success: false; error: string }

/**
 * Create a room for video/audio calls
 */
export async function createRoom(params: {
  roomName: string
  maxParticipants?: number
  emptyTimeout?: number
}): Promise<RoomCreationResult> {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    console.warn('[livekit] Credentials missing – skipping room creation')
    return { success: false, error: 'missing_credentials' }
  }

  try {
    const roomService = new RoomServiceClient(LIVEKIT_WS_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)

    const room = await roomService.createRoom({
      name: params.roomName,
      emptyTimeout: params.emptyTimeout || 300, // 5 minutes
      maxParticipants: params.maxParticipants || 10,
    })

    console.log('[livekit] Room created', {
      roomName: params.roomName,
      sid: room.sid,
    })

    return {
      success: true,
      roomName: params.roomName,
      sid: room.sid,
    }
  } catch (error) {
    console.error('[livekit] Room creation failed', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Room creation failed',
    }
  }
}

/**
 * Generate access token for participant
 */
export async function generateToken(params: {
  roomName: string
  participantId: string
  participantName: string
  canPublish?: boolean
  canSubscribe?: boolean
}): Promise<LiveKitTokenResult> {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    console.warn('[livekit] Credentials missing – skipping token generation')
    return { success: false, error: 'missing_credentials' }
  }

  try {
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: params.participantId,
      name: params.participantName,
    })

    at.addGrant({
      roomJoin: true,
      room: params.roomName,
      canPublish: params.canPublish !== false,
      canSubscribe: params.canSubscribe !== false,
    })

    const token = await at.toJwt()

    console.log('[livekit] Token generated', {
      roomName: params.roomName,
      participantId: params.participantId,
    })

    return {
      success: true,
      token,
      roomName: params.roomName,
    }
  } catch (error) {
    console.error('[livekit] Token generation failed', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token generation failed',
    }
  }
}

/**
 * End a room
 */
export async function endRoom(roomName: string): Promise<{ success: boolean; error?: string }> {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    console.warn('[livekit] Credentials missing – skipping room end')
    return { success: false, error: 'missing_credentials' }
  }

  try {
    const roomService = new RoomServiceClient(LIVEKIT_WS_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)

    await roomService.deleteRoom(roomName)

    console.log('[livekit] Room ended', { roomName })

    return { success: true }
  } catch (error) {
    console.error('[livekit] Room end failed', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Room end failed',
    }
  }
}

/**
 * List active rooms
 */
export async function listRooms(): Promise<{ success: boolean; rooms?: any[]; error?: string }> {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    console.warn('[livekit] Credentials missing – skipping room list')
    return { success: false, error: 'missing_credentials' }
  }

  try {
    const roomService = new RoomServiceClient(LIVEKIT_WS_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)

    const rooms = await roomService.listRooms()

    return { success: true, rooms }
  } catch (error) {
    console.error('[livekit] Room list failed', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Room list failed',
    }
  }
}

/**
 * Get room participants
 */
export async function getRoomParticipants(
  roomName: string
): Promise<{ success: boolean; participants?: any[]; error?: string }> {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    console.warn('[livekit] Credentials missing – skipping participant list')
    return { success: false, error: 'missing_credentials' }
  }

  try {
    const roomService = new RoomServiceClient(LIVEKIT_WS_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)

    const participants = await roomService.listParticipants(roomName)

    return { success: true, participants }
  } catch (error) {
    console.error('[livekit] Participant list failed', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Participant list failed',
    }
  }
}

/**
 * Remove participant from room
 */
export async function removeParticipant(params: {
  roomName: string
  participantId: string
}): Promise<{ success: boolean; error?: string }> {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    console.warn('[livekit] Credentials missing – skipping participant removal')
    return { success: false, error: 'missing_credentials' }
  }

  try {
    const roomService = new RoomServiceClient(LIVEKIT_WS_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)

    await roomService.removeParticipant(params.roomName, params.participantId)

    console.log('[livekit] Participant removed', params)

    return { success: true }
  } catch (error) {
    console.error('[livekit] Participant removal failed', { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Participant removal failed',
    }
  }
}

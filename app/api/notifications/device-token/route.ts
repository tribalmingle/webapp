import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'
import { getMongoDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/notifications/device-token
 * Register or update a user's device token for push notifications
 * 
 * Expected body:
 * {
 *   deviceToken: string      // OneSignal player ID or Expo push token
 *   platform: 'ios' | 'android'
 *   deviceId?: string        // Unique device identifier
 *   appVersion?: string      // App version (e.g., "1.0.0")
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = await verifyJWT(token)
    
    if (!payload?.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = new ObjectId(payload.userId)

    // Parse request body
    const body = await request.json()
    const { deviceToken, platform, deviceId, appVersion } = body

    // Validate required fields
    if (!deviceToken || typeof deviceToken !== 'string') {
      return NextResponse.json(
        { error: 'deviceToken is required and must be a string' },
        { status: 400 }
      )
    }

    if (!platform || !['ios', 'android'].includes(platform)) {
      return NextResponse.json(
        { error: 'platform must be either "ios" or "android"' },
        { status: 400 }
      )
    }

    const db = await getMongoDb()
    const devicesCollection = db.collection('device_tokens')

    // Check if device token already exists for this user
    const existingDevice = await devicesCollection.findOne({
      userId,
      deviceToken,
    })

    const now = new Date()

    if (existingDevice) {
      // Update existing device token
      await devicesCollection.updateOne(
        { _id: existingDevice._id },
        {
          $set: {
            platform,
            deviceId: deviceId || null,
            appVersion: appVersion || null,
            updatedAt: now,
            lastSeenAt: now,
          },
        }
      )

      return NextResponse.json({
        success: true,
        message: 'Device token updated successfully',
        deviceTokenId: existingDevice._id.toString(),
      })
    }

    // Create new device token record
    const result = await devicesCollection.insertOne({
      userId,
      deviceToken,
      platform,
      deviceId: deviceId || null,
      appVersion: appVersion || null,
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now,
      enabled: true, // Can be disabled if user opts out
    })

    return NextResponse.json({
      success: true,
      message: 'Device token registered successfully',
      deviceTokenId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error('Device token registration error:', error)
    return NextResponse.json(
      {
        error: 'Failed to register device token',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications/device-token
 * Remove a device token (e.g., on logout)
 * 
 * Expected body:
 * {
 *   deviceToken: string
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = await verifyJWT(token)
    
    if (!payload?.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = new ObjectId(payload.userId)

    // Parse request body
    const body = await request.json()
    const { deviceToken } = body

    if (!deviceToken) {
      return NextResponse.json(
        { error: 'deviceToken is required' },
        { status: 400 }
      )
    }

    const db = await getMongoDb()
    const devicesCollection = db.collection('device_tokens')

    // Delete device token for this user
    const result = await devicesCollection.deleteOne({
      userId,
      deviceToken,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Device token not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Device token removed successfully',
    })
  } catch (error) {
    console.error('Device token deletion error:', error)
    return NextResponse.json(
      {
        error: 'Failed to remove device token',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

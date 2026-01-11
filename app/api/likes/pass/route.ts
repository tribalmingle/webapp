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
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    const db = await getMongoDb()
    const passesCollection = db.collection('passes')

    // Check if already passed
    const existingPass = await passesCollection.findOne({
      userId: userPayload.email,
      passedUserId: userId
    })

    if (existingPass) {
      return NextResponse.json(
        { success: false, message: 'Already passed this user' },
        { status: 400 }
      )
    }

    // Create pass
    await passesCollection.insertOne({
      userId: userPayload.email,
      passedUserId: userId,
      createdAt: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'User passed successfully'
    })

  } catch (error: any) {
    console.error('[likes/pass] Error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

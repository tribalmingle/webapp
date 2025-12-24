import { NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import jwt from 'jsonwebtoken'

// GET - Get user's current guaranteed dating request status
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let userEmail: string
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
      userEmail = decoded.email
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const db = await getMongoDb()

    // Get active request
    const activeRequest = await db.collection('guaranteed_dating_requests').findOne({
      userEmail,
      status: { $in: ['pending', 'matched'] }
    })

    // Get request history
    const history = await db.collection('guaranteed_dating_requests')
      .find({ userEmail })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    return NextResponse.json({
      success: true,
      activeRequest,
      history,
      hasActiveRequest: !!activeRequest,
    })

  } catch (error) {
    console.error('Error fetching guaranteed dating status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch status' },
      { status: 500 }
    )
  }
}

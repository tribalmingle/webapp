import { NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import jwt from 'jsonwebtoken'

// GET - Get all guaranteed dating requests (admin only)
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

    // Check if user is admin
    const user = await db.collection('users').findOne({ email: userEmail })
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Get URL params for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const city = searchParams.get('city')
    const tribe = searchParams.get('tribe')

    // Build query
    const query: any = {}
    if (status) query.status = status
    if (city) query.userCity = city
    if (tribe) query.userTribe = tribe

    // Get all requests
    const requests = await db.collection('guaranteed_dating_requests')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    // Get statistics
    const stats = {
      total: await db.collection('guaranteed_dating_requests').countDocuments(),
      pending: await db.collection('guaranteed_dating_requests').countDocuments({ status: 'pending' }),
      matched: await db.collection('guaranteed_dating_requests').countDocuments({ status: 'matched' }),
      completed: await db.collection('guaranteed_dating_requests').countDocuments({ status: 'completed' }),
      expired: await db.collection('guaranteed_dating_requests').countDocuments({ status: 'expired' }),
      refundRequested: await db.collection('guaranteed_dating_requests').countDocuments({ status: 'refund_requested' }),
      refunded: await db.collection('guaranteed_dating_requests').countDocuments({ status: 'refunded' }),
    }

    return NextResponse.json({
      success: true,
      requests,
      stats,
    })

  } catch (error) {
    console.error('Error fetching guaranteed dating requests:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'

// POST - Match two users and set venue/date/time (admin only)
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let adminEmail: string
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
      adminEmail = decoded.email
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const db = await getMongoDb()

    // Check if user is admin
    const admin = await db.collection('users').findOne({ email: adminEmail })
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const {
      request1Id,
      request2Id,
      venue,
      venueAddress,
      dateTime, // ISO string
    } = body

    // Validation
    if (!request1Id || !request2Id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Both request IDs are required' 
      }, { status: 400 })
    }

    if (!venue || !venueAddress || !dateTime) {
      return NextResponse.json({ 
        success: false, 
        error: 'Venue, address, and date/time are required' 
      }, { status: 400 })
    }

    // Get both requests
    const [request1, request2] = await Promise.all([
      db.collection('guaranteed_dating_requests').findOne({ _id: new ObjectId(request1Id) }),
      db.collection('guaranteed_dating_requests').findOne({ _id: new ObjectId(request2Id) }),
    ])

    if (!request1 || !request2) {
      return NextResponse.json({ 
        success: false, 
        error: 'One or both requests not found' 
      }, { status: 404 })
    }

    // Validate both are pending
    if (request1.status !== 'pending' || request2.status !== 'pending') {
      return NextResponse.json({ 
        success: false, 
        error: 'Both requests must be in pending status' 
      }, { status: 400 })
    }

    // Validate same city
    if (request1.userCity !== request2.userCity) {
      return NextResponse.json({ 
        success: false, 
        error: 'Users must be in the same city' 
      }, { status: 400 })
    }

    // Validate same tribe
    if (request1.userTribe !== request2.userTribe) {
      return NextResponse.json({ 
        success: false, 
        error: 'Users must be from the same tribe' 
      }, { status: 400 })
    }

    // Validate opposite genders
    const gender1 = request1.userGender?.toLowerCase()
    const gender2 = request2.userGender?.toLowerCase()
    
    if (
      (gender1 === 'male' && gender2 !== 'female') ||
      (gender1 === 'female' && gender2 !== 'male')
    ) {
      return NextResponse.json({ 
        success: false, 
        error: 'Users must be of opposite genders' 
      }, { status: 400 })
    }

    const now = new Date()

    // Update both requests with match information
    await Promise.all([
      db.collection('guaranteed_dating_requests').updateOne(
        { _id: new ObjectId(request1Id) },
        {
          $set: {
            status: 'matched',
            matchedUserEmail: request2.userEmail,
            matchedUserName: request2.userName,
            venue,
            venueAddress,
            dateTime: new Date(dateTime),
            matchedAt: now,
            matchedByAdmin: adminEmail,
            updatedAt: now,
          }
        }
      ),
      db.collection('guaranteed_dating_requests').updateOne(
        { _id: new ObjectId(request2Id) },
        {
          $set: {
            status: 'matched',
            matchedUserEmail: request1.userEmail,
            matchedUserName: request1.userName,
            venue,
            venueAddress,
            dateTime: new Date(dateTime),
            matchedAt: now,
            matchedByAdmin: adminEmail,
            updatedAt: now,
          }
        }
      ),
    ])

    // TODO: Send email notifications to both users
    // This would integrate with your email service (SendGrid, Resend, etc.)

    return NextResponse.json({
      success: true,
      message: `Successfully matched ${request1.userName} and ${request2.userName}`,
      matchDetails: {
        user1: request1.userName,
        user2: request2.userName,
        venue,
        venueAddress,
        dateTime,
      }
    })

  } catch (error) {
    console.error('Error matching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to match users' },
      { status: 500 }
    )
  }
}

// PATCH - Update match details (venue, date, time)
export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let adminEmail: string
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
      adminEmail = decoded.email
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const db = await getMongoDb()

    // Check if user is admin
    const admin = await db.collection('users').findOne({ email: adminEmail })
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { requestId, venue, venueAddress, dateTime } = body

    if (!requestId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Request ID is required' 
      }, { status: 400 })
    }

    // Get the request
    const guaranteedRequest = await db.collection('guaranteed_dating_requests').findOne({
      _id: new ObjectId(requestId)
    })

    if (!guaranteedRequest) {
      return NextResponse.json({ 
        success: false, 
        error: 'Request not found' 
      }, { status: 404 })
    }

    if (guaranteedRequest.status !== 'matched') {
      return NextResponse.json({ 
        success: false, 
        error: 'Can only update matched requests' 
      }, { status: 400 })
    }

    // Build update object
    const update: any = { updatedAt: new Date() }
    if (venue) update.venue = venue
    if (venueAddress) update.venueAddress = venueAddress
    if (dateTime) update.dateTime = new Date(dateTime)

    // Update both requests (this one and the matched partner)
    await Promise.all([
      db.collection('guaranteed_dating_requests').updateOne(
        { _id: new ObjectId(requestId) },
        { $set: update }
      ),
      db.collection('guaranteed_dating_requests').updateOne(
        { userEmail: guaranteedRequest.matchedUserEmail, matchedUserEmail: guaranteedRequest.userEmail },
        { $set: update }
      ),
    ])

    return NextResponse.json({
      success: true,
      message: 'Match details updated successfully',
    })

  } catch (error) {
    console.error('Error updating match details:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update match details' },
      { status: 500 }
    )
  }
}

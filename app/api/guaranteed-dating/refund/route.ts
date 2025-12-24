import { NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'

// POST - Request refund for guaranteed dating
export async function POST(request: Request) {
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

    const body = await request.json()
    const { requestId } = body

    if (!requestId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Request ID is required' 
      }, { status: 400 })
    }

    const db = await getMongoDb()

    // Get the request
    const guaranteedRequest = await db.collection('guaranteed_dating_requests').findOne({
      _id: new ObjectId(requestId),
      userEmail,
    })

    if (!guaranteedRequest) {
      return NextResponse.json({ 
        success: false, 
        error: 'Request not found' 
      }, { status: 404 })
    }

    // Check if already matched
    if (guaranteedRequest.status === 'matched') {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot request refund - you have been matched with a date' 
      }, { status: 400 })
    }

    // Check if already refunded
    if (guaranteedRequest.refundRequested) {
      return NextResponse.json({ 
        success: false, 
        error: 'Refund already requested' 
      }, { status: 400 })
    }

    // Check if expired
    const now = new Date()
    if (now < guaranteedRequest.expiryDate) {
      return NextResponse.json({ 
        success: false, 
        error: 'Can only request refund after 30 days have elapsed' 
      }, { status: 400 })
    }

    // Update request to mark refund requested
    await db.collection('guaranteed_dating_requests').updateOne(
      { _id: new ObjectId(requestId) },
      { 
        $set: { 
          refundRequested: true,
          refundRequestedAt: now,
          status: 'refund_requested',
          updatedAt: now,
        } 
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Refund requested successfully. You will receive your refund within 3-7 working days.',
    })

  } catch (error) {
    console.error('Error requesting refund:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to request refund' },
      { status: 500 }
    )
  }
}

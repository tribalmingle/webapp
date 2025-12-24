import { NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import jwt from 'jsonwebtoken'

// POST - Create a new guaranteed dating request
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
    const {
      loveLanguages, // Array of 1-2 love languages
      idealDateActivities, // Array of activities
      dealBreakers, // Array of deal breakers
      communicationStyle, // String
      conflictResolutionStyle, // String
      familyPlans, // String
      religiousPracticeLevel, // String (casual, moderate, devout)
      politicalViews, // String (optional)
      datingGoals, // String (casual, serious, marriage)
      idealFirstDate, // String description
      mustHaveQualities, // Array of strings
      additionalNotes, // String (optional)
      paymentIntentId, // From Stripe/payment processor
      paymentAmount, // Should be 50
    } = body

    // Validation
    if (!loveLanguages || loveLanguages.length < 1 || loveLanguages.length > 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'You must select 1 or 2 love languages' 
      }, { status: 400 })
    }

    if (!idealDateActivities || idealDateActivities.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please select at least one ideal date activity' 
      }, { status: 400 })
    }

    if (!datingGoals) {
      return NextResponse.json({ 
        success: false, 
        error: 'Please specify your dating goals' 
      }, { status: 400 })
    }

    if (paymentAmount !== 50) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment amount must be $50' 
      }, { status: 400 })
    }

    const db = await getMongoDb()

    // Check if user already has an active request
    const existingRequest = await db.collection('guaranteed_dating_requests').findOne({
      userEmail,
      status: { $in: ['pending', 'matched'] }
    })

    if (existingRequest) {
      return NextResponse.json({ 
        success: false, 
        error: 'You already have an active guaranteed dating request' 
      }, { status: 400 })
    }

    // Get user details
    const user = await db.collection('users').findOne({ email: userEmail })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Create request
    const now = new Date()
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

    const guaranteedDatingRequest = {
      userEmail,
      userName: user.name,
      userGender: user.gender,
      userAge: user.age,
      userCity: user.city,
      userCountry: user.country,
      userTribe: user.tribe,
      userProfilePhoto: user.profilePhotos?.[0] || user.profilePhoto,
      
      // Guaranteed dating specific preferences
      loveLanguages,
      idealDateActivities,
      dealBreakers: dealBreakers || [],
      communicationStyle,
      conflictResolutionStyle,
      familyPlans,
      religiousPracticeLevel,
      politicalViews: politicalViews || '',
      datingGoals,
      idealFirstDate,
      mustHaveQualities: mustHaveQualities || [],
      additionalNotes: additionalNotes || '',
      
      // Payment info
      paymentIntentId,
      paymentAmount,
      paymentDate: now,
      
      // Request status
      status: 'pending', // pending, matched, completed, expired, refunded
      requestDate: now,
      expiryDate,
      
      // Match details (filled by admin)
      matchedUserEmail: null,
      matchedUserName: null,
      venue: null,
      venueAddress: null,
      dateTime: null,
      matchedAt: null,
      matchedByAdmin: null,
      
      // Refund
      refundRequested: false,
      refundRequestedAt: null,
      refundProcessed: false,
      refundProcessedAt: null,
      
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection('guaranteed_dating_requests').insertOne(guaranteedDatingRequest)

    return NextResponse.json({
      success: true,
      message: 'Guaranteed dating request created successfully',
      requestId: result.insertedId,
      expiryDate,
    })

  } catch (error) {
    console.error('Error creating guaranteed dating request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create request' },
      { status: 500 }
    )
  }
}

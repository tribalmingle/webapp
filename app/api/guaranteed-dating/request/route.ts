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
      loveLanguages, // Array of 1-2 love languages (optional during free period)
      idealDateActivities, // Array of activities (optional)
      dealBreakers, // Array of deal breakers (optional)
      communicationStyle, // String (optional)
      conflictResolutionStyle, // String (optional)
      familyPlans, // String (optional)
      religiousPracticeLevel, // String (optional)
      politicalViews, // String (optional)
      datingGoals, // String (optional)
      idealFirstDate, // String description (optional)
      mustHaveQualities, // Array of strings (optional)
      additionalNotes, // String (optional)
      notes, // Simple notes field from mobile app
      preferences, // Simple preferences object from mobile app
      paymentIntentId, // From Stripe/payment processor (optional during free period)
      paymentAmount, // Should be 50 (optional during free period)
    } = body

    // During free launch period, we only require the user to be authenticated
    // All other fields are optional - we'll use their profile data for matching

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
    const expiryDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days from now (matching guarantee)

    const guaranteedDatingRequest = {
      userEmail,
      userName: user.name,
      userGender: user.gender,
      userAge: user.age,
      userCity: user.city,
      userCountry: user.country,
      userTribe: user.tribe,
      userProfilePhoto: user.profilePhotos?.[0] || user.profilePhoto,
      
      // Guaranteed dating specific preferences (all optional during free period)
      loveLanguages: loveLanguages || user.loveLanguages || [],
      idealDateActivities: idealDateActivities || [],
      dealBreakers: dealBreakers || [],
      communicationStyle: communicationStyle || '',
      conflictResolutionStyle: conflictResolutionStyle || '',
      familyPlans: familyPlans || '',
      religiousPracticeLevel: religiousPracticeLevel || '',
      politicalViews: politicalViews || '',
      datingGoals: datingGoals || user.relationshipGoals || 'serious',
      idealFirstDate: idealFirstDate || '',
      mustHaveQualities: mustHaveQualities || [],
      additionalNotes: additionalNotes || notes || '',
      simplePreferences: preferences || {},
      
      // Payment info (optional during free launch period)
      paymentIntentId: paymentIntentId || null,
      paymentAmount: paymentAmount || 0, // Free during launch
      paymentDate: paymentIntentId ? now : null,
      isFreeRequest: !paymentIntentId, // Flag for free launch requests
      
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

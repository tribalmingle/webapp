import { NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'

// GET - Discover users (exclude current user and blocked users)
export async function GET(request: Request) {
  try {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token') || request.headers.get('authorization')?.replace('Bearer ', '')
  const search = searchParams.get('search') || ''
  const maritalStatus = searchParams.get('maritalStatus') || ''
  const minAgeParam = searchParams.get('minAge') || ''
  const maxAgeParam = searchParams.get('maxAge') || ''
  const country = searchParams.get('country') || ''
  const city = searchParams.get('city') || ''
  const tribe = searchParams.get('tribe') || ''
  const religion = searchParams.get('religion') || ''
  const education = searchParams.get('education') || ''
  const workType = searchParams.get('workType') || ''
    
    let currentUserEmail = null
    let currentUserId = null
    
    // Try to decode token to get current user
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
        currentUserEmail = decoded.email
      } catch (error) {
        console.log('Invalid token, proceeding without user filter')
      }
    }
    
    const db = await getMongoDb()
    
    // Get current user's ID and blocked users list
    let blockedUserIds: string[] = []
    let usersWhoBlockedMe: string[] = []
    
    if (currentUserEmail) {
      const currentUser = await db.collection('users').findOne({ email: currentUserEmail })
      if (currentUser) {
        currentUserId = currentUser._id.toString()
        
        // Get users I blocked
        const myBlocks = await db
          .collection('blocks')
          .find({ blockerEmail: currentUserEmail })
          .toArray()
        
        blockedUserIds = myBlocks.map(block => block.blockedEmail)
        
        // Get users who blocked me
        const blockedByOthers = await db
          .collection('blocks')
          .find({ blockedEmail: currentUserEmail })
          .toArray()
        
        usersWhoBlockedMe = blockedByOthers.map(block => block.blockerEmail)
      }
    }
    
    // Build query to exclude current user, blocked users, and users who blocked me
  const query: any = {}
    
    // Exclude current user by email
    const excludedEmails = [currentUserEmail, ...blockedUserIds, ...usersWhoBlockedMe].filter(Boolean)
    
    if (excludedEmails.length > 0) {
      query.email = { $nin: excludedEmails }
    }

    // Gender-based visibility: men see women, women see men (straight platform only)
    if (currentUserEmail) {
      const currentUser = await db.collection('users').findOne({ email: currentUserEmail })
      if (currentUser?.gender) {
        const userGender = currentUser.gender.toLowerCase()
        // Males only see Females, Females only see Males
        if (userGender === 'male') {
          query.gender = 'Female'
        } else if (userGender === 'female') {
          query.gender = 'Male'
        }
      }
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { tribe: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } }
      ]
    }

    // Filter by marital status when provided
    if (maritalStatus) {
      query.maritalStatus = maritalStatus
    }

    // Age range filtering - expects an "age" number field on user
    const ageFilter: any = {}
    const minAge = minAgeParam ? parseInt(minAgeParam, 10) : undefined
    const maxAge = maxAgeParam ? parseInt(maxAgeParam, 10) : undefined
    if (!Number.isNaN(minAge as number) && minAge !== undefined) {
      ageFilter.$gte = minAge
    }
    if (!Number.isNaN(maxAge as number) && maxAge !== undefined) {
      ageFilter.$lte = maxAge
    }
    if (Object.keys(ageFilter).length > 0) {
      query.age = ageFilter
    }

    // Simple field filters
    if (country) {
      query.country = country
    }
    if (city) {
      query.city = city
    }
    if (tribe) {
      query.tribe = tribe
    }
    if (religion) {
      query.religion = religion
    }
    if (education) {
      query.education = education
    }
    if (workType) {
      query.workType = workType
    }

    // Tribe + location based ordering
    let sortStage: any = {}
    if (currentUserEmail) {
      const currentUser = await db.collection('users').findOne({ email: currentUserEmail })
      if (currentUser) {
        const currentTribe = currentUser.tribe || null
        const currentCity = currentUser.city || null
        const currentCountry = currentUser.country || null

        sortStage = {
          scoreSameTribeSameCity: {
            $cond: [
              {
                $and: [
                  currentTribe ? { $eq: ['$tribe', currentTribe] } : false,
                  currentCity ? { $eq: ['$city', currentCity] } : false
                ]
              },
              0,
              2
            ]
          },
          scoreSameTribeSameCountry: {
            $cond: [
              {
                $and: [
                  currentTribe ? { $eq: ['$tribe', currentTribe] } : false,
                  currentCountry ? { $eq: ['$country', currentCountry] } : false
                ]
              },
              1,
              2
            ]
          }
        }
      }
    }

    let users

    if (Object.keys(sortStage).length > 0) {
      users = await db
        .collection('users')
        .aggregate([
          { $match: query },
          {
            $addFields: sortStage
          },
          {
            $sort: {
              scoreSameTribeSameCity: 1,
              scoreSameTribeSameCountry: 1
            }
          },
          {
            $addFields: {
              profilePhoto: {
                $cond: {
                  if: { $gt: [{ $size: { $ifNull: ['$profilePhotos', []] } }, 0] },
                  then: { $arrayElemAt: ['$profilePhotos', 0] },
                  else: { $ifNull: ['$profilePhoto', ''] }
                }
              }
            }
          },
          {
            $project: {
              password: 0,
              token: 0,
              scoreSameTribeSameCity: 0,
              scoreSameTribeSameCountry: 0
            }
          },
          { $limit: 50 }
        ])
        .toArray()
    } else {
      users = await db
        .collection('users')
        .aggregate([
          { $match: query },
          {
            $addFields: {
              profilePhoto: {
                $cond: {
                  if: { $gt: [{ $size: { $ifNull: ['$profilePhotos', []] } }, 0] },
                  then: { $arrayElemAt: ['$profilePhotos', 0] },
                  else: { $ifNull: ['$profilePhoto', ''] }
                }
              }
            }
          },
          {
            $project: {
              password: 0,
              token: 0
            }
          },
          { $limit: 50 }
        ])
        .toArray()
    }
    
    return NextResponse.json({
      success: true,
      count: users.length,
      users,
    })
  } catch (error) {
    console.error('Error fetching discover users:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { getCurrentUser } from '@/lib/auth'
import { computeMatchScore } from '@/lib/matching/match-score'

// GET - Discover users (exclude current user and blocked users)
export async function GET(request: Request) {
  try {
  const { searchParams } = new URL(request.url)
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
    
    const authUser = await getCurrentUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const currentUserEmail: string | null = authUser.email || null
    const currentUserId: string | null = authUser.userId || null
    
    const db = await getMongoDb()
    
    // Get current user's ID and blocked users list
    let blockedUserIds: string[] = []
    let usersWhoBlockedMe: string[] = []
    
    if (currentUserId || currentUserEmail) {
      const currentUserQuery: any = {}
      if (currentUserId && ObjectId.isValid(currentUserId)) {
        currentUserQuery._id = new ObjectId(currentUserId)
      } else if (currentUserEmail) {
        currentUserQuery.email = currentUserEmail
      }

      currentUser = await db.collection('users').findOne(currentUserQuery)
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

    if (currentUserId && ObjectId.isValid(currentUserId)) {
      query._id = { $ne: new ObjectId(currentUserId) }
    }

    // Gender-based visibility: men see women only, women see men only. Exclude other genders.
    if (currentUser?.gender) {
      const userGender = String(currentUser.gender).toLowerCase()
      if (userGender === 'male') {
        query.gender = { $regex: new RegExp('^female$', 'i') }
      } else if (userGender === 'female') {
        query.gender = { $regex: new RegExp('^male$', 'i') }
      } else {
        query.gender = { $regex: new RegExp('^(male|female)$', 'i') }
      }
    } else {
      query.gender = { $regex: new RegExp('^(male|female)$', 'i') }
    }
    
    // Add search functionality - keep gender filter applied by combining with $and
    if (search) {
      const searchOr = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { tribe: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } }
      ]
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }]
        delete query.$or
      } else {
        query.$or = searchOr
      }
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

    const users = await db
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
        { $limit: 120 }
      ])
      .toArray()

    const scoredUsers = users
      .map((user: any) => {
        const match = computeMatchScore(currentUser, user)
        return {
          ...user,
          matchPercent: match.matchPercent,
          compatibility: match.matchPercent,
          matchReasons: match.reasons,
          matchBreakdown: match.breakdown,
          _priorityScore: match.priority,
        }
      })
      .sort((a: any, b: any) => {
        if (a._priorityScore !== b._priorityScore) {
          return a._priorityScore - b._priorityScore
        }
        if (b.matchPercent !== a.matchPercent) {
          return b.matchPercent - a.matchPercent
        }
        const aUpdated = new Date(a.updatedAt || 0).getTime()
        const bUpdated = new Date(b.updatedAt || 0).getTime()
        return bUpdated - aUpdated
      })
      .slice(0, 50)
      .map(({ _priorityScore, ...user }) => user)
    
    return NextResponse.json({
      success: true,
      count: scoredUsers.length,
      users: scoredUsers,
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

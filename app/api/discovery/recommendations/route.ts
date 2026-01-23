import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import { computeMatchScore } from '@/lib/matching/match-score';
import { computeProfileCompletion } from '@/lib/matching/profile-completion';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await connectDB();
    const usersCollection = db.collection('users');

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build filter based on user preferences
    const filter: any = {
      _id: { $ne: currentUser._id },
      registrationComplete: true,
    };

    // Apply strict gender visibility: men see women only, women see men only. Exclude other genders.
    if (currentUser.gender) {
      const userGender = String(currentUser.gender).toLowerCase();
      if (userGender === 'male') {
        filter.gender = { $regex: new RegExp('^female$', 'i') };
      } else if (userGender === 'female') {
        filter.gender = { $regex: new RegExp('^male$', 'i') };
      } else {
        filter.gender = { $regex: new RegExp('^(male|female)$', 'i') };
      }
    } else {
      filter.gender = { $regex: new RegExp('^(male|female)$', 'i') };
    }

    // Apply age filter if user has preferences (safely typed)
    const preferences = currentUser.preferences as any;
    if (preferences?.minAge || preferences?.maxAge) {
      filter.age = {};
      if (preferences.minAge) {
        filter.age.$gte = preferences.minAge;
      }
      if (preferences.maxAge) {
        filter.age.$lte = preferences.maxAge;
      }
    }

    // Apply location filter if user has preferences
    if (preferences?.country) {
      filter.country = preferences.country;
    }

    // Get total count for pagination
    const total = await usersCollection.countDocuments(filter);

    // Fetch recommendations (over-fetch for smarter sorting)
    const fetchLimit = Math.min(Math.max(limit * 4, 50), 200);
    const recommendations = await usersCollection
      .find(filter)
      .limit(fetchLimit)
      .toArray();

    const scored = recommendations
      .map((user: any) => {
        const completion = computeProfileCompletion(user);
        const match = computeMatchScore(currentUser, user);
        return {
          ...user,
          profileCompletion: completion.percent,
          matchPercent: match.matchPercent,
          compatibility: match.matchPercent,
          matchReasons: match.reasons,
          matchBreakdown: match.breakdown,
          _priorityScore: match.priority,
        };
      })
      .filter((user: any) => (user.profileCompletion ?? 0) >= 60)
      .sort((a: any, b: any) => {
        if (a._priorityScore !== b._priorityScore) {
          return a._priorityScore - b._priorityScore;
        }
        if (b.matchPercent !== a.matchPercent) {
          return b.matchPercent - a.matchPercent;
        }
        const aUpdated = new Date(a.updatedAt || 0).getTime();
        const bUpdated = new Date(b.updatedAt || 0).getTime();
        return bUpdated - aUpdated;
      });

    const paged = scored.slice(skip, skip + limit);

    // Map to recommendation format
    const results = paged.map((user: any) => ({
      id: user._id.toString(),
      email: user.email,
      name: user.name || 'User',
      age: user.age,
      tribe: user.tribe,
      city: user.city,
      country: user.country,
      heritage: user.heritage,
      countryOfOrigin: user.countryOfOrigin,
      cityOfOrigin: user.cityOfOrigin,
      religion: user.religion || user.faith,
      lookingFor: user.lookingFor,
      relationshipGoals: user.relationshipGoals || (user.lookingFor ? [user.lookingFor] : []),
      bio: user.bio,
      interests: user.interests || [],
      loveLanguage: user.loveLanguage,
      verified: user.verified || false,
      photos: user.profilePhotos || (user.profilePhoto ? [user.profilePhoto] : []),
      matchPercent: user.matchPercent,
      compatibility: user.compatibility,
      matchReasons: user.matchReasons || [],
      matchBreakdown: user.matchBreakdown || [],
    }));

    return NextResponse.json({
      success: true,
      results,
      hasMore: skip + limit < total,
      page,
      total,
    });
  } catch (error: any) {
    console.error('Discovery recommendations error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
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

    // Apply user gender preference filter
    if (currentUser.gender) {
      // If user is male, show females; if female, show males
      const preferredGender = currentUser.gender === 'male' ? 'female' : 'male';
      filter.gender = preferredGender;
    }

    // Apply age filter if user has preferences
    if (currentUser.preferences?.minAge || currentUser.preferences?.maxAge) {
      filter.age = {};
      if (currentUser.preferences.minAge) {
        filter.age.$gte = currentUser.preferences.minAge;
      }
      if (currentUser.preferences.maxAge) {
        filter.age.$lte = currentUser.preferences.maxAge;
      }
    }

    // Apply location filter if user has preferences
    if (currentUser.preferences?.country) {
      filter.country = currentUser.preferences.country;
    }

    // Get total count for pagination
    const total = await usersCollection.countDocuments(filter);

    // Fetch recommendations
    const recommendations = await usersCollection
      .find(filter)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Map to recommendation format
    const results = recommendations.map((user: any) => ({
      id: user._id.toString(),
      email: user.email,
      name: user.name || 'User',
      age: user.age,
      tribe: user.tribe,
      city: user.city,
      country: user.country,
      bio: user.bio,
      interests: user.interests || [],
      verified: user.verified || false,
      photos: user.profilePhotos || (user.profilePhoto ? [user.profilePhoto] : []),
      matchPercent: Math.floor(Math.random() * 20) + 80, // Mock compatibility score
      compatibility: Math.floor(Math.random() * 20) + 80,
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

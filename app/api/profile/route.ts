import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  try {
    console.log('[profile] Fetching current user...');
    const currentUser = await getCurrentUser();
    console.log('[profile] Current user:', currentUser ? 'found' : 'null');
    
    if (!currentUser) {
      console.error('[profile] No current user - returning 401');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await connectDB();
    const usersCollection = db.collection('users');

    // Get user profile
    const user = await usersCollection.findOne({ _id: currentUser._id });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        username: user.username,
        age: user.age,
        gender: user.gender,
        tribe: user.tribe,
        bio: user.bio,
        interests: user.interests || [],
        location: user.location,
        city: user.city,
        country: user.country,
        maritalStatus: user.maritalStatus,
        profilePhoto: user.profilePhoto,
        selfiePhoto: user.selfiePhoto,
        profilePhotos: user.profilePhotos || [],
        verified: user.verified || false,
        registrationComplete: user.registrationComplete || false,
        registrationStep: user.registrationStep || 0,
        subscriptionPlan: user.subscriptionPlan || 'free',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

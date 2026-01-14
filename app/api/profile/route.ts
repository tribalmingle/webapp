import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    console.log('[profile] Fetching current user...');
    const currentUser = await getCurrentUser(req);
    console.log('[profile] Current user:', currentUser ? 'found' : 'null');
    
    if (!currentUser) {
      console.error('[profile] No current user - returning 401');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[profile] Connecting to DB...');
    const db = await connectDB();
    console.log('[profile] DB connected');
    const usersCollection = db.collection('users');

    // Get user profile using userId from JWT
    console.log('[profile] Querying user with ID:', currentUser.userId);
    const user = await usersCollection.findOne({ _id: new ObjectId(currentUser.userId) });
    console.log('[profile] User found:', !!user);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Return simplified response
    return NextResponse.json({
      success: true,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      gender: user.gender,
      _raw: user,
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { success: false, message: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

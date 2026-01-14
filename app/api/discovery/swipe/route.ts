import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { targetUserId, action } = body;

    if (!targetUserId || !action) {
      return NextResponse.json(
        { success: false, message: 'Missing targetUserId or action' },
        { status: 400 }
      );
    }

    if (!['like', 'pass', 'superlike'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Must be like, pass, or superlike' },
        { status: 400 }
      );
    }

    const db = await connectDB();
    const swipesCollection = db.collection('swipes');
    const matchesCollection = db.collection('matches');

    // Record the swipe
    await swipesCollection.insertOne({
      userId: currentUser._id,
      targetUserId: new ObjectId(targetUserId),
      action,
      createdAt: new Date(),
    });

    let matched = false;
    let matchId = null;

    // Check if this is a like/superlike and if there's a mutual match
    if (action === 'like' || action === 'superlike') {
      const reciprocalSwipe = await swipesCollection.findOne({
        userId: new ObjectId(targetUserId),
        targetUserId: currentUser._id,
        action: { $in: ['like', 'superlike'] },
      });

      if (reciprocalSwipe) {
        // Create a match!
        const match = await matchesCollection.insertOne({
          user1: currentUser._id,
          user2: new ObjectId(targetUserId),
          matched: true,
          matchedAt: new Date(),
          createdAt: new Date(),
        });

        matched = true;
        matchId = match.insertedId.toString();
      }
    }

    return NextResponse.json({
      success: true,
      matched,
      matchId,
      action,
    });
  } catch (error: any) {
    console.error('Swipe error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process swipe' },
      { status: 500 }
    );
  }
}

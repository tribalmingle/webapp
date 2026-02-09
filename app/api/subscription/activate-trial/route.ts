import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const userPayload = await getCurrentUser();
    
    if (!userPayload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getMongoDb();
    const usersCollection = db.collection('users');

    // Check if user already has an active trial
    const existingUser = await usersCollection.findOne({ email: userPayload.email });
    
    if (existingUser?.freeTrialActivatedAt) {
      const trialEnd = new Date(existingUser.freeTrialActivatedAt);
      trialEnd.setMonth(trialEnd.getMonth() + 3);
      
      if (trialEnd > new Date()) {
        return NextResponse.json({
          success: true,
          message: 'Trial already active',
          trialActivatedAt: existingUser.freeTrialActivatedAt,
          trialExpiresAt: trialEnd.toISOString(),
        });
      }
    }

    // Calculate trial expiration (3 months from now)
    const now = new Date();
    const trialExpiresAt = new Date(now);
    trialExpiresAt.setMonth(trialExpiresAt.getMonth() + 3);

    const result = await usersCollection.updateOne(
      { email: userPayload.email },
      { 
        $set: { 
          subscriptionPlan: 'trial',
          freeTrialActivatedAt: now.toISOString(),
          freeTrialExpiresAt: trialExpiresAt.toISOString(),
          updatedAt: now,
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '3-month free trial activated!',
      trialActivatedAt: now.toISOString(),
      trialExpiresAt: trialExpiresAt.toISOString(),
    });

  } catch (error) {
    console.error('Error activating trial:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userPayload = await getCurrentUser();
    
    if (!userPayload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getMongoDb();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: userPayload.email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const hasActiveTrial = user.freeTrialActivatedAt && 
      new Date(user.freeTrialExpiresAt) > new Date();

    return NextResponse.json({
      success: true,
      subscriptionPlan: user.subscriptionPlan || 'free',
      hasActiveTrial,
      trialActivatedAt: user.freeTrialActivatedAt || null,
      trialExpiresAt: user.freeTrialExpiresAt || null,
    });

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

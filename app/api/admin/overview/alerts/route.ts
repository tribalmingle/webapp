import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
  module: string;
}

export async function GET() {
  try {
    // Mock alerts - in production, this would fetch from monitoring system
    const alerts: Alert[] = [
      {
        id: '1',
        type: 'warning',
        message: 'Photo verification queue depth above threshold (125 pending)',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        module: 'trust-desk'
      },
      {
        id: '2',
        type: 'info',
        message: 'New experiment "subscription-trial-7d" started with 1895 users',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        module: 'growth-lab'
      },
      {
        id: '3',
        type: 'warning',
        message: 'Support ticket SLA breach rate at 8% (target <5%)',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        module: 'support'
      }
    ];

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

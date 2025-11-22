/**
 * Link Analytics API
 * GET /api/links/[code]/analytics - Get analytics for a specific link
 */

import { NextRequest, NextResponse } from 'next/server';
import { DeepLinkingService } from '@/lib/services/deep-linking-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    const analytics = await DeepLinkingService.getLinkAnalytics(code);

    if (!analytics) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error('Error fetching link analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

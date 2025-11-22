/**
 * Short Link Redirect Route
 * GET /l/[code] - Redirects to target URL and tracks click
 */

import { NextRequest, NextResponse } from 'next/server';
import { DeepLinkingService } from '@/lib/services/deep-linking-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    // Get short link
    const link = await DeepLinkingService.getShortLink(code);

    if (!link) {
      return NextResponse.json(
        { error: 'Link not found or expired' },
        { status: 404 }
      );
    }

    // Track the click
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;
    const referer = request.headers.get('referer') || undefined;

    await DeepLinkingService.trackClick({
      linkCode: code,
      ipAddress,
      userAgent,
      referer,
    });

    // Redirect to target URL
    return NextResponse.redirect(link.targetUrl, { status: 302 });
  } catch (error) {
    console.error('Error in short link redirect:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Short Links API
 * POST /api/links - Create a new short link
 * GET /api/links/[code]/analytics - Get link analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { DeepLinkingService } from '@/lib/services/deep-linking-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetUrl, metadata, expiresInDays } = body;

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'targetUrl is required' },
        { status: 400 }
      );
    }

    // TODO: Get userId from auth session
    const createdBy = undefined; // await getSessionUserId(request);

    const shortLink = await DeepLinkingService.createShortLink({
      targetUrl,
      createdBy,
      metadata,
      expiresInDays,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shortUrl = `${baseUrl}/l/${shortLink.code}`;

    return NextResponse.json({
      success: true,
      link: {
        ...shortLink,
        shortUrl,
      },
    });
  } catch (error) {
    console.error('Error creating short link:', error);
    return NextResponse.json(
      { error: 'Failed to create short link' },
      { status: 500 }
    );
  }
}

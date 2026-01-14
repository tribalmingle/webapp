import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    // Try getting auth from Request object
    const authFromRequest = req.headers.get('authorization') || req.headers.get('Authorization');
    
    // Also try from headers()
    const headerStore = await headers();
    const authFromHeaders = headerStore.get('authorization') || headerStore.get('Authorization');
    
    return NextResponse.json({
      success: true,
      authFromRequest: authFromRequest ? `${authFromRequest.substring(0, 20)}...` : null,
      authFromHeaders: authFromHeaders ? `${authFromHeaders.substring(0, 20)}...` : null,
      jwtSecretSet: !!process.env.JWT_SECRET,
      jwtSecretPreview: process.env.JWT_SECRET ? `${process.env.JWT_SECRET.substring(0, 10)}...` : null,
      mongodbSet: !!process.env.MONGODB_URI,
      allHeaders: Object.fromEntries(headerStore.entries()),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}

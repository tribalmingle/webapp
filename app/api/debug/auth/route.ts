import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const headerStore = await headers();
    const authHeader = headerStore.get('authorization') || headerStore.get('Authorization');
    
    return NextResponse.json({
      success: true,
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader ? `${authHeader.substring(0, 20)}...` : null,
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

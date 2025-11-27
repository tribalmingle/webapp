import { NextResponse } from 'next/server';
import { SupportService } from '@/lib/services/support-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as any;
    
    const responses = await SupportService.getCannedResponses(category);
    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Error fetching canned responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch canned responses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await SupportService.createCannedResponse(body);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating canned response:', error);
    return NextResponse.json(
      { error: 'Failed to create canned response' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { SupportService } from '@/lib/services/support-service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const message = await SupportService.addMessage({
      ticketId: params.id,
      ...body
    });
    return NextResponse.json(message);
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
}

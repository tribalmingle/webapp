import { NextResponse } from 'next/server';
import { SupportService } from '@/lib/services/support-service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const ticket = await SupportService.assignTicket(
      params.id,
      body.agentId,
      body.agentName
    );
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error assigning ticket:', error);
    return NextResponse.json(
      { error: 'Failed to assign ticket' },
      { status: 500 }
    );
  }
}

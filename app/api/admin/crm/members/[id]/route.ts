import { NextResponse } from 'next/server';
import { CRMService } from '@/lib/services/crm-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await CRMService.getMemberProfile(params.id);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching member profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member profile' },
      { status: 500 }
    );
  }
}

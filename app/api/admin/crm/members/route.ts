import { NextResponse } from 'next/server';
import { CRMService } from '@/lib/services/crm-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || undefined;
    const plan = searchParams.get('plan') || undefined;
    const tribe = searchParams.get('tribe') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const result = await CRMService.searchMembers(
      { query, plan, tribe },
      page,
      limit
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching members:', error);
    return NextResponse.json(
      { error: 'Failed to search members' },
      { status: 500 }
    );
  }
}

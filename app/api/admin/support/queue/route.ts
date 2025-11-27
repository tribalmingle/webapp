import { NextResponse } from 'next/server';
import { SupportService } from '@/lib/services/support-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const priority = searchParams.get('priority') as any;
    const category = searchParams.get('category') as any;
    const assignedTo = searchParams.get('assignedTo') || undefined;
    const breachedOnly = searchParams.get('breachedOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const result = await SupportService.getQueue(
      { status, priority, category, assignedTo, breachedOnly },
      page,
      limit
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching support queue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support queue' },
      { status: 500 }
    );
  }
}

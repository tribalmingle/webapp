import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db/mongodb';
import { COLLECTIONS } from '@/lib/db/collections';

export const dynamic = 'force-dynamic';

interface MetricTrend {
  date: string;
  value: number;
}

interface OverviewMetrics {
  dau: number;
  mau: number;
  activeConversations: number;
  matchesToday: number;
  revenueToday: number;
  trends: {
    dau: MetricTrend[];
    conversations: MetricTrend[];
    matches: MetricTrend[];
    revenue: MetricTrend[];
  };
}

export async function GET() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // DAU: Active users in last 24 hours
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const dau = await usersCollection.countDocuments({
      lastSeenAt: { $gte: today }
    });

    // MAU: Active users in last 30 days
    const mau = await usersCollection.countDocuments({
      lastSeenAt: { $gte: thirtyDaysAgo }
    });

    // Active conversations: threads with messages in last 24h
    const threadsCollection = await getCollection(COLLECTIONS.CHAT_THREADS);
    const activeConversations = await threadsCollection.countDocuments({
      lastMessageAt: { $gte: today }
    });

    // Matches today
    const matchesCollection = await getCollection('matches');
    const matchesToday = await matchesCollection.countDocuments({
      createdAt: { $gte: today }
    });

    // Revenue today
    const paymentsCollection = await getCollection('payments');
    const revenueResult = await paymentsCollection.aggregate([
      { $match: { createdAt: { $gte: today }, status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();
    const revenueToday = revenueResult[0]?.total || 0;

    // 7-day trends
    const dauTrend: MetricTrend[] = [];
    const conversationsTrend: MetricTrend[] = [];
    const matchesTrend: MetricTrend[] = [];
    const revenueTrend: MetricTrend[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const dateStr = date.toISOString().split('T')[0];

      // DAU for this day
      const dayDau = await usersCollection.countDocuments({
        lastSeenAt: { $gte: date, $lt: nextDate }
      });
      dauTrend.push({ date: dateStr, value: dayDau });

      // Active conversations for this day
      const dayConversations = await threadsCollection.countDocuments({
        lastMessageAt: { $gte: date, $lt: nextDate }
      });
      conversationsTrend.push({ date: dateStr, value: dayConversations });

      // Matches for this day
      const dayMatches = await matchesCollection.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });
      matchesTrend.push({ date: dateStr, value: dayMatches });

      // Revenue for this day
      const dayRevenueResult = await paymentsCollection.aggregate([
        { $match: { createdAt: { $gte: date, $lt: nextDate }, status: 'succeeded' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).toArray();
      const dayRevenue = dayRevenueResult[0]?.total || 0;
      revenueTrend.push({ date: dateStr, value: dayRevenue });
    }

    const metrics: OverviewMetrics = {
      dau,
      mau,
      activeConversations,
      matchesToday,
      revenueToday: revenueToday / 100, // Convert cents to dollars
      trends: {
        dau: dauTrend,
        conversations: conversationsTrend,
        matches: matchesTrend,
        revenue: revenueTrend.map(t => ({ ...t, value: t.value / 100 }))
      }
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching overview metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

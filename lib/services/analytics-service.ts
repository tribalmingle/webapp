/**
 * Analytics Tracking Service
 * Custom Segment replacement for event tracking and user journey analytics
 */

import { getCollection } from '../db/mongodb';
import { COLLECTIONS, AnalyticsEvent, UserSession } from '../db/collections';
import { v4 as uuidv4 } from 'uuid';
import { withSpan } from '../observability/tracing';

export class AnalyticsService {
  /**
   * Track an event
   */
  static async track(params: {
    eventType: string;
    userId?: string;
    sessionId?: string;
    properties?: Record<string, any>;
    context?: AnalyticsEvent['context'];
  }): Promise<AnalyticsEvent> {
    const event: AnalyticsEvent = {
      eventType: params.eventType,
      userId: params.userId,
      sessionId: params.sessionId,
      timestamp: new Date(),
      properties: params.properties,
      context: params.context,
    };

    const collection = await getCollection<AnalyticsEvent>(COLLECTIONS.ANALYTICS_EVENTS);
    const result = await collection.insertOne(event);
    event._id = result.insertedId.toString();

    // Update session if provided
    if (params.sessionId) {
      await this.updateSession(params.sessionId, event._id!);
    }

    return event;
  }

  /**
   * Start a new session
   */
  static async startSession(params: {
    userId?: string;
    entryPage?: string;
    deviceInfo?: UserSession['deviceInfo'];
  }): Promise<string> {
    const sessionId = uuidv4();
    const now = new Date();

    const session: UserSession = {
      sessionId,
      userId: params.userId,
      startTime: now,
      lastActivityAt: now,
      events: [],
      entryPage: params.entryPage,
      deviceInfo: params.deviceInfo,
    };

    const collection = await getCollection<UserSession>(COLLECTIONS.USER_SESSIONS);
    await collection.insertOne(session);

    return sessionId;
  }

  /**
   * Update session with new event
   */
  static async updateSession(sessionId: string, eventId: string): Promise<void> {
    const collection = await getCollection<UserSession>(COLLECTIONS.USER_SESSIONS);
    await collection.updateOne(
      { sessionId },
      { 
        $set: { lastActivityAt: new Date() },
        $push: { events: eventId }
      }
    );
  }

  /**
   * End a session
   */
  static async endSession(sessionId: string, exitPage?: string): Promise<void> {
    const collection = await getCollection<UserSession>(COLLECTIONS.USER_SESSIONS);
    const session = await collection.findOne({ sessionId });

    if (session) {
      const duration = new Date().getTime() - session.startTime.getTime();
      await collection.updateOne(
        { sessionId },
        { 
          $set: { 
            endTime: new Date(),
            duration,
            exitPage 
          }
        }
      );
    }
  }

  /**
   * Get events for a user
   */
  static async getUserEvents(userId: string, limit = 100) {
    const collection = await getCollection<AnalyticsEvent>(COLLECTIONS.ANALYTICS_EVENTS);
    return collection
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get user journey (session with events)
   */
  static async getUserJourney(sessionId: string) {
    const sessionsCollection = await getCollection<UserSession>(COLLECTIONS.USER_SESSIONS);
    const session = await sessionsCollection.findOne({ sessionId });

    if (!session) {
      return null;
    }

    const eventsCollection = await getCollection<AnalyticsEvent>(COLLECTIONS.ANALYTICS_EVENTS);
    const events = await eventsCollection
      .find({ sessionId })
      .sort({ timestamp: 1 })
      .toArray();

    return {
      session,
      events,
    };
  }

  /**
   * Get event counts by type (for dashboard)
   */
  static async getEventCounts(startDate: Date, endDate: Date) {
    return withSpan('analytics.getEventCounts', async () => {
      const collection = await getCollection<AnalyticsEvent>(COLLECTIONS.ANALYTICS_EVENTS);
      
      const pipeline = [
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ];

      return collection.aggregate(pipeline).toArray();
    }, { startDate: startDate.toISOString(), endDate: endDate.toISOString() })
  }

  /**
   * Get funnel conversion data
   */
  static async getFunnelData(steps: string[], startDate: Date, endDate: Date) {
    return withSpan('analytics.getFunnelData', async () => {
      const collection = await getCollection<AnalyticsEvent>(COLLECTIONS.ANALYTICS_EVENTS);

      const stepCounts = await Promise.all(
        steps.map(async (eventType, index) => {
          const count = await collection.countDocuments({
            eventType,
            timestamp: { $gte: startDate, $lte: endDate }
          });

          return {
            step: index + 1,
            name: eventType,
            count,
            dropoff: 0 // Will calculate below
          };
        })
      );

      // Calculate dropoff rates
      for (let i = 1; i < stepCounts.length; i++) {
        const prev = stepCounts[i - 1].count;
        const current = stepCounts[i].count;
        stepCounts[i].dropoff = prev > 0 ? ((prev - current) / prev) * 100 : 0;
      }

      return stepCounts;
    }, { stepsCount: steps.length, startDate: startDate.toISOString(), endDate: endDate.toISOString() })
  }

  /**
   * Get real-time event stream (for dashboard)
   */
  static async getRealtimeEvents(limit = 50) {
    return withSpan('analytics.getRealtimeEvents', async () => {
      const collection = await getCollection<AnalyticsEvent>(COLLECTIONS.ANALYTICS_EVENTS);
      return collection
        .find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    }, { limit })
  }

  /**
   * Get active users count
   */
  static async getActiveUsers(timeWindowMinutes = 5) {
    const collection = await getCollection<UserSession>(COLLECTIONS.USER_SESSIONS);
    const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    return collection.countDocuments({
      lastActivityAt: { $gte: since },
      userId: { $exists: true }
    });
  }

  /**
   * Phase 8: Query metrics with aggregation
   */
  static async queryMetrics(params: {
    eventType?: string
    userId?: string
    startDate: Date
    endDate: Date
    aggregation: 'count' | 'sum' | 'average' | 'unique'
    property?: string
    groupBy?: string
  }): Promise<any[]> {
    return withSpan('analytics.queryMetrics', async () => {
      const collection = await getCollection<AnalyticsEvent>(COLLECTIONS.ANALYTICS_EVENTS)
      
      const match: any = {
        timestamp: { $gte: params.startDate, $lte: params.endDate },
      }
      
      if (params.eventType) match.eventType = params.eventType
      if (params.userId) match.userId = params.userId
      
      const pipeline: any[] = [{ $match: match }]
      
      if (params.groupBy) {
        const groupId = params.groupBy === 'date' 
          ? { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          : `$properties.${params.groupBy}`
        
        const groupStage: any = { _id: groupId }
        
        switch (params.aggregation) {
          case 'count':
            groupStage.value = { $sum: 1 }
            break
          case 'sum':
            groupStage.value = { $sum: `$properties.${params.property}` }
            break
          case 'average':
            groupStage.value = { $avg: `$properties.${params.property}` }
            break
          case 'unique':
            groupStage.value = { $addToSet: `$properties.${params.property}` }
            break
        }
        
        pipeline.push({ $group: groupStage })
        
        if (params.aggregation === 'unique') {
          pipeline.push({ $project: { _id: 1, value: { $size: '$value' } } })
        }
      }
      
      pipeline.push({ $sort: { _id: 1 } })
      
      return await collection.aggregate(pipeline).toArray()
    })
  }

  /**
   * Phase 8: Analyze funnel conversion
   */
  static async analyzeFunnel(params: {
    steps: string[]
    startDate: Date
    endDate: Date
  }): Promise<Array<{ step: string; users: number; conversionRate: number }>> {
    return withSpan('analytics.analyzeFunnel', async () => {
      const collection = await getCollection<AnalyticsEvent>(COLLECTIONS.ANALYTICS_EVENTS)
      
      const results = []
      let previousUsers = 0
      
      for (let i = 0; i < params.steps.length; i++) {
        const step = params.steps[i]
        
        const users = await collection.distinct('userId', {
          eventType: step,
          timestamp: { $gte: params.startDate, $lte: params.endDate },
          userId: { $exists: true },
        })
        
        const userCount = users.length
        const conversionRate = i === 0 
          ? 100 
          : previousUsers > 0 
          ? (userCount / previousUsers) * 100 
          : 0
        
        results.push({
          step,
          users: userCount,
          conversionRate,
        })
        
        previousUsers = userCount
      }
      
      return results
    })
  }

  /**
   * Phase 8: Track cohort over time
   */
  static async trackCohort(params: {
    cohortStartDate: Date
    cohortEndDate: Date
    retentionPeriods: number[]
  }): Promise<any> {
    return withSpan('analytics.trackCohort', async () => {
      const collection = await getCollection<AnalyticsEvent>(COLLECTIONS.ANALYTICS_EVENTS)
      
      const cohortUsers = await collection.distinct('userId', {
        eventType: 'user.signup',
        timestamp: { $gte: params.cohortStartDate, $lte: params.cohortEndDate },
        userId: { $exists: true },
      })
      
      const retention: any = {
        cohortSize: cohortUsers.length,
        periods: [],
      }
      
      for (const days of params.retentionPeriods) {
        const periodStart = new Date(params.cohortEndDate)
        periodStart.setDate(periodStart.getDate() + days - 1)
        
        const periodEnd = new Date(periodStart)
        periodEnd.setDate(periodEnd.getDate() + 1)
        
        const activeUsers = await collection.distinct('userId', {
          userId: { $in: cohortUsers },
          timestamp: { $gte: periodStart, $lt: periodEnd },
        })
        
        retention.periods.push({
          days,
          activeUsers: activeUsers.length,
          retentionRate: cohortUsers.length > 0 
            ? (activeUsers.length / cohortUsers.length) * 100 
            : 0,
        })
      }
      
      return retention
    })
  }

  /**
   * Phase 8: Batch insert events (for ingestion pipeline)
   */
  static async batchInsert(events: Omit<AnalyticsEvent, '_id'>[]): Promise<void> {
    return withSpan('analytics.batchInsert', async () => {
      if (events.length === 0) return
      
      const collection = await getCollection<AnalyticsEvent>(COLLECTIONS.ANALYTICS_EVENTS)
      await collection.insertMany(events)
    })
  }
}

// --- Phase 7 Additions: Daily metric snapshots & lightweight realtime stats ---
// These augment the event/session analytics above for dashboard rollups.

export interface DailyMetricSnapshot {
  date: string; // YYYY-MM-DD
  activeUsers: number;
  giftsSent: number;
  coinSpent: number;
  newSubscriptions: number;
  referralSignups: number;
  createdAt: Date;
}

interface RealtimeStats {
  activeUsers: number;
  onlineNow: number;
  coinsSpentToday: number;
  giftsSentToday: number;
  subscriptionRenewalsToday: number;
}

// Minimal in-memory fallback if Mongo unavailable
const inMemorySnapshots: DailyMetricSnapshot[] = [];

export async function recordDailySnapshot(snapshot: Omit<DailyMetricSnapshot, 'createdAt'>) {
  const row: DailyMetricSnapshot = { ...snapshot, createdAt: new Date() };
  try {
    const collection = await getCollection<DailyMetricSnapshot>('daily_metrics');
    await collection.insertOne(row as any);
  } catch {
    inMemorySnapshots.push(row);
  }
  return row;
}

export async function listRecentSnapshots(limit = 30) {
  try {
    const collection = await getCollection<DailyMetricSnapshot>('daily_metrics');
    return collection.find().sort({ date: -1 }).limit(limit).toArray();
  } catch {
    return inMemorySnapshots.slice(-limit).reverse();
  }
}

export async function getRealtimeStats(): Promise<RealtimeStats> {
  // Placeholder counts; replace with Redis/event counter aggregation later
  const activeUsers = await AnalyticsService.getActiveUsers(10).catch(() => 0);
  return {
    activeUsers,
    onlineNow: Math.max(1, Math.round(activeUsers * 0.25)),
    coinsSpentToday: 560, // TODO: derive from wallet debits for today
    giftsSentToday: 18, // TODO: count gift_sends today
    subscriptionRenewalsToday: 3, // TODO: count subscription renewal events today
  };
}

/**
 * Get referral funnel analytics
 * Phase 7: Referral conversion tracking
 */
export async function getReferralFunnelData(): Promise<Array<{ step: string; count: number; conversionRate: number }>> {
  try {
    const collection = await getCollection<any>('referral_events');
    
    // Aggregate event counts by type
    const pipeline = [
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ];
    
    const results = await collection.aggregate(pipeline).toArray();
    
    const countByType: Record<string, number> = {};
    results.forEach((r: any) => {
      countByType[r._id] = r.count;
    });
    
    const clicks = countByType['clicked'] || 0;
    const signups = countByType['signed_up'] || 0;
    const verified = countByType['verified'] || 0;
    const rewards = countByType['reward_credited'] || 0;
    
    // Calculate conversion rates relative to clicks
    const steps = [
      { step: 'Clicks', count: clicks, conversionRate: 100 },
      { step: 'Sign-ups', count: signups, conversionRate: clicks > 0 ? (signups / clicks) * 100 : 0 },
      { step: 'Verified', count: verified, conversionRate: clicks > 0 ? (verified / clicks) * 100 : 0 },
      { step: 'Rewards Credited', count: rewards, conversionRate: clicks > 0 ? (rewards / clicks) * 100 : 0 },
    ];
    
    return steps;
  } catch (error) {
    // Return empty funnel on error
    return [
      { step: 'Clicks', count: 0, conversionRate: 100 },
      { step: 'Sign-ups', count: 0, conversionRate: 0 },
      { step: 'Verified', count: 0, conversionRate: 0 },
      { step: 'Rewards Credited', count: 0, conversionRate: 0 },
    ];
  }
}


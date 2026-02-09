/**
 * Admin Dashboard Analytics Service
 * Pre-aggregated metrics, funnel analysis, cohort retention, and dashboard queries
 */

import { ObjectId, type Db, type Filter } from 'mongodb'
import { getMongoDb } from '@/lib/mongodb'

// ============================================================================
// Types
// ============================================================================

export interface DateRange {
  start: Date
  end: Date
}

export interface AnalyticsOverview {
  users: {
    total: number
    newToday: number
    newThisWeek: number
    newThisMonth: number
    premiumRatio: number
    verifiedRatio: number
  }
  engagement: {
    dau: number
    wau: number
    mau: number
    avgSessionDurationMs: number
    avgSessionsPerUser: number
    d1Retention: number
    d7Retention: number
    d30Retention: number
  }
  revenue: {
    mrrCents: number
    arrCents: number
    newSubscriptions: number
    churnedSubscriptions: number
    churnRate: number
    arpu: number
    ltv: number
  }
  matches: {
    totalToday: number
    totalThisWeek: number
    matchRate: number
    conversationStartedRate: number
    avgMatchesPerUser: number
  }
  safety: {
    openReports: number
    resolvedToday: number
    avgResolutionTimeHours: number
    bansToday: number
    verificationsToday: number
  }
  lastUpdated: string
}

export interface FunnelStep {
  name: string
  count: number
  rate: number
  dropOff: number
  dropOffRate: number
}

export interface FunnelAnalysis {
  funnelId: string
  name: string
  steps: FunnelStep[]
  overallConversionRate: number
  dateRange: DateRange
}

export interface CohortRow {
  cohortWeek: string
  cohortSize: number
  retentionByWeek: Record<number, number>
  revenueByWeek: Record<number, number>
}

export interface MatchAnalytics {
  totalMatches: number
  matchesByTribe: Record<string, number>
  matchesByAgeGroup: Record<string, number>
  matchesByCountry: Record<string, number>
  crossTribeMatchRate: number
  avgTimeTillFirstMessage: number
  conversationDropOffRate: number
}

export interface GeoAnalytics {
  usersByCountry: Array<{ country: string; count: number; percentage: number }>
  usersByCity: Array<{ city: string; country: string; count: number }>
  engagementByCountry: Record<string, { dau: number; matchRate: number; messageRate: number }>
}

// ============================================================================
// Dashboard Overview
// ============================================================================

/**
 * Get comprehensive analytics overview for dashboard
 */
export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const db = await getMongoDb()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)
  const monthStart = new Date(todayStart)
  monthStart.setDate(monthStart.getDate() - 30)

  const [
    userMetrics,
    engagementMetrics,
    revenueMetrics,
    matchMetrics,
    safetyMetrics,
  ] = await Promise.all([
    getUserMetrics(db, todayStart, weekStart, monthStart),
    getEngagementMetrics(db, todayStart, weekStart, monthStart),
    getRevenueMetrics(db),
    getMatchMetrics(db, todayStart, weekStart),
    getSafetyMetrics(db, todayStart),
  ])

  return {
    users: userMetrics,
    engagement: engagementMetrics,
    revenue: revenueMetrics,
    matches: matchMetrics,
    safety: safetyMetrics,
    lastUpdated: new Date().toISOString(),
  }
}

async function getUserMetrics(
  db: Db,
  todayStart: Date,
  weekStart: Date,
  monthStart: Date
) {
  const usersCollection = db.collection('users')
  const profilesCollection = db.collection('profiles')

  const [
    total,
    newToday,
    newThisWeek,
    newThisMonth,
    premiumCount,
    verifiedCount,
  ] = await Promise.all([
    usersCollection.countDocuments({ status: { $ne: 'deleted' } }),
    usersCollection.countDocuments({ createdAt: { $gte: todayStart } }),
    usersCollection.countDocuments({ createdAt: { $gte: weekStart } }),
    usersCollection.countDocuments({ createdAt: { $gte: monthStart } }),
    db.collection('subscriptions').countDocuments({
      status: 'active',
      planId: { $ne: 'free' },
    }),
    profilesCollection.countDocuments({
      $or: [
        { 'verificationStatus.selfie': true },
        { 'verificationStatus.id': true },
      ],
    }),
  ])

  return {
    total,
    newToday,
    newThisWeek,
    newThisMonth,
    premiumRatio: total > 0 ? premiumCount / total : 0,
    verifiedRatio: total > 0 ? verifiedCount / total : 0,
  }
}

async function getEngagementMetrics(
  db: Db,
  todayStart: Date,
  weekStart: Date,
  monthStart: Date
) {
  const sessionsCollection = db.collection('user_sessions')
  const usersCollection = db.collection('users')

  // DAU: Unique users with sessions today
  const dauPipeline = [
    { $match: { startTime: { $gte: todayStart } } },
    { $group: { _id: '$userId' } },
    { $count: 'count' },
  ]

  // WAU: Unique users with sessions this week
  const wauPipeline = [
    { $match: { startTime: { $gte: weekStart } } },
    { $group: { _id: '$userId' } },
    { $count: 'count' },
  ]

  // MAU: Unique users with sessions this month
  const mauPipeline = [
    { $match: { startTime: { $gte: monthStart } } },
    { $group: { _id: '$userId' } },
    { $count: 'count' },
  ]

  // Average session duration
  const sessionStatsPipeline = [
    { $match: { startTime: { $gte: weekStart }, duration: { $exists: true, $gt: 0 } } },
    {
      $group: {
        _id: null,
        avgDuration: { $avg: '$duration' },
        totalSessions: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
      },
    },
  ]

  // Retention calculation
  const retentionD1 = await calculateRetention(db, 1)
  const retentionD7 = await calculateRetention(db, 7)
  const retentionD30 = await calculateRetention(db, 30)

  const [dauResult, wauResult, mauResult, sessionStats] = await Promise.all([
    sessionsCollection.aggregate(dauPipeline).toArray(),
    sessionsCollection.aggregate(wauPipeline).toArray(),
    sessionsCollection.aggregate(mauPipeline).toArray(),
    sessionsCollection.aggregate(sessionStatsPipeline).toArray(),
  ])

  const dau = dauResult[0]?.count || 0
  const wau = wauResult[0]?.count || 0
  const mau = mauResult[0]?.count || 0
  const stats = sessionStats[0]

  return {
    dau,
    wau,
    mau,
    avgSessionDurationMs: stats?.avgDuration || 0,
    avgSessionsPerUser:
      stats?.uniqueUsers?.length > 0
        ? stats.totalSessions / stats.uniqueUsers.length
        : 0,
    d1Retention: retentionD1,
    d7Retention: retentionD7,
    d30Retention: retentionD30,
  }
}

async function calculateRetention(db: Db, days: number): Promise<number> {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() - days)
  const targetDateStart = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  )
  const targetDateEnd = new Date(targetDateStart)
  targetDateEnd.setDate(targetDateEnd.getDate() + 1)

  const returnDate = new Date()
  const returnDateStart = new Date(
    returnDate.getFullYear(),
    returnDate.getMonth(),
    returnDate.getDate()
  )

  // Users who signed up on target date
  const cohort = await db
    .collection('users')
    .distinct('_id', { createdAt: { $gte: targetDateStart, $lt: targetDateEnd } })

  if (cohort.length === 0) return 0

  // Users who had a session today
  const returned = await db.collection('user_sessions').distinct('userId', {
    userId: { $in: cohort },
    startTime: { $gte: returnDateStart },
  })

  return returned.length / cohort.length
}

async function getRevenueMetrics(db: Db) {
  const subscriptionsCollection = db.collection('subscriptions')
  const paymentsCollection = db.collection('payments')
  const subscriptionEventsCollection = db.collection('subscription_events')

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // MRR calculation: sum of all active subscription monthly rates
  const mrrPipeline = [
    { $match: { status: 'active' } },
    {
      $lookup: {
        from: 'subscription_plans',
        localField: 'planId',
        foreignField: 'planId',
        as: 'plan',
      },
    },
    { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: null,
        totalMrr: { $sum: { $ifNull: ['$plan.priceMonthly.amountCents', 999] } },
        activeCount: { $sum: 1 },
      },
    },
  ]

  // New subscriptions this month
  const newSubsPipeline = [
    {
      $match: {
        eventType: 'subscription_started',
        occurredAt: { $gte: monthStart },
      },
    },
    { $count: 'count' },
  ]

  // Churned subscriptions this month
  const churnedPipeline = [
    {
      $match: {
        eventType: 'subscription_cancelled',
        occurredAt: { $gte: monthStart },
      },
    },
    { $count: 'count' },
  ]

  // Active subs at start of last month (for churn rate)
  const lastMonthActivePipeline = [
    { $match: { startAt: { $lt: monthStart }, status: 'active' } },
    { $count: 'count' },
  ]

  const [mrrResult, newSubsResult, churnedResult, lastMonthActiveResult] =
    await Promise.all([
      subscriptionsCollection.aggregate(mrrPipeline).toArray(),
      subscriptionEventsCollection.aggregate(newSubsPipeline).toArray(),
      subscriptionEventsCollection.aggregate(churnedPipeline).toArray(),
      subscriptionsCollection.aggregate(lastMonthActivePipeline).toArray(),
    ])

  const mrrCents = mrrResult[0]?.totalMrr || 0
  const activeCount = mrrResult[0]?.activeCount || 0
  const newSubscriptions = newSubsResult[0]?.count || 0
  const churnedSubscriptions = churnedResult[0]?.count || 0
  const lastMonthActive = lastMonthActiveResult[0]?.count || 1

  return {
    mrrCents,
    arrCents: mrrCents * 12,
    newSubscriptions,
    churnedSubscriptions,
    churnRate: churnedSubscriptions / lastMonthActive,
    arpu: activeCount > 0 ? mrrCents / activeCount : 0,
    ltv: activeCount > 0 && churnedSubscriptions > 0 
      ? (mrrCents / activeCount) / (churnedSubscriptions / lastMonthActive)
      : 0,
  }
}

async function getMatchMetrics(db: Db, todayStart: Date, weekStart: Date) {
  const matchesCollection = db.collection('matches')
  const messagesCollection = db.collection('chat_messages')

  // Matches today and this week
  const [matchesToday, matchesThisWeek, totalMatches] = await Promise.all([
    matchesCollection.countDocuments({ createdAt: { $gte: todayStart } }),
    matchesCollection.countDocuments({ createdAt: { $gte: weekStart } }),
    matchesCollection.countDocuments({}),
  ])

  // Match rate (matches / likes this week)
  const likesThisWeek = await db
    .collection('likes')
    .countDocuments({ createdAt: { $gte: weekStart } })
  const matchRate = likesThisWeek > 0 ? matchesThisWeek / likesThisWeek : 0

  // Conversation started rate (matches with at least one message)
  const matchesWithMessages = await matchesCollection
    .aggregate([
      { $match: { createdAt: { $gte: weekStart } } },
      {
        $lookup: {
          from: 'chat_threads',
          localField: 'pairHash',
          foreignField: 'participantHash',
          as: 'thread',
        },
      },
      { $match: { 'thread.lastMessageAt': { $exists: true } } },
      { $count: 'count' },
    ])
    .toArray()

  const conversationStartedRate =
    matchesThisWeek > 0
      ? (matchesWithMessages[0]?.count || 0) / matchesThisWeek
      : 0

  // Average matches per user
  const usersWithMatches = await matchesCollection
    .aggregate([
      { $unwind: '$memberIds' },
      { $group: { _id: '$memberIds' } },
      { $count: 'count' },
    ])
    .toArray()

  const avgMatchesPerUser =
    usersWithMatches[0]?.count > 0
      ? totalMatches / usersWithMatches[0].count
      : 0

  return {
    totalToday: matchesToday,
    totalThisWeek: matchesThisWeek,
    matchRate,
    conversationStartedRate,
    avgMatchesPerUser,
  }
}

async function getSafetyMetrics(db: Db, todayStart: Date) {
  const reportsCollection = db.collection('reports')
  const moderationActionsCollection = db.collection('moderation_actions')
  const livenessCollection = db.collection('liveness_sessions')

  const [
    openReports,
    resolvedToday,
    bansToday,
    verificationsToday,
  ] = await Promise.all([
    reportsCollection.countDocuments({
      status: { $in: ['open', 'triaged', 'in_progress'] },
    }),
    reportsCollection.countDocuments({
      status: 'resolved',
      'resolution.resolvedAt': { $gte: todayStart },
    }),
    moderationActionsCollection.countDocuments({
      action: 'ban',
      createdAt: { $gte: todayStart },
    }),
    livenessCollection.countDocuments({
      status: 'passed',
      updatedAt: { $gte: todayStart },
    }),
  ])

  // Average resolution time
  const resolutionTimePipeline = [
    {
      $match: {
        status: 'resolved',
        'resolution.resolvedAt': { $gte: todayStart },
      },
    },
    {
      $project: {
        resolutionTime: {
          $subtract: ['$resolution.resolvedAt', '$createdAt'],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgTime: { $avg: '$resolutionTime' },
      },
    },
  ]

  const resolutionTimeResult = await reportsCollection
    .aggregate(resolutionTimePipeline)
    .toArray()

  return {
    openReports,
    resolvedToday,
    avgResolutionTimeHours:
      (resolutionTimeResult[0]?.avgTime || 0) / (1000 * 60 * 60),
    bansToday,
    verificationsToday,
  }
}

// ============================================================================
// Funnel Analysis
// ============================================================================

/**
 * Calculate onboarding funnel metrics
 */
export async function getOnboardingFunnel(dateRange: DateRange): Promise<FunnelAnalysis> {
  const db = await getMongoDb()

  // Step 1: Signups in range
  const signups = await db.collection('users').countDocuments({
    createdAt: { $gte: dateRange.start, $lt: dateRange.end },
  })

  // Step 2: Photo uploaded
  const photoUploads = await db.collection('profiles').countDocuments({
    createdAt: { $gte: dateRange.start, $lt: dateRange.end },
    'mediaGallery.0': { $exists: true },
  })

  // Step 3: Bio completed
  const bioCompleted = await db.collection('profiles').countDocuments({
    createdAt: { $gte: dateRange.start, $lt: dateRange.end },
    bio: { $exists: true, $ne: '' },
  })

  // Step 4: First swipe
  const firstSwipes = await db
    .collection('interaction_events')
    .aggregate([
      {
        $match: {
          event: { $in: ['swipe_left', 'swipe_right'] },
          createdAt: { $gte: dateRange.start, $lt: dateRange.end },
        },
      },
      { $group: { _id: '$actorId' } },
      { $count: 'count' },
    ])
    .toArray()

  // Step 5: First match
  const firstMatches = await db
    .collection('matches')
    .aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lt: dateRange.end },
        },
      },
      { $unwind: '$memberIds' },
      { $group: { _id: '$memberIds' } },
      { $count: 'count' },
    ])
    .toArray()

  const steps: FunnelStep[] = [
    {
      name: 'Signup',
      count: signups,
      rate: 1,
      dropOff: 0,
      dropOffRate: 0,
    },
    {
      name: 'Photo Upload',
      count: photoUploads,
      rate: signups > 0 ? photoUploads / signups : 0,
      dropOff: signups - photoUploads,
      dropOffRate: signups > 0 ? (signups - photoUploads) / signups : 0,
    },
    {
      name: 'Bio Completed',
      count: bioCompleted,
      rate: signups > 0 ? bioCompleted / signups : 0,
      dropOff: photoUploads - bioCompleted,
      dropOffRate: photoUploads > 0 ? (photoUploads - bioCompleted) / photoUploads : 0,
    },
    {
      name: 'First Swipe',
      count: firstSwipes[0]?.count || 0,
      rate: signups > 0 ? (firstSwipes[0]?.count || 0) / signups : 0,
      dropOff: bioCompleted - (firstSwipes[0]?.count || 0),
      dropOffRate:
        bioCompleted > 0
          ? (bioCompleted - (firstSwipes[0]?.count || 0)) / bioCompleted
          : 0,
    },
    {
      name: 'First Match',
      count: firstMatches[0]?.count || 0,
      rate: signups > 0 ? (firstMatches[0]?.count || 0) / signups : 0,
      dropOff: (firstSwipes[0]?.count || 0) - (firstMatches[0]?.count || 0),
      dropOffRate:
        (firstSwipes[0]?.count || 0) > 0
          ? ((firstSwipes[0]?.count || 0) - (firstMatches[0]?.count || 0)) /
            (firstSwipes[0]?.count || 0)
          : 0,
    },
  ]

  return {
    funnelId: 'onboarding',
    name: 'User Onboarding',
    steps,
    overallConversionRate:
      signups > 0 ? (firstMatches[0]?.count || 0) / signups : 0,
    dateRange,
  }
}

// ============================================================================
// Cohort Retention
// ============================================================================

/**
 * Get cohort retention analysis
 */
export async function getCohortRetention(
  cohortWeeks: number = 8,
  retentionWeeks: number = 12
): Promise<CohortRow[]> {
  const db = await getMongoDb()
  const cohorts: CohortRow[] = []

  for (let weekOffset = cohortWeeks - 1; weekOffset >= 0; weekOffset--) {
    const cohortStart = getWeekStart(weekOffset)
    const cohortEnd = getWeekEnd(weekOffset)
    const cohortWeek = formatWeek(cohortStart)

    // Get users in this cohort
    const cohortUsers = await db.collection('users').distinct('_id', {
      createdAt: { $gte: cohortStart, $lt: cohortEnd },
    })

    const cohortSize = cohortUsers.length
    if (cohortSize === 0) continue

    const retentionByWeek: Record<number, number> = {}
    const revenueByWeek: Record<number, number> = {}

    // Calculate retention for each subsequent week
    for (let retWeek = 0; retWeek <= retentionWeeks && weekOffset - retWeek >= 0; retWeek++) {
      const retentionStart = getWeekStart(weekOffset - retWeek)
      const retentionEnd = getWeekEnd(weekOffset - retWeek)

      if (retentionStart > new Date()) break

      // Users who had a session in this week
      const activeUsers = await db.collection('user_sessions').distinct('userId', {
        userId: { $in: cohortUsers },
        startTime: { $gte: retentionStart, $lt: retentionEnd },
      })

      retentionByWeek[retWeek] = activeUsers.length / cohortSize

      // Revenue from this cohort in this week
      const revenuePipeline = [
        {
          $match: {
            userId: { $in: cohortUsers },
            occurredAt: { $gte: retentionStart, $lt: retentionEnd },
            eventType: 'payment_succeeded',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount.cents' },
          },
        },
      ]

      const revenueResult = await db
        .collection('subscription_events')
        .aggregate(revenuePipeline)
        .toArray()

      revenueByWeek[retWeek] = (revenueResult[0]?.total || 0) / cohortSize
    }

    cohorts.push({
      cohortWeek,
      cohortSize,
      retentionByWeek,
      revenueByWeek,
    })
  }

  return cohorts
}

function getWeekStart(weeksAgo: number): Date {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfThisWeek = new Date(now)
  startOfThisWeek.setDate(now.getDate() - dayOfWeek)
  startOfThisWeek.setHours(0, 0, 0, 0)

  const result = new Date(startOfThisWeek)
  result.setDate(result.getDate() - weeksAgo * 7)
  return result
}

function getWeekEnd(weeksAgo: number): Date {
  const start = getWeekStart(weeksAgo)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return end
}

function formatWeek(date: Date): string {
  const year = date.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const days = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  )
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  return `${year}-W${week.toString().padStart(2, '0')}`
}

// ============================================================================
// Match Analytics (Dating-Specific)
// ============================================================================

/**
 * Get detailed match analytics by demographics
 */
export async function getMatchAnalytics(dateRange: DateRange): Promise<MatchAnalytics> {
  const db = await getMongoDb()
  const matchesCollection = db.collection('matches')
  const profilesCollection = db.collection('profiles')

  // Total matches in range
  const totalMatches = await matchesCollection.countDocuments({
    createdAt: { $gte: dateRange.start, $lt: dateRange.end },
  })

  // Matches by tribe
  const matchesByTribePipeline = [
    {
      $match: { createdAt: { $gte: dateRange.start, $lt: dateRange.end } },
    },
    { $unwind: '$memberIds' },
    {
      $lookup: {
        from: 'profiles',
        localField: 'memberIds',
        foreignField: 'userId',
        as: 'profile',
      },
    },
    { $unwind: '$profile' },
    {
      $group: {
        _id: '$profile.tribe',
        count: { $sum: 1 },
      },
    },
  ]

  // Matches by age group
  const matchesByAgePipeline = [
    {
      $match: { createdAt: { $gte: dateRange.start, $lt: dateRange.end } },
    },
    { $unwind: '$memberIds' },
    {
      $lookup: {
        from: 'profiles',
        localField: 'memberIds',
        foreignField: 'userId',
        as: 'profile',
      },
    },
    { $unwind: '$profile' },
    {
      $addFields: {
        age: {
          $divide: [
            { $subtract: [new Date(), '$profile.dob'] },
            1000 * 60 * 60 * 24 * 365,
          ],
        },
      },
    },
    {
      $addFields: {
        ageGroup: {
          $switch: {
            branches: [
              { case: { $lt: ['$age', 25] }, then: '18-24' },
              { case: { $lt: ['$age', 35] }, then: '25-34' },
              { case: { $lt: ['$age', 45] }, then: '35-44' },
            ],
            default: '45+',
          },
        },
      },
    },
    {
      $group: {
        _id: '$ageGroup',
        count: { $sum: 1 },
      },
    },
  ]

  // Matches by country
  const matchesByCountryPipeline = [
    {
      $match: { createdAt: { $gte: dateRange.start, $lt: dateRange.end } },
    },
    { $unwind: '$memberIds' },
    {
      $lookup: {
        from: 'profiles',
        localField: 'memberIds',
        foreignField: 'userId',
        as: 'profile',
      },
    },
    { $unwind: '$profile' },
    {
      $group: {
        _id: '$profile.location.country',
        count: { $sum: 1 },
      },
    },
  ]

  // Cross-tribe matches
  const crossTribeMatchesPipeline = [
    {
      $match: { createdAt: { $gte: dateRange.start, $lt: dateRange.end } },
    },
    {
      $lookup: {
        from: 'profiles',
        localField: 'memberIds',
        foreignField: 'userId',
        as: 'profiles',
      },
    },
    {
      $addFields: {
        tribes: { $map: { input: '$profiles', as: 'p', in: '$$p.tribe' } },
      },
    },
    {
      $match: {
        $expr: {
          $ne: [{ $arrayElemAt: ['$tribes', 0] }, { $arrayElemAt: ['$tribes', 1] }],
        },
      },
    },
    { $count: 'count' },
  ]

  const [
    matchesByTribe,
    matchesByAge,
    matchesByCountry,
    crossTribeMatches,
  ] = await Promise.all([
    matchesCollection.aggregate(matchesByTribePipeline).toArray(),
    matchesCollection.aggregate(matchesByAgePipeline).toArray(),
    matchesCollection.aggregate(matchesByCountryPipeline).toArray(),
    matchesCollection.aggregate(crossTribeMatchesPipeline).toArray(),
  ])

  return {
    totalMatches,
    matchesByTribe: Object.fromEntries(
      matchesByTribe.map((r) => [r._id || 'Unknown', r.count])
    ),
    matchesByAgeGroup: Object.fromEntries(
      matchesByAge.map((r) => [r._id || 'Unknown', r.count])
    ),
    matchesByCountry: Object.fromEntries(
      matchesByCountry.map((r) => [r._id || 'Unknown', r.count])
    ),
    crossTribeMatchRate:
      totalMatches > 0 ? (crossTribeMatches[0]?.count || 0) / totalMatches : 0,
    avgTimeTillFirstMessage: 0, // Would require additional query
    conversationDropOffRate: 0, // Would require additional query
  }
}

// ============================================================================
// Geo Analytics
// ============================================================================

/**
 * Get geographic distribution and engagement analytics
 */
export async function getGeoAnalytics(): Promise<GeoAnalytics> {
  const db = await getMongoDb()
  const profilesCollection = db.collection('profiles')

  // Users by country
  const usersByCountryPipeline = [
    {
      $group: {
        _id: '$location.country',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]

  // Users by city
  const usersByCityPipeline = [
    {
      $group: {
        _id: { city: '$location.city', country: '$location.country' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 50 },
  ]

  const [usersByCountry, usersByCity] = await Promise.all([
    profilesCollection.aggregate(usersByCountryPipeline).toArray(),
    profilesCollection.aggregate(usersByCityPipeline).toArray(),
  ])

  const totalUsers = usersByCountry.reduce((sum, c) => sum + c.count, 0)

  return {
    usersByCountry: usersByCountry.map((c) => ({
      country: c._id || 'Unknown',
      count: c.count,
      percentage: totalUsers > 0 ? c.count / totalUsers : 0,
    })),
    usersByCity: usersByCity.map((c) => ({
      city: c._id?.city || 'Unknown',
      country: c._id?.country || 'Unknown',
      count: c.count,
    })),
    engagementByCountry: {}, // Would require additional queries
  }
}

// ============================================================================
// Snapshot Generation (Background Job)
// ============================================================================

/**
 * Generate and store analytics snapshot for a time range
 */
export async function generateAnalyticsSnapshot(
  type: 'activation' | 'retention' | 'revenue' | 'engagement' | 'trust' | 'geo',
  range: 'hourly' | 'daily' | 'weekly' | 'monthly'
): Promise<void> {
  const db = await getMongoDb()
  const now = new Date()

  // Calculate window based on range
  const { windowStart, windowEnd } = calculateWindow(range, now)

  // Collect metrics based on type
  let metrics: Record<string, number> = {}

  switch (type) {
    case 'engagement': {
      const overview = await getAnalyticsOverview()
      metrics = {
        dau: overview.engagement.dau,
        wau: overview.engagement.wau,
        mau: overview.engagement.mau,
        avg_session_duration_ms: overview.engagement.avgSessionDurationMs,
        d1_retention: overview.engagement.d1Retention,
        d7_retention: overview.engagement.d7Retention,
      }
      break
    }
    case 'revenue': {
      const overview = await getAnalyticsOverview()
      metrics = {
        mrr_cents: overview.revenue.mrrCents,
        arr_cents: overview.revenue.arrCents,
        new_subscriptions: overview.revenue.newSubscriptions,
        churned_subscriptions: overview.revenue.churnedSubscriptions,
        churn_rate: overview.revenue.churnRate,
        arpu: overview.revenue.arpu,
      }
      break
    }
    // Add other types as needed
  }

  // Upsert snapshot
  await db.collection('analytics_snapshots').updateOne(
    { type, range, windowStart },
    {
      $set: {
        type,
        range,
        windowStart,
        windowEnd,
        metrics,
        source: 'batch',
        generatedAt: now,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  )
}

function calculateWindow(
  range: 'hourly' | 'daily' | 'weekly' | 'monthly',
  now: Date
): { windowStart: Date; windowEnd: Date } {
  const windowEnd = new Date(now)

  switch (range) {
    case 'hourly':
      windowEnd.setMinutes(0, 0, 0)
      const hourStart = new Date(windowEnd)
      hourStart.setHours(hourStart.getHours() - 1)
      return { windowStart: hourStart, windowEnd }

    case 'daily':
      windowEnd.setHours(0, 0, 0, 0)
      const dayStart = new Date(windowEnd)
      dayStart.setDate(dayStart.getDate() - 1)
      return { windowStart: dayStart, windowEnd }

    case 'weekly':
      const dayOfWeek = windowEnd.getDay()
      windowEnd.setDate(windowEnd.getDate() - dayOfWeek)
      windowEnd.setHours(0, 0, 0, 0)
      const weekStart = new Date(windowEnd)
      weekStart.setDate(weekStart.getDate() - 7)
      return { windowStart: weekStart, windowEnd }

    case 'monthly':
      windowEnd.setDate(1)
      windowEnd.setHours(0, 0, 0, 0)
      const monthStart = new Date(windowEnd)
      monthStart.setMonth(monthStart.getMonth() - 1)
      return { windowStart: monthStart, windowEnd }
  }
}

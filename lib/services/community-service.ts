import { ObjectId } from 'mongodb'

import type {
  CommunityClubDocument,
  CommunityCommentDocument,
  CommunityPostDocument,
  ProfileDocument,
  UserDocument,
} from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'
import { withSpan } from '@/lib/observability/tracing'
import { createTrustEvent } from '@/lib/trust/trust-event-service'

export type ClubSummary = {
  id: string
  slug: string
  name: string
  tagline?: string
  description: string
  tags: string[]
  memberCount: number
  coverImage?: string
  accentColor?: string
  guardianOnly: boolean
  visibility: CommunityClubDocument['visibility']
  upcomingAma?: { topic: string; startAt: string; hostId?: string }
}

export type AmaScheduleEntry = {
  clubId: string
  clubSlug: string
  clubName: string
  topic: string
  startAt: string
  hostId?: string
  hostName?: string
}

export type CommunityPostSummary = {
  id: string
  clubId: string
  clubSlug?: string
  author: { userId: string; name?: string; tribe?: string; avatarUrl?: string }
  body?: string
  richText?: Record<string, unknown>
  poll?: CommunityPostDocument['poll']
  createdAt: string
  tags: string[]
  reactionCounts: CommunityPostDocument['reactionCounts']
  commentCount: number
  comments?: CommunityCommentSummary[]
  pinned?: boolean
  safety: CommunityPostDocument['safety']
}

export type CommunityCommentSummary = {
  id: string
  author: { userId: string; name?: string; tribe?: string }
  body?: string
  createdAt: string
  safety: CommunityCommentDocument['safety']
}

export type CommunityLandingResponse = {
  clubs: ClubSummary[]
  trendingPosts: CommunityPostSummary[]
  amaSchedule: AmaScheduleEntry[]
}

export type CommunityFeedResponse = {
  club: ClubSummary & {
    descriptionLong: string
    featuredHostIds: string[]
    timezone?: string
  }
  posts: CommunityPostSummary[]
  nextCursor?: string
}

export type CreateCommunityPostPayload = {
  clubId: string
  body?: string
  richText?: Record<string, unknown>
  poll?: CommunityPostDocument['poll']
  tags?: string[]
}

export type CreateCommunityCommentPayload = {
  body?: string
  richText?: Record<string, unknown>
  parentCommentId?: string
}

export class CommunityServiceError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.code = code
    this.status = status
  }
}

const DEFAULT_POST_LIMIT = 25

export class CommunityService {
  static async listClubs(userId?: string) {
    return withSpan('community.listClubs', async () => {
      const db = await getMongoDb()
      const clubsCollection = db.collection<CommunityClubDocument>('community_clubs')
      const postsCollection = db.collection<CommunityPostDocument>('community_posts')

      const clubs = await clubsCollection.find({ status: 'active' }).sort({ memberCount: -1 }).limit(24).toArray()
      const trendingPosts = await postsCollection
        .aggregate<CommunityPostDocument>([
          { $match: { 'safety.state': 'clear', visibility: { $in: ['public', 'club'] } } },
          {
            $addFields: {
              reactionScore: { $sum: '$reactionCounts.count' },
            },
          },
          { $sort: { reactionScore: -1, commentCount: -1, createdAt: -1 } },
          { $limit: 5 },
        ])
        .toArray()

      const amaSchedule = this.buildAmaSchedule(clubs).slice(0, 6)
      const profileMap = await this.loadProfiles([...new Set(trendingPosts.map((post) => post.authorId.toHexString()))])

      return {
        clubs: clubs.map((club) => this.buildClubSummary(club)),
        trendingPosts: trendingPosts.map((post) => this.toPostSummary(post, profileMap)),
        amaSchedule,
      }
    }, { userId })
  }

  static async getClubFeed(slug: string, userId?: string, options?: { cursor?: string }) {
    return withSpan('community.clubFeed', async () => {
      const db = await getMongoDb()
      const clubsCollection = db.collection<CommunityClubDocument>('community_clubs')
      const postsCollection = db.collection<CommunityPostDocument>('community_posts')
      const club = await clubsCollection.findOne({ slug, status: 'active' })
      if (!club) {
        throw new CommunityServiceError('club_not_found', 'Club not found', 404)
      }

      await this.ensureClubAccess(club, userId)

      const query: Record<string, unknown> = { clubId: club._id, 'safety.state': { $ne: 'blocked' } }
      if (options?.cursor) {
        const cursorDate = new Date(options.cursor)
        if (!Number.isNaN(cursorDate.getTime())) {
          query.createdAt = { $lt: cursorDate }
        }
      }

      const posts = await postsCollection
        .find(query)
        .sort({ 'pin.isPinned': -1, createdAt: -1 })
        .limit(DEFAULT_POST_LIMIT)
        .toArray()

      const profileMap = await this.loadProfiles([...new Set(posts.map((post) => post.authorId.toHexString()))])
      const comments = await this.loadComments(posts.map((post) => post._id!))

      const summaries = posts.map((post) =>
        this.toPostSummary(post, profileMap, {
          comments: comments.get(post._id!.toHexString()),
          club,
        }),
      )

      const nextCursor = posts.length === DEFAULT_POST_LIMIT ? posts[posts.length - 1].createdAt?.toISOString() : undefined

      return {
        club: {
          ...this.buildClubSummary(club),
          descriptionLong: club.description,
          featuredHostIds: club.featuredHostIds.map((id) => id.toHexString()),
          timezone: club.timezone,
        },
        posts: summaries,
        nextCursor,
      }
    }, { userId, slug })
  }

  static async createPost(userId: string, payload: CreateCommunityPostPayload) {
    return withSpan('community.createPost', async () => {
      if (!payload.body?.trim() && !payload.richText && !payload.poll) {
        throw new CommunityServiceError('invalid_payload', 'Post must include text or poll content')
      }

      const db = await getMongoDb()
      const clubsCollection = db.collection<CommunityClubDocument>('community_clubs')
      const postsCollection = db.collection<CommunityPostDocument>('community_posts')
      const club = await clubsCollection.findOne({ _id: new ObjectId(payload.clubId) })
      if (!club) {
        throw new CommunityServiceError('club_not_found', 'Club not found', 404)
      }

      await this.ensureClubAccess(club, userId)

      const now = new Date()
      const document: CommunityPostDocument = {
        _id: new ObjectId(),
        authorId: new ObjectId(userId),
        clubId: club._id,
        visibility: 'club',
        body: payload.body?.trim(),
        richText: payload.richText,
        mentions: [],
        media: [],
        poll: payload.poll,
        reactionCounts: [],
        commentCount: 0,
        shareCount: 0,
        safety: { state: 'clear' },
        pin: undefined,
        tags: payload.tags ?? [],
        metadata: { createdVia: 'member_app' },
        createdAt: now,
        updatedAt: now,
      }

      await postsCollection.insertOne(document)
      await createTrustEvent({ userId, eventType: 'community_post_created', relatedIds: [document._id] })

      const profileMap = await this.loadProfiles([userId])
      return this.toPostSummary(document, profileMap, { club })
    }, { userId, clubId: payload.clubId })
  }

  static async addComment(userId: string, postId: string, payload: CreateCommunityCommentPayload) {
    return withSpan('community.addComment', async () => {
      if (!payload.body?.trim() && !payload.richText) {
        throw new CommunityServiceError('invalid_payload', 'Comment must include text')
      }

      const db = await getMongoDb()
      const postsCollection = db.collection<CommunityPostDocument>('community_posts')
      const commentsCollection = db.collection<CommunityCommentDocument>('community_comments')
      const post = await postsCollection.findOne({ _id: new ObjectId(postId) })
      if (!post) {
        throw new CommunityServiceError('post_not_found', 'Post not found', 404)
      }

      const now = new Date()
      const document: CommunityCommentDocument = {
        _id: new ObjectId(),
        postId: post._id!,
        authorId: new ObjectId(userId),
        body: payload.body?.trim(),
        richText: payload.richText,
        attachments: [],
        parentCommentId: payload.parentCommentId ? new ObjectId(payload.parentCommentId) : undefined,
        threadPath: payload.parentCommentId ? `${payload.parentCommentId}:${now.getTime()}` : documentIdToThreadPath(now),
        reactions: [],
        safety: { state: 'clear' },
        deletedAt: undefined,
        createdAt: now,
        updatedAt: now,
      }

      await commentsCollection.insertOne(document)
      await postsCollection.updateOne({ _id: post._id }, { $inc: { commentCount: 1 }, $set: { updatedAt: now } })

      const profileMap = await this.loadProfiles([userId])
      return this.toCommentSummary(document, profileMap)
    }, { userId, postId })
  }

  static async toggleReaction(userId: string, postId: string, emoji: string) {
    return withSpan('community.toggleReaction', async () => {
      const db = await getMongoDb()
      const postsCollection = db.collection<CommunityPostDocument>('community_posts')
      const post = await postsCollection.findOne({ _id: new ObjectId(postId) })
      if (!post) {
        throw new CommunityServiceError('post_not_found', 'Post not found', 404)
      }

      const metadata = post.metadata ?? {}
      const reactionUsers: Record<string, string[]> = metadata.reactionUsers ?? {}
      const userList = new Set(reactionUsers[emoji] ?? [])
      let reactionCounts = [...post.reactionCounts]
      let userHasReacted = userList.has(userId)

      if (userHasReacted) {
        userList.delete(userId)
        reactionCounts = reactionCounts.map((reaction) =>
          reaction.type === emoji ? { ...reaction, count: Math.max(0, reaction.count - 1) } : reaction,
        )
      } else {
        userList.add(userId)
        const match = reactionCounts.find((reaction) => reaction.type === emoji)
        if (match) {
          match.count += 1
        } else {
          reactionCounts.push({ type: emoji, count: 1 })
        }
      }

      reactionCounts = reactionCounts.filter((reaction) => reaction.count > 0)
      reactionUsers[emoji] = Array.from(userList)

      await postsCollection.updateOne(
        { _id: post._id },
        {
          $set: {
            reactionCounts,
            metadata: { ...metadata, reactionUsers },
            updatedAt: new Date(),
          },
        },
      )

      return reactionCounts
    }, { userId, postId, emoji })
  }

  static async moderatePost(postId: string, actorId: string, action: 'approve' | 'reject', notes?: string) {
    return withSpan('community.moderatePost', async () => {
      const db = await getMongoDb()
      const postsCollection = db.collection<CommunityPostDocument>('community_posts')
      const post = await postsCollection.findOne({ _id: new ObjectId(postId) })
      if (!post) {
        throw new CommunityServiceError('post_not_found', 'Post not found', 404)
      }

      const nextState = action === 'approve' ? 'clear' : 'blocked'
      await postsCollection.updateOne(
        { _id: post._id },
        { $set: { safety: { state: nextState, reason: notes }, updatedAt: new Date() } },
      )

      await createTrustEvent({ userId: actorId, eventType: `community_post_${action}`, relatedIds: [post._id!] })
    }, { postId, action })
  }

  static async listModerationQueue(limit = 25) {
    return withSpan('community.moderationQueue', async () => {
      const db = await getMongoDb()
      const postsCollection = db.collection<CommunityPostDocument>('community_posts')
      const commentsCollection = db.collection<CommunityCommentDocument>('community_comments')

      const posts = await postsCollection
        .find({ 'safety.state': { $in: ['flagged', 'blocked'] } })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .toArray()
      const comments = await commentsCollection
        .find({ 'safety.state': { $in: ['flagged', 'blocked'] } })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .toArray()

      const profileMap = await this.loadProfiles([
        ...new Set([
          ...posts.map((post) => post.authorId.toHexString()),
          ...comments.map((comment) => comment.authorId.toHexString()),
        ]),
      ])

      return {
        posts: posts.map((post) => this.toPostSummary(post, profileMap)),
        comments: comments.map((comment) => this.toCommentSummary(comment, profileMap)),
      }
    })
  }

  private static buildClubSummary(club: CommunityClubDocument): ClubSummary {
    const upcomingAma = (club.amaSchedule ?? [])
      .filter((session) => session.startAt > new Date())
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())[0]

    return {
      id: club._id!.toHexString(),
      slug: club.slug,
      name: club.name,
      tagline: club.tagline,
      description: club.description,
      tags: club.tags,
      memberCount: club.memberCount,
      coverImage: club.coverImage,
      accentColor: club.accentColor,
      guardianOnly: club.guardianOnly,
      visibility: club.visibility,
      upcomingAma: upcomingAma
        ? { topic: upcomingAma.topic, startAt: upcomingAma.startAt.toISOString(), hostId: upcomingAma.hostId?.toHexString() }
        : undefined,
    }
  }

  private static buildAmaSchedule(clubs: CommunityClubDocument[]): AmaScheduleEntry[] {
    const entries: AmaScheduleEntry[] = []
    clubs.forEach((club) => {
      (club.amaSchedule ?? []).forEach((session) => {
        if (session.startAt < new Date()) return
        entries.push({
          clubId: club._id!.toHexString(),
          clubSlug: club.slug,
          clubName: club.name,
          topic: session.topic,
          startAt: session.startAt.toISOString(),
          hostId: session.hostId?.toHexString(),
        })
      })
    })
    return entries.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  }

  private static async loadProfiles(userIds: string[]) {
    if (!userIds.length) {
      return new Map<string, ProfileDocument>()
    }
    const db = await getMongoDb()
    const profileCollection = db.collection<ProfileDocument>('profiles')
    const objectIds = userIds.map((id) => new ObjectId(id))
    const profiles = await profileCollection
      .find({ userId: { $in: objectIds } })
      .project({ userId: 1, name: 1, tribe: 1, mediaGallery: 1 })
      .toArray()

    return new Map(profiles.map((profile) => [profile.userId.toHexString(), profile]))
  }

  private static async loadComments(postIds: ObjectId[]) {
    const map = new Map<string, CommunityCommentSummary[]>()
    if (!postIds.length) return map

    const db = await getMongoDb()
    const commentsCollection = db.collection<CommunityCommentDocument>('community_comments')
    const comments = await commentsCollection
      .find({ postId: { $in: postIds }, 'safety.state': { $ne: 'blocked' } })
      .sort({ createdAt: 1 })
      .limit(100)
      .toArray()

    const profileMap = await this.loadProfiles([...new Set(comments.map((comment) => comment.authorId.toHexString()))])
    comments.forEach((comment) => {
      const list = map.get(comment.postId.toHexString()) ?? []
      if (list.length < 3) {
        list.push(this.toCommentSummary(comment, profileMap))
      }
      map.set(comment.postId.toHexString(), list)
    })
    return map
  }

  private static toPostSummary(
    post: CommunityPostDocument,
    profileMap: Map<string, ProfileDocument>,
    options?: { comments?: CommunityCommentSummary[]; club?: CommunityClubDocument },
  ): CommunityPostSummary {
    const authorProfile = profileMap.get(post.authorId.toHexString())
    return {
      id: post._id!.toHexString(),
      clubId: post.clubId?.toHexString?.() ?? options?.club?._id?.toHexString() ?? '',
      clubSlug: options?.club?.slug,
      author: {
        userId: post.authorId.toHexString(),
        name: authorProfile?.name,
        tribe: authorProfile?.tribe,
        avatarUrl: authorProfile?.mediaGallery?.[0]?.url,
      },
      body: post.body,
      richText: post.richText,
      poll: post.poll,
      createdAt: post.createdAt?.toISOString?.() ?? new Date().toISOString(),
      tags: post.tags ?? [],
      reactionCounts: post.reactionCounts ?? [],
      commentCount: post.commentCount ?? 0,
      comments: options?.comments,
      pinned: post.pin?.isPinned,
      safety: post.safety,
    }
  }

  private static toCommentSummary(comment: CommunityCommentDocument, profileMap: Map<string, ProfileDocument>): CommunityCommentSummary {
    const profile = profileMap.get(comment.authorId.toHexString())
    return {
      id: comment._id!.toHexString(),
      author: {
        userId: comment.authorId.toHexString(),
        name: profile?.name,
        tribe: profile?.tribe,
      },
      body: comment.body,
      createdAt: comment.createdAt?.toISOString?.() ?? new Date().toISOString(),
      safety: comment.safety,
    }
  }

  private static async ensureClubAccess(club: CommunityClubDocument, userId?: string) {
    if (!userId) {
      throw new CommunityServiceError('unauthorized', 'You must be signed in', 401)
    }

    if (club.visibility !== 'guardian') {
      return
    }

    const db = await getMongoDb()
    const usersCollection = db.collection<UserDocument>('users')
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
    if (!user) {
      throw new CommunityServiceError('unauthorized', 'User not found', 401)
    }

    const roles = user.roles ?? []
    if (!roles.includes('guardian') && !roles.includes('admin')) {
      throw new CommunityServiceError('forbidden', 'Only guardians can access this club', 403)
    }
  }
}

function documentIdToThreadPath(date: Date) {
  return `${date.getTime()}:${Math.random().toString(36).slice(2, 6)}`
}

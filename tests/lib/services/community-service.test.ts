import { describe, it, expect, beforeAll } from 'vitest'
import { CommunityService } from '@/lib/services/community-service'
import { getMongoDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

describe('CommunityService', () => {
  let userId: string
  let clubId: string

  beforeAll(async () => {
    const db = await getMongoDb()
    userId = new ObjectId().toHexString()
    const club = {
      _id: new ObjectId(),
      slug: 'test-club',
      name: 'Test Club',
      description: 'A club for testing',
      tags: ['test'],
      memberCount: 1,
      coverImage: undefined,
      accentColor: '#000',
      guardianOnly: false,
      visibility: 'public',
      amaSchedule: [],
      status: 'active',
      featuredHostIds: [],
      timezone: 'UTC',
    }
    await db.collection('community_clubs').insertOne(club as any)
    clubId = club._id.toHexString()
  })

  it('creates a post', async () => {
    const post = await CommunityService.createPost(userId, { clubId, body: 'Hello world', tags: ['intro'] })
    expect(post.id).toBeDefined()
    expect(post.body).toBe('Hello world')
  })

  it('adds a comment', async () => {
    const post = await CommunityService.createPost(userId, { clubId, body: 'For comments' })
    const comment = await CommunityService.addComment(userId, post.id, { body: 'Nice post' })
    expect(comment.id).toBeDefined()
    expect(comment.body).toBe('Nice post')
  })

  it('toggles reactions', async () => {
    const post = await CommunityService.createPost(userId, { clubId, body: 'Reactable' })
    const reactions1 = await CommunityService.toggleReaction(userId, post.id, '🔥')
    expect(reactions1.find(r => r.type === '🔥')?.count).toBe(1)
    const reactions2 = await CommunityService.toggleReaction(userId, post.id, '🔥')
    expect(reactions2.find(r => r.type === '🔥')).toBeUndefined()
  })

  it('moderates a post', async () => {
    const post = await CommunityService.createPost(userId, { clubId, body: 'Needs review' })
    await CommunityService.moderatePost(post.id, userId, 'reject', 'Spam')
    const db = await getMongoDb()
    const stored = await db.collection('community_posts').findOne({ _id: new ObjectId(post.id) })
    expect(stored?.safety.state).toBe('blocked')
  })

  it('lists moderation queue', async () => {
    const queue = await CommunityService.listModerationQueue(10)
    expect(Array.isArray(queue.posts)).toBe(true)
    expect(Array.isArray(queue.comments)).toBe(true)
  })
})

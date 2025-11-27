import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { CRMService } from '@/lib/services/crm-service'
import { getMongoDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

describe('CRMService', () => {
  let testUserId: string

  beforeAll(async () => {
    const db = await getMongoDb()
    const users = db.collection('users')
    const result = await users.insertOne({
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
    })
    testUserId = result.insertedId.toString()
  })

  afterAll(async () => {
    const db = await getMongoDb()
    await db.collection('users').deleteOne({ _id: new ObjectId(testUserId) })
    await db.collection('crm_notes').deleteMany({ userId: testUserId })
    await db.collection('crm_tasks').deleteMany({ relatedUserId: testUserId })
  })

  describe('createNote', () => {
    it('should add a note to a user', async () => {
      const note = await CRMService.createNote({
        userId: testUserId,
        content: 'Test note',
        authorId: 'admin123',
        authorName: 'Admin User',
      })

      expect(note).toBeDefined()
      expect(note._id).toBeDefined()
    })
  })

  describe('createTask', () => {
    it('should create a task for a user', async () => {
      const task = await CRMService.createTask({
        assigneeId: 'admin123',
        assigneeName: 'Admin User',
        type: 'check_in',
        title: 'Follow up',
        description: 'Check in with user',
        priority: 'medium',
        dueDate: new Date(Date.now() + 86400000), // tomorrow
        relatedUserId: testUserId,
      })

      expect(task).toBeDefined()
      expect(task._id).toBeDefined()
    })
  })

  describe('getMemberProfile', () => {
    it('should retrieve user profile with notes and tasks', async () => {
      const profile = await CRMService.getMemberProfile(testUserId)

      expect(profile).toBeDefined()
      expect(profile.user).toBeDefined()
      expect(profile.notes).toBeDefined()
      expect(profile.tasks).toBeDefined()
      expect(Array.isArray(profile.notes)).toBe(true)
      expect(Array.isArray(profile.tasks)).toBe(true)
    })
  })

  describe('searchMembers', () => {
    it('should find users by email', async () => {
      const results = await CRMService.searchMembers({
        query: 'test@example.com',
      })

      expect(results).toBeDefined()
      expect(Array.isArray(results.members)).toBe(true)
      expect(results.members.length).toBeGreaterThan(0)
    })
  })
})

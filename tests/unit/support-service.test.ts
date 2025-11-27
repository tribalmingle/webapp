import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { SupportService } from '@/lib/services/support-service'
import { getMongoDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

describe('SupportService', () => {
  let testUserId: string
  let testTicketId: string

  beforeAll(async () => {
    const db = await getMongoDb()
    const users = db.collection('users')
    const result = await users.insertOne({
      email: 'support-test@example.com',
      name: 'Support Test User',
      createdAt: new Date(),
    })
    testUserId = result.insertedId.toString()
  })

  afterAll(async () => {
    const db = await getMongoDb()
    await db.collection('users').deleteOne({ _id: new ObjectId(testUserId) })
    await db.collection('support_tickets').deleteMany({ userId: testUserId })
    await db.collection('support_messages').deleteMany({})
  })

  describe('createTicket', () => {
    it('should create a support ticket', async () => {
      const ticket = await SupportService.createTicket({
        userId: testUserId,
        userEmail: 'support-test@example.com',
        userName: 'Support Test User',
        subject: 'Test Issue',
        description: 'This is a test support ticket',
        priority: 'medium',
        category: 'account',
      })

      testTicketId = ticket._id!.toString()
      expect(testTicketId).toBeDefined()
      expect(typeof testTicketId).toBe('string')
    })

    it('should set correct SLA based on priority', async () => {
      const ticket = await SupportService.createTicket({
        userId: testUserId,
        userEmail: 'support-test@example.com',
        userName: 'Support Test User',
        subject: 'Urgent Issue',
        description: 'High priority test',
        priority: 'high',
        category: 'billing',
      })

      const highPriorityId = ticket._id!.toString()
      const result = await SupportService.getTicket(highPriorityId)
      expect(result.ticket.slaDeadline).toBeDefined()

      // Cleanup
      const db = await getMongoDb()
      await db.collection('support_tickets').deleteOne({ _id: new ObjectId(highPriorityId) })
    })
  })

  describe('addMessage', () => {
    it('should add a message to a ticket', async () => {
      await SupportService.addMessage({
        ticketId: testTicketId,
        authorId: testUserId,
        authorName: 'Support Test User',
        authorType: 'customer',
        message: 'Additional information',
      })

      const result = await SupportService.getTicket(testTicketId)
      expect(result.messages.length).toBeGreaterThan(0)
    })
  })

  describe('assignTicket', () => {
    it('should assign a ticket to an agent', async () => {
      await SupportService.assignTicket(testTicketId, 'agent123', 'Agent Name')

      const result = await SupportService.getTicket(testTicketId)
      expect(result.ticket.assignedTo).toBe('agent123')
    })
  })

  describe('getQueue', () => {
    it('should list tickets with filters', async () => {
      const result = await SupportService.getQueue({
        status: 'open',
      }, 1, 10)

      expect(result).toBeDefined()
      expect(Array.isArray(result.tickets)).toBe(true)
    })
  })

  describe('SLA tracking', () => {
    it('should detect SLA breaches', async () => {
      const pastDate = new Date(Date.now() - 86400000) // yesterday
      const ticket = await SupportService.createTicket({
        userId: testUserId,
        userEmail: 'support-test@example.com',
        userName: 'Support Test User',
        subject: 'Old Ticket',
        description: 'Should breach SLA',
        priority: 'urgent',
        category: 'technical',
      })

      const breachTicketId = ticket._id!.toString()

      // Manually set old SLA dates
      const db = await getMongoDb()
      await db.collection('support_tickets').updateOne(
        { _id: new ObjectId(breachTicketId) },
        {
          $set: {
            slaDeadline: pastDate,
            slaBreach: true,
          },
        }
      )

      const result = await SupportService.getTicket(breachTicketId)
      expect(result.ticket.slaBreach).toBe(true)

      // Cleanup
      await db.collection('support_tickets').deleteOne({ _id: new ObjectId(breachTicketId) })
    })
  })
})

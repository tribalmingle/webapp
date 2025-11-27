// Using global Jest types (no direct @jest/globals import needed)
import { SegmentationService } from '@/lib/services/growth-service'
import { getMongoDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

let userIds: string[] = []
let segmentId: string

describe('SegmentationService', () => {
  beforeAll(async () => {
    const db = await getMongoDb()
    const users = db.collection('users')
    const bulk = []
    for (let i = 0; i < 10; i++) {
      bulk.push({
        email: `segtest${i}@example.com`,
        name: `Seg Test ${i}`,
        lastActiveDays: i * 5,
        signupDays: i,
        createdAt: new Date(),
      })
    }
    const res = await users.insertMany(bulk)
    userIds = Object.values(res.insertedIds).map(id => id.toString())
    segmentId = await SegmentationService.createSegment({
      name: 'Inactive > 20d',
      description: 'Users inactive more than 20 days',
      filters: [
        { field: 'lastActiveDays', operator: 'greater_than', value: 20 }
      ],
    })
  })

  afterAll(async () => {
    const db = await getMongoDb()
    await db.collection('users').deleteMany({ email: /segtest/ })
    await db.collection('segments').deleteOne({ _id: new ObjectId(segmentId) })
  })

  it('evaluates segment and caches member IDs', async () => {
    const members = await SegmentationService.evaluateSegment(segmentId)
    expect(members.length).toBeGreaterThan(0)
    const again = await SegmentationService.evaluateSegment(segmentId)
    expect(again.length).toBe(members.length)
  })

  it('returns member count from cached evaluation', async () => {
    const count = await SegmentationService.getMemberCount(segmentId)
    expect(count).toBeGreaterThan(0)
  })
})

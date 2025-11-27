// Using global Jest types (no direct @jest/globals import needed)
import { CampaignService, SegmentationService } from '@/lib/services/growth-service'
import { getMongoDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

let segmentId: string
let campaignId: string

describe('CampaignService', () => {
  beforeAll(async () => {
    const db = await getMongoDb()
    const users = db.collection('users')
    await users.insertOne({ email: 'camp1@example.com', createdAt: new Date() })
    const segName = 'All Users Segment'
    segmentId = await SegmentationService.createSegment({
      name: segName,
      filters: [],
    })
    campaignId = await CampaignService.createCampaign({
      name: 'Welcome Blast',
      segmentId: new ObjectId(segmentId),
      type: 'email',
      status: 'draft',
      content: { body: 'Hello World!' },
      schedule: { startDate: new Date() },
    })
  })

  afterAll(async () => {
    const db = await getMongoDb()
    await db.collection('campaigns').deleteOne({ _id: new ObjectId(campaignId) })
    await db.collection('segments').deleteOne({ _id: new ObjectId(segmentId) })
    await db.collection('users').deleteMany({ email: 'camp1@example.com' })
  })

  it('creates campaign with initial stats', async () => {
    const db = await getMongoDb()
    const campaign = await db.collection('campaigns').findOne({ _id: new ObjectId(campaignId) })
    expect(campaign?.stats?.sent).toBe(0)
  })

  it('schedules campaign and updates status', async () => {
    await CampaignService.scheduleCampaign(campaignId)
    const db = await getMongoDb()
    const updated = await db.collection('campaigns').findOne({ _id: new ObjectId(campaignId) })
    expect(updated?.status).toBe('scheduled')
  })

  it('increments campaign stats', async () => {
    await CampaignService.updateStats(campaignId, 'sent')
    const db = await getMongoDb()
    const updated = await db.collection('campaigns').findOne({ _id: new ObjectId(campaignId) })
    expect(updated?.stats?.sent).toBe(1)
  })
})

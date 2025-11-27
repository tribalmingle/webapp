import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/db/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'
import { redisCacheGet, redisCacheSet } from '@/lib/redis/client'

export type SegmentFilter = {
  field: string
  operator: string
  value: any
}

export type Segment = {
  _id?: ObjectId
  name: string
  description?: string
  filters: SegmentFilter[]
  createdAt: Date
  updatedAt: Date
  memberCount?: number
  lastEvaluated?: Date
}

export type Campaign = {
  _id?: ObjectId
  name: string
  segmentId: ObjectId
  type: 'email' | 'push' | 'sms'
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused'
  content: {
    subject?: string
    body: string
    cta?: string
    ctaUrl?: string
  }
  schedule: {
    startDate: Date
    endDate?: Date
    timezone?: string
  }
  stats: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    converted: number
  }
  createdAt: Date
  updatedAt: Date
}

export class SegmentationService {
  /**
   * Create a new user segment
   */
  static async createSegment(segment: Omit<Segment, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const segments = await getCollection(COLLECTIONS.SEGMENTS)
    
    const doc = {
      ...segment,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await segments.insertOne(doc)
    return result.insertedId.toString()
  }

  /**
   * Evaluate segment filters and return matching user IDs
   */
  static async evaluateSegment(segmentId: string): Promise<string[]> {
    const cacheKey = `segment:members:${segmentId}`
    const cached = await redisCacheGet<string[]>(cacheKey)
    if (cached) return cached
    const segments = await getCollection<Segment>(COLLECTIONS.SEGMENTS)
    const segment = await segments.findOne({ _id: new ObjectId(segmentId) })

    if (!segment) {
      throw new Error('Segment not found')
    }

    // Build MongoDB query from filters
    const query: any = {}
    segment.filters.forEach(filter => {
      switch (filter.operator) {
        case 'equals':
          query[filter.field] = filter.value
          break
        case 'not_equals':
          query[filter.field] = { $ne: filter.value }
          break
        case 'contains':
          query[filter.field] = { $regex: filter.value, $options: 'i' }
          break
        case 'greater_than':
          query[filter.field] = { $gt: filter.value }
          break
        case 'less_than':
          query[filter.field] = { $lt: filter.value }
          break
        case 'in':
          query[filter.field] = { $in: Array.isArray(filter.value) ? filter.value : [filter.value] }
          break
      }
    })

    const users = await getCollection(COLLECTIONS.USERS)
    const matchingUsers = await users.find(query).project({ _id: 1 }).toArray()

    const memberIds = matchingUsers.map(u => u._id.toString())
    // Update segment with member count
    await segments.updateOne(
      { _id: new ObjectId(segmentId) },
      { 
        $set: { 
          memberCount: memberIds.length,
          lastEvaluated: new Date(),
        },
      }
    )
    await redisCacheSet(cacheKey, memberIds, 300) // 5 min TTL
    return memberIds
  }

  /**
   * Get member count for a segment (cached)
   */
  static async getMemberCount(segmentId: string): Promise<number> {
    const segments = await getCollection<Segment>(COLLECTIONS.SEGMENTS)
    const segment = await segments.findOne({ _id: new ObjectId(segmentId) })
    if (!segment) throw new Error('Segment not found')
    if (segment.memberCount !== undefined) return segment.memberCount
    const ids = await this.evaluateSegment(segmentId)
    return ids.length
  }

  /**
   * List all segments
   */
  static async listSegments(): Promise<Segment[]> {
    const segments = await getCollection<Segment>(COLLECTIONS.SEGMENTS)
    return await segments.find().sort({ updatedAt: -1 }).toArray()
  }

  /**
   * Update segment
   */
  static async updateSegment(segmentId: string, updates: Partial<Segment>): Promise<void> {
    const segments = await getCollection(COLLECTIONS.SEGMENTS)
    await segments.updateOne(
      { _id: new ObjectId(segmentId) },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date(),
        },
      }
    )
  }

  /**
   * Delete segment
   */
  static async deleteSegment(segmentId: string): Promise<void> {
    const segments = await getCollection(COLLECTIONS.SEGMENTS)
    await segments.deleteOne({ _id: new ObjectId(segmentId) })
  }
}

export class CampaignService {
  /**
   * Create a new campaign
   */
  static async createCampaign(campaign: Omit<Campaign, '_id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<string> {
    const campaigns = await getCollection(COLLECTIONS.CAMPAIGNS)
    
    const doc = {
      ...campaign,
      stats: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await campaigns.insertOne(doc)
    return result.insertedId.toString()
  }

  /**
   * Schedule a campaign for execution
   */
  static async scheduleCampaign(campaignId: string): Promise<void> {
    const campaigns = await getCollection<Campaign>(COLLECTIONS.CAMPAIGNS)
    const campaign = await campaigns.findOne({ _id: new ObjectId(campaignId) })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    // Get segment members
    const userIds = await SegmentationService.evaluateSegment(campaign.segmentId.toString())

    // Update campaign status
    await campaigns.updateOne(
      { _id: new ObjectId(campaignId) },
      { 
        $set: { 
          status: 'scheduled',
          updatedAt: new Date(),
        },
      }
    )

    // TODO: Queue campaign messages with BullMQ
    // For now, just log
    console.log(`Campaign ${campaignId} scheduled for ${userIds.length} users`)
  }

  /**
   * Get campaign metrics
   */
  static async getCampaignMetrics(campaignId: string): Promise<Campaign['stats']> {
    const campaigns = await getCollection<Campaign>(COLLECTIONS.CAMPAIGNS)
    const campaign = await campaigns.findOne({ _id: new ObjectId(campaignId) })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    return campaign.stats || {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
    }
  }

  /**
   * Update campaign stats
   */
  static async updateStats(campaignId: string, stat: keyof Campaign['stats']): Promise<void> {
    const campaigns = await getCollection(COLLECTIONS.CAMPAIGNS)
    await campaigns.updateOne(
      { _id: new ObjectId(campaignId) },
      { 
        $inc: { [`stats.${stat}`]: 1 },
        $set: { updatedAt: new Date() },
      }
    )
  }

  /**
   * List all campaigns
   */
  static async listCampaigns(): Promise<Campaign[]> {
    const campaigns = await getCollection<Campaign>(COLLECTIONS.CAMPAIGNS)
    return await campaigns.find().sort({ createdAt: -1 }).toArray()
  }

  /**
   * Update campaign
   */
  static async updateCampaign(campaignId: string, updates: Partial<Campaign>): Promise<void> {
    const campaigns = await getCollection(COLLECTIONS.CAMPAIGNS)
    await campaigns.updateOne(
      { _id: new ObjectId(campaignId) },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date(),
        },
      }
    )
  }

  /**
   * Pause/resume campaign
   */
  static async toggleCampaign(campaignId: string): Promise<void> {
    const campaigns = await getCollection<Campaign>(COLLECTIONS.CAMPAIGNS)
    const campaign = await campaigns.findOne({ _id: new ObjectId(campaignId) })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    const newStatus = campaign.status === 'active' ? 'paused' : 'active'
    await campaigns.updateOne(
      { _id: new ObjectId(campaignId) },
      { 
        $set: { 
          status: newStatus,
          updatedAt: new Date(),
        },
      }
    )
  }
}

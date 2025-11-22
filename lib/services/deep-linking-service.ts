/**
 * Deep Linking Service
 * Custom Branch.io replacement for short URLs and attribution tracking
 */

import { getCollection } from '../db/mongodb';
import { COLLECTIONS, ShortLink, LinkClick } from '../db/collections';
import { customAlphabet } from 'nanoid';

// Generate short codes (URL-safe, 6 characters)
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

export class DeepLinkingService {
  /**
   * Create a new short link
   */
  static async createShortLink(params: {
    targetUrl: string;
    createdBy?: string;
    metadata?: ShortLink['metadata'];
    expiresInDays?: number;
  }): Promise<ShortLink> {
    const code = nanoid();
    const now = new Date();
    
    const shortLink: ShortLink = {
      code,
      targetUrl: params.targetUrl,
      createdBy: params.createdBy,
      createdAt: now,
      expiresAt: params.expiresInDays 
        ? new Date(now.getTime() + params.expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
      metadata: params.metadata,
      clickCount: 0,
      isActive: true,
    };

    const collection = await getCollection<ShortLink>(COLLECTIONS.SHORT_LINKS);
    await collection.insertOne(shortLink);
    
    return shortLink;
  }

  /**
   * Get short link by code
   */
  static async getShortLink(code: string): Promise<ShortLink | null> {
    const collection = await getCollection<ShortLink>(COLLECTIONS.SHORT_LINKS);
    return collection.findOne({ 
      code, 
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    });
  }

  /**
   * Track a link click
   */
  static async trackClick(params: {
    linkCode: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    referer?: string;
  }): Promise<void> {
    const now = new Date();

    // Record click
    const click: LinkClick = {
      linkCode: params.linkCode,
      clickedAt: now,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      referer: params.referer,
      userId: params.userId,
      device: this.parseUserAgent(params.userAgent),
    };

    const clicksCollection = await getCollection<LinkClick>(COLLECTIONS.LINK_CLICKS);
    await clicksCollection.insertOne(click);

    // Update link stats
    const linksCollection = await getCollection<ShortLink>(COLLECTIONS.SHORT_LINKS);
    await linksCollection.updateOne(
      { code: params.linkCode },
      { 
        $inc: { clickCount: 1 },
        $set: { lastClickedAt: now }
      }
    );
  }

  /**
   * Get link analytics
   */
  static async getLinkAnalytics(code: string) {
    const [link, clicks] = await Promise.all([
      this.getShortLink(code),
      getCollection<LinkClick>(COLLECTIONS.LINK_CLICKS)
        .find({ linkCode: code })
        .toArray()
    ]);

    if (!link) {
      return null;
    }

    return {
      link,
      totalClicks: clicks.length,
      uniqueUsers: new Set(clicks.filter(c => c.userId).map(c => c.userId)).size,
      clicksByDay: this.groupClicksByDay(clicks),
      topReferrers: this.getTopReferrers(clicks),
      deviceBreakdown: this.getDeviceBreakdown(clicks),
    };
  }

  /**
   * Parse user agent to detect device type
   */
  private static parseUserAgent(userAgent?: string) {
    if (!userAgent) return undefined;

    const ua = userAgent.toLowerCase();
    let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';

    if (/mobile|android|iphone/.test(ua)) {
      type = 'mobile';
    } else if (/tablet|ipad/.test(ua)) {
      type = 'tablet';
    }

    return { type };
  }

  private static groupClicksByDay(clicks: LinkClick[]) {
    const grouped: Record<string, number> = {};
    clicks.forEach(click => {
      const day = click.clickedAt.toISOString().split('T')[0];
      grouped[day] = (grouped[day] || 0) + 1;
    });
    return grouped;
  }

  private static getTopReferrers(clicks: LinkClick[], limit = 10) {
    const referrers: Record<string, number> = {};
    clicks.forEach(click => {
      if (click.referer) {
        referrers[click.referer] = (referrers[click.referer] || 0) + 1;
      }
    });
    return Object.entries(referrers)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([referer, count]) => ({ referer, count }));
  }

  private static getDeviceBreakdown(clicks: LinkClick[]) {
    const devices: Record<string, number> = { mobile: 0, tablet: 0, desktop: 0 };
    clicks.forEach(click => {
      const type = click.device?.type || 'desktop';
      devices[type]++;
    });
    return devices;
  }
}

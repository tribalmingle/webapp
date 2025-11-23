/**
 * MongoDB Collections Registry
 * Centralized collection names and types for TribalMingle
 */

// Existing Collections
export const COLLECTIONS = {
  USERS: 'users',
  MESSAGES: 'messages',
  CHAT_THREADS: 'chat_threads',
  LIKES: 'likes',
  PROFILE_VIEWS: 'profile_views',
  
  // New: Deep Linking System
  SHORT_LINKS: 'short_links',
  LINK_CLICKS: 'link_clicks',
  
  // New: Analytics System  
  ANALYTICS_EVENTS: 'analytics_events',
  USER_SESSIONS: 'user_sessions',
  FUNNELS: 'funnels',
  
} as const;

// Short Link Document
export interface ShortLink {
  _id?: string;
  code: string; // Short code (e.g., 'abc123')
  targetUrl: string; // Full URL to redirect to
  createdBy?: string; // User ID who created it
  createdAt: Date;
  expiresAt?: Date;
  metadata?: {
    title?: string;
    description?: string;
    image?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    [key: string]: any;
  };
  clickCount: number;
  lastClickedAt?: Date;
  isActive: boolean;
}

// Link Click Document (for attribution tracking)
export interface LinkClick {
  _id?: string;
  linkCode: string;
  clickedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  referer?: string;
  userId?: string; // If user is logged in
  geo?: {
    country?: string;
    city?: string;
    region?: string;
  };
  device?: {
    type?: 'mobile' | 'tablet' | 'desktop';
    os?: string;
    browser?: string;
  };
}

// Analytics Event Document
export interface AnalyticsEvent {
  _id?: string;
  eventType: string; // 'page_view', 'click', 'signup', 'match', etc.
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  properties?: {
    page?: string;
    referrer?: string;
    [key: string]: any;
  };
  context?: {
    userAgent?: string;
    ip?: string;
    locale?: string;
    timezone?: string;
  };
}

export interface ChatThreadPreferences {
  userId: string
  filters: {
    unreadOnly: boolean
    verifiedOnly: boolean
    translatorOnly: boolean
    query: string
  }
  updatedAt: Date
}

// User Session Document
export interface UserSession {
  _id?: string;
  sessionId: string;
  userId?: string;
  startTime: Date;
  lastActivityAt: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  events: string[]; // Array of event IDs
  entryPage?: string;
  exitPage?: string;
  deviceInfo?: {
    type?: 'mobile' | 'tablet' | 'desktop';
    os?: string;
    browser?: string;
  };
}

// Funnel Document (predefined conversion funnels)
export interface Funnel {
  _id?: string;
  name: string;
  description?: string;
  steps: Array<{
    name: string;
    eventType: string;
    order: number;
  }>;
  createdAt: Date;
  isActive: boolean;
}

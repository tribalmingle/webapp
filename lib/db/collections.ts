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
  NOTIFICATIONS: 'notifications',
  
  // New: Deep Linking System
  SHORT_LINKS: 'short_links',
  LINK_CLICKS: 'link_clicks',
  
  // New: Analytics System  
  ANALYTICS_EVENTS: 'analytics_events',
  USER_SESSIONS: 'user_sessions',
  FUNNELS: 'funnels',
  
  // Phase 8: Admin Studio Collections
  CRM_NOTES: 'crm_notes',
  CRM_TASKS: 'crm_tasks',
  SUPPORT_TICKETS: 'support_tickets',
  SUPPORT_MESSAGES: 'support_messages',
  CANNED_RESPONSES: 'canned_responses',
  TRUST_REPORTS: 'trust_reports',
  MODERATION_ACTIONS: 'moderation_actions',
  PHOTO_VERIFICATION_SESSIONS: 'photo_verification_sessions',
  SEGMENTS: 'segments',
  CAMPAIGNS: 'campaigns',
  FEATURE_FLAGS: 'feature_flags',
  SUBSCRIPTIONS: 'subscriptions',
  PAYMENTS: 'payments',
  AUDIT_LOGS: 'audit_logs',
  DATA_BREACHES: 'data_breaches',
  PERFORMANCE_METRICS: 'performance_metrics',
  
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

// Chat Message Document (Phase 5 extensions)
export interface ChatMessage {
  _id?: string;
  senderId: string;
  receiverId: string;
  threadId?: string;
  content: string;
  type?: 'text' | 'voice' | 'image' | 'video' | 'gift';
  status: 'sent' | 'delivered' | 'read' | 'recalled' | 'failed';
  createdAt: Date;
  updatedAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  recalledAt?: Date;
  expiresAt?: Date; // For disappearing messages
  
  // Phase 5: Attachments
  attachments?: Array<{
    type: 'audio' | 'image' | 'video' | 'document';
    s3Key: string;
    duration?: number; // For audio/video
    waveform?: number[]; // For audio visualization
    locale?: string;
    moderationStatus?: 'pending' | 'approved' | 'rejected';
    moderationFlags?: string[];
  }>;
  
  // Phase 5: Translation state
  translationState?: {
    [locale: string]: {
      text: string;
      translatedAt: Date;
      provider: string;
    };
  };
  
  // Phase 5: Safety flags
  safetyFlags?: {
    hasFinancialInfo?: boolean;
    hasExternalLink?: boolean;
    hasSensitiveContent?: boolean;
    riskScore?: number;
    flaggedAt?: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
  };
}

// Chat Thread Document (Phase 5 extensions)
export interface ChatThread {
  _id?: string;
  participantIds: string[];
  lastMessageId?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Phase 5: Folder assignment
  folder?: 'spark' | 'active' | 'snoozed' | 'trust';
  snoozedUntil?: Date;
  
  // Metadata
  unreadCount?: { [userId: string]: number };
  isArchived?: boolean;
  isPinned?: boolean;
  preferences?: {
    translatorEnabled?: boolean;
    disappearingMessages?: number; // seconds, 0 = disabled
  };
}


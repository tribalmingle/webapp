# Tribal Mingle - API Routes Directory

**Generated**: December 26, 2025  
**Source**: `app/api/` directory structure  
**Total Routes**: 39+ API modules

---

## 📂 API Directory Structure

Below is the complete directory structure of all available API routes in the Tribal Mingle backend:

```
app/api/
├── account/              → Account management APIs
├── admin/                → Admin dashboard & management
├── analytics/            → Analytics tracking & reporting
├── auth/                 → Authentication (login, signup, password reset)
├── boosts/               → Profile boosts & spotlight bidding
├── chat/                 → Real-time chat & conversations
├── community/            → Community posts, forums, clubs
├── concierge/            → Concierge service for premium users
├── create-test-user/     → Development utility (create test users)
├── cron/                 → Background jobs & scheduled tasks
├── dashboard/            → User dashboard stats & data
├── debug/                → Debug utilities (development only)
├── discover/             → Discovery queue & user recommendations
├── events/               → Community events, RSVPs, tickets
├── gamification/         → XP, achievements, quests, leaderboards
├── gifts/                → Virtual gifts system
├── graphql/              → GraphQL API endpoint
├── guaranteed-dating/    → $50 guaranteed dating service
├── guardian-invites/     → Family approval portal invites
├── interactions/         → User interactions tracking
├── likes/                → Likes, super likes, mutual likes
├── links/                → Magic links & deep linking
├── marketing/            → Marketing campaigns & landing pages
├── matches/              → Match generation & management
├── messages/             → Direct messaging system
├── migrations/           → Database migrations
├── onboarding/           → User onboarding flow
├── payments/             → Payment processing (Stripe)
├── profile/              → Profile management & updates
├── quests/               → Gamification quests system
├── referrals/            → Referral program & rewards
├── subscription/         → Premium subscriptions
├── test-db/              → Database testing utilities
├── testimonials/         → User testimonials & reviews
├── trust/                → Safety features (report, block)
├── upload/               → File upload (photos, videos)
├── users/                → User creation & management
├── wallet/               → Credits & wallet system
└── webhooks/             → External webhooks (Stripe, etc.)
```

---

## 🔑 Authentication Module (`/api/auth`)

### Available Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration (alias to /api/users)
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/passkey/register` - Register passkey
- `POST /api/auth/passkey/authenticate` - Login with passkey

**Description**: Handles all authentication flows including email/password, magic links, passkeys, and password recovery.

---

## 👤 Users Module (`/api/users`)

### Available Endpoints
- `POST /api/users` - Create new user (registration)
- `GET /api/users/:userId` - Get user profile by ID
- `PUT /api/users/:userId` - Update user profile
- `DELETE /api/users/:userId` - Delete user account
- `GET /api/users/discover` - Get discovery queue with filters
- `GET /api/users/search` - Search users by criteria
- `GET /api/users/online` - Get currently online users
- `PUT /api/users/:userId/verify` - Verify user (admin only)

**Description**: User management, profile viewing, and discovery endpoints.

---

## 💬 Chat & Messaging (`/api/chat`, `/api/messages`)

### Chat Module
- `GET /api/chat/conversations` - Get all conversations
- `GET /api/chat/conversation/:userId` - Get conversation with specific user
- `POST /api/chat/conversation` - Start new conversation
- `DELETE /api/chat/conversation/:userId` - Delete conversation
- `PUT /api/chat/conversation/:userId/mute` - Mute conversation
- `PUT /api/chat/conversation/:userId/unmute` - Unmute conversation

### Messages Module
- `GET /api/messages/:userId` - Get messages with user
- `POST /api/messages/send` - Send message
- `PUT /api/messages/:messageId/read` - Mark as read
- `DELETE /api/messages/:messageId` - Delete message
- `POST /api/messages/voice` - Send voice message
- `POST /api/messages/media` - Send media (photo/video)

**Description**: Real-time messaging system with support for text, voice, and media messages.

---

## ❤️ Likes & Matches (`/api/likes`, `/api/matches`)

### Likes Module
- `POST /api/likes/like` - Like a user
- `POST /api/likes/unlike` - Unlike a user
- `POST /api/likes/super-like` - Send super like
- `GET /api/likes/i-liked` - Users I liked
- `GET /api/likes/liked-me` - Users who liked me
- `GET /api/likes/mutual` - Mutual likes (matches)
- `POST /api/likes/pass` - Pass on user
- `POST /api/likes/rewind` - Undo last action

### Matches Module
- `GET /api/matches` - Get all matches
- `GET /api/matches/today` - Get today's matches
- `GET /api/matches/:matchId` - Get match details
- `DELETE /api/matches/:matchId` - Unmatch user
- `POST /api/matches/ai-opener` - Generate AI conversation starter

**Description**: Like/match system with super likes, rewind feature, and AI-powered conversation starters.

---

## 👁️ Profile & Interactions (`/api/profile`, `/api/interactions`)

### Profile Module
- `GET /api/profile` - Get my profile
- `PUT /api/profile/update` - Update profile
- `POST /api/profile/photos` - Add photos
- `DELETE /api/profile/photos/:photoId` - Delete photo
- `PUT /api/profile/photos/order` - Reorder photos
- `POST /api/profile/views` - Track profile view
- `GET /api/profile/views` - Get my profile views
- `GET /api/profile/visibility` - Get visibility settings
- `PUT /api/profile/visibility` - Update visibility

### Interactions Module
- `GET /api/interactions` - Get all interactions
- `POST /api/interactions/track` - Track interaction
- `GET /api/interactions/summary` - Get interaction summary

**Description**: Profile management and tracking of profile views and user interactions.

---

## 📊 Dashboard & Analytics (`/api/dashboard`, `/api/analytics`)

### Dashboard Module
- `GET /api/dashboard/stats` - Get user stats
- `GET /api/dashboard/activity` - Get recent activity
- `GET /api/dashboard/insights` - Get AI insights
- `GET /api/dashboard/recommendations` - Get recommendations

### Analytics Module
- `POST /api/analytics/event` - Track analytics event
- `GET /api/analytics/funnel` - Get funnel data
- `GET /api/analytics/cohorts` - Get cohort analysis
- `POST /api/analytics/conversion` - Track conversion event

**Description**: User dashboard data and analytics tracking.

---

## 💳 Subscriptions & Payments (`/api/subscription`, `/api/payments`)

### Subscription Module
- `GET /api/subscription/status` - Get subscription status
- `POST /api/subscription/upgrade` - Upgrade plan
- `POST /api/subscription/cancel` - Cancel subscription
- `POST /api/subscription/resume` - Resume cancelled subscription
- `GET /api/subscription/history` - Payment history
- `GET /api/subscription/plans` - Get available plans
- `POST /api/subscription/trial` - Start trial

### Payments Module
- `POST /api/payments/intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/methods` - Get saved payment methods
- `POST /api/payments/method` - Add payment method
- `DELETE /api/payments/method/:id` - Remove payment method

**Description**: Premium subscription management and payment processing via Stripe.

---

## 💍 Guaranteed Dating (`/api/guaranteed-dating`)

### Available Endpoints
- `POST /api/guaranteed-dating/request` - Submit guaranteed dating request
- `GET /api/guaranteed-dating/status` - Get request status
- `PUT /api/guaranteed-dating/preferences` - Update preferences
- `POST /api/guaranteed-dating/refund` - Request refund
- `PUT /api/guaranteed-dating/feedback` - Submit feedback
- `POST /api/guaranteed-dating/reschedule` - Reschedule date

**Description**: Premium $50 service that guarantees a curated match within 30 days.

---

## 🚀 Boosts & Spotlight (`/api/boosts`)

### Available Endpoints
- `GET /api/boosts/summary` - Get boost status & history
- `POST /api/boosts/activate` - Activate profile boost
- `GET /api/boosts/windows` - Get spotlight windows
- `POST /api/boosts/bid` - Place spotlight bid
- `GET /api/boosts/current` - Get current boost status
- `GET /api/boosts/history` - Get boost history

**Description**: Profile boost features and spotlight auction system.

---

## 📝 Dating Tips (`/api/dating-tips`)

### Available Endpoints
- `GET /api/dating-tips` - Get all dating tips (paginated)
- `GET /api/dating-tips/:id` - Get single tip
- `GET /api/dating-tips/categories` - Get categories
- `GET /api/dating-tips/featured` - Get featured tips
- `POST /api/dating-tips/:id/like` - Like tip
- `POST /api/dating-tips/:id/share` - Track share

**Description**: Blog/educational content about dating advice and tips.

---

## 🎁 Referrals & Rewards (`/api/referrals`)

### Available Endpoints
- `GET /api/referrals/progress` - Get referral stats
- `GET /api/referrals/code` - Get my referral code
- `POST /api/referrals/invite` - Send referral invite
- `GET /api/referrals/history` - Get referral history
- `POST /api/referrals/validate` - Validate referral code
- `POST /api/referrals/claim-reward` - Claim referral reward

**Description**: Referral program with rewards and tracking.

---

## 🎉 Events (`/api/events`)

### Available Endpoints
- `GET /api/events` - Get upcoming events
- `GET /api/events/:eventId` - Get event details
- `POST /api/events/:eventId/rsvp` - RSVP to event
- `DELETE /api/events/:eventId/rsvp` - Cancel RSVP
- `GET /api/events/my-events` - Get my RSVPs
- `POST /api/events/create` - Create event (premium)
- `PUT /api/events/:eventId` - Update event (organizer)

**Description**: Community events system with RSVP tracking.

---

## 🛡️ Trust & Safety (`/api/trust`)

### Available Endpoints
- `POST /api/trust/report` - Report user
- `POST /api/trust/block` - Block user
- `POST /api/trust/unblock` - Unblock user
- `GET /api/trust/blocked` - Get blocked users list
- `GET /api/trust/reports` - Get my reports (admin)
- `PUT /api/trust/report/:id/resolve` - Resolve report (admin)

**Description**: Safety features including reporting, blocking, and moderation.

---

## 🔔 Notifications (`/api/notifications`)

### Available Endpoints
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `POST /api/notifications/device-token` - Register device token
- `PUT /api/notifications/preferences` - Update notification preferences

**Description**: Push notification management and preferences.

---

## 💰 Wallet & Credits (`/api/wallet`)

### Available Endpoints
- `GET /api/wallet/balance` - Get credit balance
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/purchase` - Purchase credits
- `POST /api/wallet/spend` - Spend credits
- `POST /api/wallet/refund` - Request refund
- `GET /api/wallet/packages` - Get credit packages

**Description**: Virtual currency system for in-app purchases and rewards.

---

## 🎮 Gamification (`/api/gamification`, `/api/quests`)

### Gamification Module
- `GET /api/gamification/profile` - Get gamification profile
- `GET /api/gamification/achievements` - Get achievements
- `GET /api/gamification/leaderboard` - Get leaderboard
- `POST /api/gamification/xp` - Award XP

### Quests Module
- `GET /api/quests` - Get available quests
- `GET /api/quests/active` - Get active quests
- `POST /api/quests/:id/start` - Start quest
- `POST /api/quests/:id/complete` - Complete quest
- `GET /api/quests/:id/progress` - Get quest progress

**Description**: Gamification features with XP, achievements, quests, and leaderboards.

---

## 👥 Community (`/api/community`)

### Available Endpoints
- `GET /api/community/posts` - Get community posts
- `POST /api/community/posts` - Create post
- `GET /api/community/posts/:id` - Get post details
- `POST /api/community/posts/:id/like` - Like post
- `POST /api/community/posts/:id/comment` - Comment on post
- `DELETE /api/community/posts/:id` - Delete post
- `GET /api/community/clubs` - Get clubs
- `POST /api/community/clubs/:id/join` - Join club

**Description**: Community features including posts, clubs, and forums.

---

## 🎁 Gifts (`/api/gifts`)

### Available Endpoints
- `GET /api/gifts` - Get available gifts
- `POST /api/gifts/send` - Send gift to user
- `GET /api/gifts/received` - Get received gifts
- `GET /api/gifts/sent` - Get sent gifts

**Description**: Virtual gift sending system.

---

## 🏠 Guardian Portal (`/api/guardian-invites`)

### Available Endpoints
- `POST /api/guardian-invites/send` - Send guardian invite
- `GET /api/guardian-invites/:token` - Get invite details
- `POST /api/guardian-invites/:token/accept` - Accept invite
- `PUT /api/guardian-invites/:token/approval` - Grant/deny approval

**Description**: Family approval portal for culturally-appropriate matchmaking.

---

## 👔 Concierge Service (`/api/concierge`)

### Available Endpoints
- `POST /api/concierge/request` - Request concierge service
- `GET /api/concierge/requests` - Get my requests
- `PUT /api/concierge/request/:id/feedback` - Submit feedback

**Description**: Premium concierge dating service.

---

## 🔧 Admin Module (`/api/admin`)

### Available Endpoints
- `POST /api/admin/login` - Admin login
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - Get all users (paginated)
- `PUT /api/admin/users/:id/verify` - Verify user
- `PUT /api/admin/users/:id/suspend` - Suspend user
- `PUT /api/admin/users/:id/ban` - Ban user
- `GET /api/admin/guaranteed-dating/requests` - Get GD requests
- `POST /api/admin/guaranteed-dating/match` - Create manual match
- `GET /api/admin/reports` - Get all reports
- `PUT /api/admin/reports/:id/resolve` - Resolve report
- `GET /api/admin/analytics` - System analytics
- `POST /api/admin/broadcast` - Send broadcast message

**Description**: Admin dashboard and management tools.

---

## 📤 File Upload (`/api/upload`)

### Available Endpoints
- `POST /api/upload` - Upload file (photos, videos, voice)
- `POST /api/upload/multiple` - Upload multiple files
- `GET /api/upload/signed-url` - Get signed upload URL
- `DELETE /api/upload/:fileId` - Delete file

**Description**: File upload handling for photos, videos, and voice messages.

---

## 🔄 Webhooks (`/api/webhooks`)

### Available Endpoints
- `POST /api/webhooks/stripe` - Stripe payment webhooks
- `POST /api/webhooks/twilio` - Twilio SMS webhooks
- `POST /api/webhooks/sendgrid` - Email delivery webhooks

**Description**: External service webhook handlers.

---

## 📱 Onboarding (`/api/onboarding`)

### Available Endpoints
- `GET /api/onboarding/progress` - Get onboarding progress
- `POST /api/onboarding/step` - Complete onboarding step
- `PUT /api/onboarding/skip` - Skip optional step
- `POST /api/onboarding/complete` - Complete onboarding

**Description**: User onboarding flow tracking.

---

## 🔗 Links & Deep Linking (`/api/links`)

### Available Endpoints
- `POST /api/links/magic-link` - Generate magic link
- `POST /api/links/deep-link` - Generate deep link
- `GET /api/links/resolve/:token` - Resolve link token

**Description**: Magic link authentication and deep linking.

---

## 🧪 Development Utilities

### Create Test User (`/api/create-test-user`)
- `POST /api/create-test-user` - Create test user with preset data

### Test DB (`/api/test-db`)
- `GET /api/test-db/connection` - Test database connection
- `POST /api/test-db/seed` - Seed test data

### Debug (`/api/debug`)
- `GET /api/debug/logs` - Get application logs
- `GET /api/debug/env` - Check environment variables
- `POST /api/debug/clear-cache` - Clear application cache

**Note**: These are for development only and should be disabled in production.

---

## 🔄 Background Jobs (`/api/cron`)

### Available Endpoints
- `POST /api/cron/match-generation` - Trigger match generation
- `POST /api/cron/email-digest` - Send email digests
- `POST /api/cron/cleanup` - Run cleanup tasks
- `POST /api/cron/analytics` - Update analytics snapshots

**Description**: Scheduled background jobs and cron tasks.

---

## 🌐 Marketing (`/api/marketing`)

### Available Endpoints
- `GET /api/marketing/landing-page` - Get landing page content
- `POST /api/marketing/subscribe` - Subscribe to newsletter
- `POST /api/marketing/contact` - Contact form submission
- `GET /api/marketing/testimonials` - Get testimonials

**Description**: Marketing website APIs.

---

## 📊 GraphQL (`/api/graphql`)

### Available Endpoints
- `POST /api/graphql` - GraphQL endpoint
- `GET /api/graphql` - GraphQL playground (dev only)

**Description**: GraphQL API for advanced queries (alternative to REST).

---

## 📝 Summary

**Total API Modules**: 39+  
**Total Endpoints**: 200+  
**Authentication**: JWT Bearer Token  
**Response Format**: JSON  
**Rate Limiting**: Yes (100 req/min default)

### Key Features Covered
✅ Authentication & User Management  
✅ Discovery & Matching  
✅ Real-time Chat & Messaging  
✅ Likes, Views, & Interactions  
✅ Premium Subscriptions  
✅ Guaranteed Dating Service  
✅ Boosts & Spotlight  
✅ Dating Tips Blog  
✅ Events & Community  
✅ Referrals & Rewards  
✅ Gamification  
✅ Safety & Trust  
✅ Admin Dashboard  
✅ Push Notifications  
✅ File Uploads  
✅ Payment Processing  

---

**For detailed endpoint documentation, see `API_ENDPOINTS.md`**

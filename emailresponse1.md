# Tribal Mingle Mobile App - Complete Backend Specifications

**To:** Mobile Dev Team  
**From:** Backend Engineering  
**Date:** December 31, 2025  
**Subject:** RE: API Access & Specs for React Native Rebuild

---

## 📋 Executive Summary

Happy New Year! Welcome to the Tribal Mingle backend ecosystem. This document provides everything you need to integrate your React Native app with our production-ready API infrastructure. We're building a world-class, tribe-centric dating platform to rival Bumble, Hinge, and Tinder.

**Current Status:**
- ✅ 95% of features implemented across 10 development phases
- ✅ Core APIs battle-tested and production-ready
- ⚠️ Payment providers (Stripe, Apple/Google Pay) - credentials pending
- ⚠️ SMS verification (Twilio) - credentials pending
- ✅ MongoDB Atlas, Resend Email, LaunchDarkly configured

---

## 1. Environment Configuration & Base URLs

### 1.1 Environments

| Environment | Base URL | Status | Purpose |
|-------------|----------|--------|---------|
| **Development** | `http://localhost:3000` | ✅ Active | Local development |
| **Staging** | `https://tribalmingle-staging.vercel.app` | 🚧 Pending | Pre-production testing |
| **Production** | `https://tribalmingle.vercel.app` | ✅ Active | Live production |

### 1.2 Required Headers

All authenticated requests must include:

```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
X-Client-Platform: mobile-ios | mobile-android
X-Client-Version: <app-version>
X-Device-ID: <unique-device-identifier>
```

**Optional Headers:**
```http
X-Request-ID: <uuid> (for request tracing)
X-Timezone: <IANA timezone> (e.g., Africa/Lagos)
X-Locale: en | fr | pt | ar
```

### 1.3 Authentication Flow

#### JWT Token Structure
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "roles": ["user"],
  "iat": 1672531200,
  "exp": 1673136000
}
```

**Token Lifecycle:**
- **Expiration:** 7 days from issuance
- **Refresh:** Auto-refresh when <24h remaining (use `/api/auth/refresh`)
- **Storage:** Secure storage only (iOS Keychain, Android Keystore)

---

## 2. Test Credentials

### 2.1 Standard Test Users

#### Premium User (Active Subscription)
```json
{
  "email": "premium.user@tribalmingle.test",
  "password": "Test123!Premium",
  "userId": "507f1f77bcf86cd799439011",
  "features": [
    "unlimited_likes",
    "super_likes",
    "boosts",
    "rewind",
    "see_who_liked",
    "advanced_filters",
    "incognito_mode"
  ],
  "subscription": {
    "plan": "premium_plus",
    "status": "active",
    "expiresAt": "2026-12-31T23:59:59Z"
  }
}
```

#### Free Tier User
```json
{
  "email": "free.user@tribalmingle.test",
  "password": "Test123!Free",
  "userId": "507f1f77bcf86cd799439012",
  "features": [
    "daily_likes_quota_50",
    "basic_filters"
  ],
  "subscription": {
    "plan": "free",
    "status": "active"
  }
}
```

#### Admin User
```json
{
  "email": "profmendel@gmail.com",
  "password": "Gig@50chinedu",
  "userId": "admin_507f1f77bcf86cd799439013",
  "roles": ["admin", "moderator", "user"],
  "adminDashboard": "https://tribalmingle.vercel.app/admin"
}
```

#### Playwright Test User (Auto-mocked)
```json
{
  "email": "playwright@example.com",
  "password": "any-password",
  "userId": "507f1f77bcf86cd799439012",
  "note": "Returns mocked responses for CI/CD testing"
}
```

---

## 3. Core API Endpoints

### 3.1 Authentication & Onboarding

#### POST `/api/auth/signup`
Create new user account.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "dateOfBirth": "1995-03-15",
  "gender": "male"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "newuser@example.com",
    "name": "John Doe",
    "registrationComplete": false,
    "registrationStep": 1
  },
  "redirectTo": "/sign-up?step=2"
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Email already registered",
  "code": "AUTH_EMAIL_EXISTS"
}
```

---

#### POST `/api/auth/signin`
Authenticate existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "username": "john_doe_abc123",
    "age": 29,
    "tribe": "Yoruba",
    "registrationComplete": true,
    "verified": true,
    "subscriptionPlan": "premium_plus"
  },
  "redirectTo": "/dashboard-spa"
}
```

**Error (401):**
```json
{
  "success": false,
  "error": "Invalid email or password",
  "code": "AUTH_INVALID_CREDENTIALS"
}
```

---

#### POST `/api/auth/forgot-password`
Initiate password reset flow.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

#### GET `/api/auth/me`
Get current authenticated user profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "username": "john_doe_abc123",
    "age": 29,
    "tribe": "Yoruba",
    "location": "Lagos, Nigeria",
    "profilePhoto": "https://media.tribalmingle.com/profiles/abc123.jpg",
    "verified": true,
    "subscriptionPlan": "premium_plus"
  }
}
```

---

#### POST `/api/onboarding/verify-phone`
Send OTP to phone number.

**Request:**
```json
{
  "phone": "+2348012345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "verificationId": "VE123456789"
}
```

---

#### PUT `/api/onboarding/verify-phone`
Verify OTP code.

**Request:**
```json
{
  "phone": "+2348012345678",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Phone verified successfully",
  "verified": true
}
```

---

### 3.2 Discovery & Matching

#### GET `/api/discover`
Get personalized discovery feed.

**Query Parameters:**
```
?mode=swipe                    # swipe | story
&recipeId=default              # saved filter recipe ID
&verifiedOnly=true             # boolean
&onlineNow=false               # boolean
&faithPractice=Christian       # optional
&lifeGoals=marriage,family     # comma-separated
&travelMode=home               # home | passport
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "mode": "swipe",
    "filters": {
      "verifiedOnly": true,
      "travelMode": "home",
      "onlineNow": false
    },
    "candidates": [
      {
        "candidateId": "507f1f77bcf86cd799439022",
        "matchScore": 0.92,
        "profile": {
          "name": "Joy Adeyemi",
          "age": 27,
          "tribe": "Igbo",
          "location": {
            "city": "Lagos",
            "country": "Nigeria"
          },
          "bio": "Software engineer | Love Lagos jazz nights | Guardian-approved 🌟",
          "profilePhotos": [
            "https://media.tribalmingle.com/profiles/joy_1.jpg",
            "https://media.tribalmingle.com/profiles/joy_2.jpg"
          ],
          "trustBadges": ["Verified ID & Selfie", "Guardian Approved"],
          "verified": true
        },
        "scoreBreakdown": {
          "compatibility": 0.90,
          "culture": 0.95,
          "intent": 0.88
        },
        "conciergePrompt": "Share your guardian-approved ritual stories.",
        "aiOpener": "Hi Joy! We both love Lagos jazz nights—what's your go-to venue?"
      }
    ],
    "storyPanels": [
      {
        "candidateId": "507f1f77bcf86cd799439022",
        "contextPanel": "Joy is co-hosting a guardian circle in Lagos next week."
      }
    ],
    "recipes": [
      {
        "id": "default",
        "name": "Concierge picks",
        "isDefault": true
      }
    ],
    "telemetry": {
      "generatedAt": "2025-12-31T15:30:00Z",
      "total": 42
    }
  }
}
```

---

#### GET `/api/discover/recipes`
List saved discovery filter recipes.

**Response (200):**
```json
{
  "success": true,
  "recipes": [
    {
      "id": "recipe_abc123",
      "name": "Verified & Online",
      "filters": {
        "verifiedOnly": true,
        "onlineNow": true
      },
      "isDefault": true,
      "lastUsedAt": "2025-12-30T10:00:00Z"
    }
  ]
}
```

---

#### POST `/api/discover/recipes`
Save new discovery filter recipe.

**Request:**
```json
{
  "name": "My Custom Filter",
  "filters": {
    "verifiedOnly": true,
    "faithPractice": "Christian",
    "lifeGoals": ["marriage"]
  },
  "isDefault": false
}
```

**Response (201):**
```json
{
  "success": true,
  "recipe": {
    "id": "recipe_def456",
    "name": "My Custom Filter",
    "filters": { /* ... */ },
    "isDefault": false
  }
}
```

---

### 3.3 Likes & Interactions

#### POST `/api/interactions/like`
Like a user profile.

**Request:**
```json
{
  "targetUserId": "507f1f77bcf86cd799439022",
  "source": "discover_swipe"
}
```

**Response (200):**
```json
{
  "success": true,
  "match": true,
  "matchId": "match_abc123",
  "message": "It's a match! You can now start chatting."
}
```

**Response (200 - No Match):**
```json
{
  "success": true,
  "match": false,
  "message": "Like sent successfully"
}
```

**Error (429 - Rate Limit):**
```json
{
  "success": false,
  "error": "Daily like quota exceeded",
  "code": "LIKE_QUOTA_EXCEEDED",
  "quotaReset": "2025-12-32T00:00:00Z"
}
```

---

#### POST `/api/interactions/super-like`
Send a super like (premium feature).

**Request:**
```json
{
  "targetUserId": "507f1f77bcf86cd799439022",
  "message": "I think we'd really connect!"
}
```

**Response (200):**
```json
{
  "success": true,
  "superLikeId": "sl_abc123",
  "remainingSuperLikes": 4
}
```

**Error (402):**
```json
{
  "success": false,
  "error": "No super likes remaining",
  "code": "SUPER_LIKE_QUOTA_EXCEEDED",
  "upgradePrompt": "Upgrade to Premium for unlimited super likes"
}
```

---

#### POST `/api/interactions/rewind`
Undo last swipe (premium feature).

**Request:**
```json
{}
```

**Response (200):**
```json
{
  "success": true,
  "rewindedUserId": "507f1f77bcf86cd799439022",
  "remainingRewinds": 2
}
```

---

#### GET `/api/likes/liked-me`
Get list of users who liked you.

**Response (200):**
```json
{
  "success": true,
  "likes": [
    {
      "userId": "507f1f77bcf86cd799439033",
      "name": "Ada Okafor",
      "profilePhoto": "https://media.tribalmingle.com/profiles/ada_1.jpg",
      "age": 26,
      "tribe": "Igbo",
      "location": "Abuja, Nigeria",
      "likedAt": "2025-12-30T18:22:00Z",
      "matchScore": 0.88,
      "blurred": true  // true for free users
    }
  ],
  "total": 12,
  "unseenCount": 3
}
```

---

#### GET `/api/likes/i-liked`
Get list of users you liked.

**Response (200):**
```json
{
  "success": true,
  "likes": [
    {
      "userId": "507f1f77bcf86cd799439044",
      "name": "Chinwe Nwosu",
      "profilePhoto": "https://media.tribalmingle.com/profiles/chinwe_1.jpg",
      "likedAt": "2025-12-29T14:10:00Z",
      "status": "pending"  // pending | matched | expired
    }
  ],
  "total": 8
}
```

---

### 3.4 Matches & Messaging

#### GET `/api/matches`
Get all matches.

**Response (200):**
```json
{
  "success": true,
  "matches": [
    {
      "matchId": "match_abc123",
      "userId": "507f1f77bcf86cd799439055",
      "name": "Blessing Eze",
      "profilePhoto": "https://media.tribalmingle.com/profiles/blessing_1.jpg",
      "age": 28,
      "tribe": "Igbo",
      "matchedAt": "2025-12-30T12:00:00Z",
      "lastMessage": {
        "content": "Hi! Nice to match with you 😊",
        "sentAt": "2025-12-30T12:05:00Z",
        "sentByMe": false,
        "read": false
      },
      "unreadCount": 2
    }
  ],
  "total": 15
}
```

---

#### GET `/api/messages/conversations`
Get all message threads.

**Response (200):**
```json
{
  "success": true,
  "conversations": [
    {
      "conversationId": "conv_abc123",
      "userId": "507f1f77bcf86cd799439055",
      "name": "Blessing Eze",
      "profilePhoto": "https://media.tribalmingle.com/profiles/blessing_1.jpg",
      "lastMessage": {
        "content": "See you at the event!",
        "sentAt": "2025-12-30T20:15:00Z",
        "sentByMe": true
      },
      "unreadCount": 0,
      "status": "active"  // active | archived | blocked
    }
  ]
}
```

---

#### GET `/api/messages/{userId}`
Get messages with specific user.

**Response (200):**
```json
{
  "success": true,
  "messages": [
    {
      "messageId": "msg_abc123",
      "senderId": "507f1f77bcf86cd799439011",
      "recipientId": "507f1f77bcf86cd799439055",
      "content": "Hi! How are you?",
      "contentType": "text",  // text | voice | image | video | gift | location
      "sentAt": "2025-12-30T12:05:00Z",
      "deliveredAt": "2025-12-30T12:05:10Z",
      "readAt": "2025-12-30T12:06:00Z",
      "status": "read"  // sent | delivered | read
    }
  ],
  "total": 25,
  "hasMore": true
}
```

---

#### POST `/api/messages/send`
Send a message.

**Request:**
```json
{
  "recipientId": "507f1f77bcf86cd799439055",
  "content": "Hey! How was your day?",
  "contentType": "text"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": {
    "messageId": "msg_def456",
    "sentAt": "2025-12-30T21:00:00Z",
    "status": "sent"
  }
}
```

---

#### POST `/api/chat/livekit-token`
Generate token for video/audio call.

**Request:**
```json
{
  "roomName": "call_abc123",
  "participantId": "507f1f77bcf86cd799439055"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roomUrl": "wss://livekit.tribalmingle.com/call_abc123"
}
```

---

### 3.5 Boosts & Spotlight

#### GET `/api/boosts/window`
Get current boost auction window.

**Response (200):**
```json
{
  "success": true,
  "window": {
    "windowId": "window_2025123120",
    "startsAt": "2025-12-31T20:00:00Z",
    "endsAt": "2025-12-31T21:00:00Z",
    "minimumBid": 10,
    "currentHighestBid": 25,
    "totalSlots": 50,
    "availableSlots": 12
  }
}
```

---

#### POST `/api/boosts/bid`
Submit a boost bid.

**Request:**
```json
{
  "placement": "spotlight",
  "locale": "en-ng",
  "bidAmountCredits": 25,
  "autoRollover": false
}
```

**Response (200):**
```json
{
  "success": true,
  "bid": {
    "sessionId": "session_abc123",
    "status": "pending",
    "auctionWindowStart": "2025-12-31T20:00:00Z",
    "boostStartsAt": "2025-12-31T20:00:00Z",
    "boostEndsAt": "2025-12-31T21:00:00Z",
    "bidAmountCredits": 25,
    "availableCredits": 75
  }
}
```

**Error (402):**
```json
{
  "success": false,
  "error": "Insufficient boost credits",
  "code": "INSUFFICIENT_CREDITS"
}
```

---

#### GET `/api/boosts/strip`
Get boost purchase options.

**Response (200):**
```json
{
  "success": true,
  "packages": [
    {
      "packageId": "boost_1",
      "name": "Single Boost",
      "credits": 1,
      "price": 4.99,
      "currency": "USD"
    },
    {
      "packageId": "boost_5",
      "name": "5 Boosts",
      "credits": 5,
      "price": 19.99,
      "currency": "USD",
      "discount": 20
    }
  ]
}
```

---

### 3.6 Subscriptions & Payments

#### POST `/api/subscription/upgrade`
Upgrade subscription plan.

**Request:**
```json
{
  "plan": "premium_plus"  // premium_plus | guardian | concierge
}
```

**Response (200):**
```json
{
  "success": true,
  "subscription": {
    "subscriptionId": "sub_abc123",
    "plan": "premium_plus",
    "status": "active",
    "startedAt": "2025-12-31T15:00:00Z",
    "expiresAt": "2026-01-31T15:00:00Z",
    "autoRenew": true
  }
}
```

---

#### POST `/api/subscription/cancel`
Cancel subscription.

**Response (200):**
```json
{
  "success": true,
  "message": "Subscription cancelled. You'll retain access until 2026-01-31T15:00:00Z"
}
```

---

#### POST `/api/payments/stripe/intent`
Create Stripe payment intent.

**Request:**
```json
{
  "amount": 1999,
  "currency": "usd",
  "plan": "premium_plus"
}
```

**Response (200):**
```json
{
  "success": true,
  "clientSecret": "pi_abc123_secret_def456",
  "paymentIntentId": "pi_abc123"
}
```

---

#### POST `/api/payments/apple-pay/session`
Create Apple Pay session (iOS only).

**Request:**
```json
{
  "validationURL": "https://apple-pay-gateway.apple.com/..."
}
```

**Response (200):**
```json
{
  "success": true,
  "merchantSession": { /* Apple Pay merchant session */ }
}
```

---

### 3.7 Guaranteed Dating

#### GET `/api/guaranteed-dating/status`
Get user's guaranteed dating request status.

**Response (200):**
```json
{
  "success": true,
  "hasActiveRequest": true,
  "activeRequest": {
    "requestId": "gd_abc123",
    "status": "pending",  // pending | matched | refunded
    "createdAt": "2025-12-30T10:00:00Z",
    "expiresAt": "2026-01-30T10:00:00Z"
  },
  "history": [
    {
      "requestId": "gd_xyz789",
      "status": "matched",
      "createdAt": "2025-11-01T10:00:00Z",
      "matchedAt": "2025-11-15T14:30:00Z"
    }
  ]
}
```

---

#### POST `/api/guaranteed-dating/request`
Submit guaranteed dating request.

**Request:**
```json
{
  "preferences": {
    "minAge": 25,
    "maxAge": 35,
    "tribe": "Yoruba",
    "faithPractice": "Christian"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "request": {
    "requestId": "gd_abc123",
    "status": "pending",
    "expiresAt": "2026-01-30T10:00:00Z"
  }
}
```

---

#### POST `/api/guaranteed-dating/refund`
Request refund for guaranteed dating.

**Request:**
```json
{
  "requestId": "gd_abc123",
  "reason": "No match found within 30 days"
}
```

**Response (200):**
```json
{
  "success": true,
  "refund": {
    "refundId": "ref_abc123",
    "amount": 9999,
    "currency": "usd",
    "status": "processing",
    "estimatedCompletion": "2026-01-05T00:00:00Z"
  }
}
```

---

### 3.8 Referrals

#### POST `/api/referrals/invite`
Generate referral code.

**Request:**
```json
{
  "customCode": "JOHN2025"  // optional
}
```

**Response (201):**
```json
{
  "success": true,
  "referral": {
    "code": "JOHN2025",
    "shareUrl": "https://tribalmingle.com/join/JOHN2025",
    "qrCode": "data:image/png;base64,iVBORw0KGgo...",
    "expiresAt": "2026-12-31T23:59:59Z"
  }
}
```

---

#### GET `/api/referrals/progress`
Get referral stats and rewards.

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalReferrals": 12,
    "activeReferrals": 8,
    "totalEarned": 24.50,
    "currency": "USD",
    "tier": "advocate",  // starter | advocate | ambassador
    "nextTierAt": 25
  },
  "recentReferrals": [
    {
      "userId": "507f1f77bcf86cd799439066",
      "name": "Ada Okafor",
      "joinedAt": "2025-12-28T10:00:00Z",
      "status": "active",
      "reward": 2.00
    }
  ]
}
```

---

### 3.9 Profile Management

#### GET `/api/profile/views`
Get profile view analytics.

**Response (200):**
```json
{
  "success": true,
  "views": {
    "total": 245,
    "last7Days": 42,
    "last30Days": 168
  },
  "recentViewers": [
    {
      "userId": "507f1f77bcf86cd799439077",
      "name": "Chioma Eze",
      "profilePhoto": "https://media.tribalmingle.com/profiles/chioma_1.jpg",
      "viewedAt": "2025-12-30T19:45:00Z",
      "matchScore": 0.85
    }
  ]
}
```

---

#### PUT `/api/profile/update`
Update user profile.

**Request:**
```json
{
  "bio": "Updated bio text",
  "interests": ["music", "travel", "cooking"],
  "location": "Lagos, Nigeria",
  "tribe": "Yoruba",
  "height": "5'10\"",
  "religion": "Christian"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": { /* updated profile */ }
}
```

---

### 3.10 Admin Endpoints

#### GET `/api/admin/users`
Get all users (admin only).

**Headers:** 
```http
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe",
      "status": "active",  // active | suspended | banned
      "totalMatches": 12,
      "totalMessages": 456,
      "reportCount": 0,
      "subscriptionPlan": "premium_plus",
      "createdAt": "2025-10-01T10:00:00Z"
    }
  ],
  "total": 1547
}
```

---

## 4. Data Models & Validation Rules

### 4.1 User Profile

**Required Fields:**
```typescript
{
  email: string (email format, max 255 chars)
  password: string (min 8 chars, 1 uppercase, 1 number, 1 special)
  name: string (2-50 chars)
  dateOfBirth: string (ISO 8601, must be 18+ years)
  gender: "male" | "female" | "other"
}
```

**Optional Fields:**
```typescript
{
  username: string (3-30 chars, alphanumeric + underscore)
  phone: string (E.164 format, e.g., +2348012345678)
  tribe: string (max 50 chars)
  bio: string (max 500 chars)
  interests: string[] (max 10 items)
  location: string (max 100 chars)
  city: string (max 50 chars)
  country: string (ISO 3166-1 alpha-2)
  maritalStatus: "single" | "divorced" | "widowed"
  height: string (e.g., "5'10\"", "180cm")
  bodyType: "slim" | "athletic" | "average" | "curvy" | "heavyset"
  education: string (max 100 chars)
  occupation: string (max 100 chars)
  religion: string (max 50 chars)
  profilePhotos: string[] (max 10 URLs)
}
```

---

### 4.2 Subscription Plans

```typescript
type SubscriptionPlan = 
  | "free"
  | "premium_plus"    // $19.99/month
  | "guardian"        // $29.99/month
  | "concierge"       // $99.99/month

interface PlanFeatures {
  free: {
    dailyLikes: 50
    superLikesPerDay: 0
    boostsPerMonth: 0
    rewinds: false
    seeWhoLiked: false
    advancedFilters: false
    incognitoMode: false
  }
  premium_plus: {
    dailyLikes: "unlimited"
    superLikesPerDay: 5
    boostsPerMonth: 1
    rewinds: true
    seeWhoLiked: true
    advancedFilters: true
    incognitoMode: true
  }
  guardian: {
    /* extends premium_plus */
    guardianApprovalPortal: true
    familyMatchmaking: true
  }
  concierge: {
    /* extends guardian */
    personalMatchmaker: true
    guaranteedDating: true
    prioritySupport: true
  }
}
```

---

### 4.3 Love Languages (Optional Profile Field)

```typescript
type LoveLanguage = 
  | "words_of_affirmation"
  | "quality_time"
  | "receiving_gifts"
  | "acts_of_service"
  | "physical_touch"

// User can select up to 2 primary love languages
interface LoveLanguagePreference {
  primary: LoveLanguage
  secondary?: LoveLanguage
}
```

---

### 4.4 Cultural Values (Multi-slider)

```typescript
interface CulturalValues {
  spirituality: number      // 0-100
  family: number            // 0-100
  tradition: number         // 0-100
  modernity: number         // 0-100
  communityInvolvement: number  // 0-100
}
```

---

## 5. Error Response Format

All errors follow this consistent structure:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE_CONSTANT",
  "details": {
    "field": "email",
    "reason": "Email format is invalid"
  },
  "traceId": "req_abc123def456"
}
```

### 5.1 Common Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request data |
| 401 | `AUTH_INVALID_CREDENTIALS` | Wrong email/password |
| 401 | `AUTH_TOKEN_EXPIRED` | JWT token expired |
| 401 | `AUTH_TOKEN_INVALID` | Malformed or invalid token |
| 403 | `AUTH_PERMISSION_DENIED` | User lacks required permissions |
| 404 | `USER_NOT_FOUND` | User doesn't exist |
| 404 | `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| 409 | `AUTH_EMAIL_EXISTS` | Email already registered |
| 429 | `LIKE_QUOTA_EXCEEDED` | Daily like limit reached |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 402 | `INSUFFICIENT_CREDITS` | Not enough boost credits |
| 402 | `SUBSCRIPTION_REQUIRED` | Feature requires premium subscription |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error |

---

## 6. File Uploads & Media Assets

### 6.1 Upload Endpoint

**POST `/api/upload`**

**Request (multipart/form-data):**
```
file: <binary file data>
folder: "profile" | "selfie" | "general"
```

**Response (200):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "imageUrl": "https://media.tribalmingle.com/profiles/1704067200-abc123.jpg",
  "filename": "1704067200-abc123.jpg",
  "folder": "profile",
  "path": "/uploads/profile/1704067200-abc123.jpg",
  "size": 2457600
}
```

### 6.2 Upload Constraints

| Property | Value |
|----------|-------|
| **Max File Size** | 50 MB |
| **Accepted Formats** | `image/jpeg`, `image/png`, `image/webp`, `image/heic` |
| **Image Dimensions** | Min: 400x400px, Max: 4000x4000px |
| **Compression** | Auto-optimized to WebP (85% quality) |
| **Storage** | HostGator S3-compatible storage |
| **CDN** | CloudFront (global edge caching) |

### 6.3 Image Processing Pipeline

1. **Upload** → Client sends file to `/api/upload`
2. **Validation** → Check size, format, dimensions
3. **Moderation** → AWS Rekognition (NSFW, violence, minors)
4. **Processing** → Resize, compress, convert to WebP
5. **Storage** → Save to HostGator S3
6. **CDN** → Propagate to CloudFront edge locations
7. **Response** → Return public URL

---

## 7. Real-time & Polling Guidance

### 7.1 Recommended Polling Intervals

| Feature | Interval | Method |
|---------|----------|--------|
| **New Matches** | 30 seconds | Poll `/api/matches` |
| **Unread Messages** | 15 seconds | Poll `/api/messages/conversations` |
| **Boost Window** | 60 seconds | Poll `/api/boosts/window` |
| **Notifications** | 30 seconds | Poll `/api/notifications` |
| **Profile Views** | 5 minutes | Poll `/api/profile/views` |

### 7.2 Polling Implementation

#### 7.2.1 React Native Polling Service

Create a reusable polling service for your React Native app:

```typescript
// services/PollingService.ts
import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface PollingConfig {
  interval: number; // milliseconds
  enabled: boolean;
  onlyWhenActive?: boolean; // Only poll when app is active
  immediateFirstPoll?: boolean;
}

export const usePolling = (
  callback: () => Promise<void>,
  config: PollingConfig
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isPollingRef = useRef(false);

  const { interval, enabled, onlyWhenActive = true, immediateFirstPoll = true } = config;

  const poll = useCallback(async () => {
    // Prevent concurrent polls
    if (isPollingRef.current) return;

    // Check if we should poll based on app state
    if (onlyWhenActive && appStateRef.current !== 'active') {
      return;
    }

    try {
      isPollingRef.current = true;
      await callback();
    } catch (error) {
      console.error('Polling error:', error);
    } finally {
      isPollingRef.current = false;
    }
  }, [callback, onlyWhenActive]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Execute immediately on first mount if configured
    if (immediateFirstPoll) {
      poll();
    }

    // Set up interval
    intervalRef.current = setInterval(poll, interval);

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appStateRef.current = nextAppState;

      // Resume polling when app becomes active
      if (nextAppState === 'active' && onlyWhenActive) {
        poll();
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
    };
  }, [enabled, interval, poll, onlyWhenActive, immediateFirstPoll]);
};
```

---

#### 7.2.2 Messages Polling Hook

```typescript
// hooks/useMessagesPolling.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePolling } from '../services/PollingService';
import { AuthService } from '../services/AuthService';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

interface Conversation {
  conversationId: string;
  userId: string;
  name: string;
  profilePhoto: string;
  lastMessage: {
    content: string;
    sentAt: string;
    sentByMe: boolean;
  };
  unreadCount: number;
  status: 'active' | 'archived' | 'blocked';
}

export const useMessagesPolling = (enabled: boolean = true) => {
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const token = await AuthService.getToken();
      const response = await fetch(`${API_URL}/api/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.conversations as Conversation[];
    },
    staleTime: 15000, // 15 seconds
    enabled,
  });

  // Set up polling
  usePolling(
    async () => {
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    {
      interval: 15000, // 15 seconds
      enabled,
      onlyWhenActive: true,
      immediateFirstPoll: false,
    }
  );

  // Calculate total unread count
  const unreadCount = data?.reduce((acc, conv) => acc + conv.unreadCount, 0) || 0;

  return {
    conversations: data || [],
    unreadCount,
    isLoading,
    error,
  };
};
```

---

#### 7.2.3 Matches Polling Hook

```typescript
// hooks/useMatchesPolling.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePolling } from '../services/PollingService';
import { AuthService } from '../services/AuthService';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

interface Match {
  matchId: string;
  userId: string;
  name: string;
  profilePhoto: string;
  age: number;
  tribe: string;
  matchedAt: string;
  lastMessage?: {
    content: string;
    sentAt: string;
    sentByMe: boolean;
    read: boolean;
  };
  unreadCount: number;
}

export const useMatchesPolling = (enabled: boolean = true) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const token = await AuthService.getToken();
      const response = await fetch(`${API_URL}/api/matches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        matches: result.matches as Match[],
        total: result.total as number,
      };
    },
    staleTime: 30000, // 30 seconds
    enabled,
  });

  // Set up polling
  usePolling(
    async () => {
      await queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    {
      interval: 30000, // 30 seconds
      enabled,
      onlyWhenActive: true,
      immediateFirstPoll: false,
    }
  );

  // Get new matches (matched in last 5 minutes)
  const newMatches = data?.matches.filter((match) => {
    const matchedAt = new Date(match.matchedAt);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return matchedAt > fiveMinutesAgo;
  }) || [];

  return {
    matches: data?.matches || [],
    total: data?.total || 0,
    newMatches,
    isLoading,
    error,
  };
};
```

---

#### 7.2.4 Notifications Polling Hook

```typescript
// hooks/useNotificationsPolling.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePolling } from '../services/PollingService';
import { AuthService } from '../services/AuthService';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

interface Notification {
  notificationId: string;
  type: 'new_match' | 'new_message' | 'like_received' | 'super_like_received' | 'profile_view';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export const useNotificationsPolling = (enabled: boolean = true) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const token = await AuthService.getToken();
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.notifications as Notification[];
    },
    staleTime: 30000, // 30 seconds
    enabled,
  });

  // Track previous notification count to show local notifications
  const previousCountRef = useRef(0);

  // Set up polling
  usePolling(
    async () => {
      const result = await queryClient.fetchQuery({ queryKey: ['notifications'] });
      
      // Show local notification if new notifications arrived
      if (result && Array.isArray(result)) {
        const unreadCount = result.filter((n: Notification) => !n.read).length;
        
        if (unreadCount > previousCountRef.current) {
          const newNotifications = result.slice(0, unreadCount - previousCountRef.current);
          
          // Show local notification for the most recent one
          if (newNotifications.length > 0) {
            const latest = newNotifications[0];
            await Notifications.scheduleNotificationAsync({
              content: {
                title: latest.title,
                body: latest.message,
                data: latest.data,
              },
              trigger: null, // Show immediately
            });
          }
        }
        
        previousCountRef.current = unreadCount;
      }
    },
    {
      interval: 30000, // 30 seconds
      enabled,
      onlyWhenActive: true,
      immediateFirstPoll: false,
    }
  );

  const unreadCount = data?.filter((n) => !n.read).length || 0;

  return {
    notifications: data || [],
    unreadCount,
    isLoading,
    error,
  };
};
```

---

#### 7.2.5 Boost Window Polling Hook

```typescript
// hooks/useBoostWindowPolling.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePolling } from '../services/PollingService';
import { AuthService } from '../services/AuthService';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

interface BoostWindow {
  windowId: string;
  startsAt: string;
  endsAt: string;
  minimumBid: number;
  currentHighestBid: number;
  totalSlots: number;
  availableSlots: number;
}

export const useBoostWindowPolling = (enabled: boolean = true) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['boostWindow'],
    queryFn: async () => {
      const token = await AuthService.getToken();
      const response = await fetch(`${API_URL}/api/boosts/window`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.window as BoostWindow;
    },
    staleTime: 60000, // 60 seconds
    enabled,
  });

  // Set up polling
  usePolling(
    async () => {
      await queryClient.invalidateQueries({ queryKey: ['boostWindow'] });
    },
    {
      interval: 60000, // 60 seconds
      enabled,
      onlyWhenActive: true,
      immediateFirstPoll: false,
    }
  );

  // Calculate time until window starts/ends
  const getTimeStatus = () => {
    if (!data) return null;

    const now = new Date();
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);

    if (now < startsAt) {
      return {
        status: 'upcoming',
        timeUntil: Math.floor((startsAt.getTime() - now.getTime()) / 1000),
      };
    } else if (now >= startsAt && now < endsAt) {
      return {
        status: 'active',
        timeRemaining: Math.floor((endsAt.getTime() - now.getTime()) / 1000),
      };
    } else {
      return {
        status: 'ended',
        timeUntil: null,
      };
    }
  };

  return {
    window: data,
    timeStatus: getTimeStatus(),
    isLoading,
    error,
  };
};
```

---

#### 7.2.6 Combined Polling Manager

Create a central manager to control all polling:

```typescript
// hooks/usePollingManager.ts
import { useEffect, useState } from 'react';
import { useMessagesPolling } from './useMessagesPolling';
import { useMatchesPolling } from './useMatchesPolling';
import { useNotificationsPolling } from './useNotificationsPolling';
import { useBoostWindowPolling } from './useBoostWindowPolling';
import { AppState } from 'react-native';

interface PollingManagerConfig {
  messages?: boolean;
  matches?: boolean;
  notifications?: boolean;
  boostWindow?: boolean;
}

export const usePollingManager = (config: PollingManagerConfig = {}) => {
  const {
    messages: enableMessages = true,
    matches: enableMatches = true,
    notifications: enableNotifications = true,
    boostWindow: enableBoostWindow = false,
  } = config;

  const [isAppActive, setIsAppActive] = useState(true);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setIsAppActive(nextAppState === 'active');
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const messages = useMessagesPolling(enableMessages && isAppActive);
  const matches = useMatchesPolling(enableMatches && isAppActive);
  const notifications = useNotificationsPolling(enableNotifications && isAppActive);
  const boostWindow = useBoostWindowPolling(enableBoostWindow && isAppActive);

  // Total unread count across all features
  const totalUnreadCount = 
    messages.unreadCount + 
    matches.newMatches.length + 
    notifications.unreadCount;

  return {
    messages,
    matches,
    notifications,
    boostWindow,
    totalUnreadCount,
    isAppActive,
  };
};
```

---

#### 7.2.7 Usage Example

```typescript
// screens/HomeScreen.tsx
import React from 'react';
import { View, Text, Badge } from 'react-native';
import { usePollingManager } from '../hooks/usePollingManager';

export const HomeScreen = () => {
  const { 
    messages, 
    matches, 
    notifications, 
    totalUnreadCount 
  } = usePollingManager({
    messages: true,
    matches: true,
    notifications: true,
    boostWindow: false, // Only enable on boost screen
  });

  return (
    <View>
      <Text>Total Unread: {totalUnreadCount}</Text>
      
      {/* Messages */}
      <View>
        <Text>Messages ({messages.unreadCount})</Text>
        {messages.conversations.map((conv) => (
          <View key={conv.conversationId}>
            <Text>{conv.name}</Text>
            {conv.unreadCount > 0 && (
              <Badge value={conv.unreadCount} />
            )}
          </View>
        ))}
      </View>

      {/* Matches */}
      <View>
        <Text>Matches ({matches.total})</Text>
        {matches.newMatches.length > 0 && (
          <Text>🎉 {matches.newMatches.length} new matches!</Text>
        )}
      </View>

      {/* Notifications */}
      <View>
        <Text>Notifications ({notifications.unreadCount})</Text>
        {notifications.notifications.slice(0, 5).map((notif) => (
          <View key={notif.notificationId}>
            <Text>{notif.title}</Text>
            <Text>{notif.message}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
```

---

#### 7.2.8 Polling Best Practices

**1. Stop Polling When Unnecessary:**
```typescript
// Stop polling when user navigates away
const navigation = useNavigation();
const [shouldPoll, setShouldPoll] = useState(true);

useEffect(() => {
  const unsubscribe = navigation.addListener('blur', () => {
    setShouldPoll(false);
  });

  return unsubscribe;
}, [navigation]);
```

**2. Exponential Backoff on Errors:**
```typescript
const usePollingWithBackoff = (callback: () => Promise<void>, baseInterval: number) => {
  const [interval, setInterval] = useState(baseInterval);
  const [errorCount, setErrorCount] = useState(0);

  const pollWithBackoff = async () => {
    try {
      await callback();
      setErrorCount(0);
      setInterval(baseInterval); // Reset on success
    } catch (error) {
      const newErrorCount = errorCount + 1;
      setErrorCount(newErrorCount);
      
      // Exponential backoff: 15s, 30s, 60s, 120s (max)
      const backoffInterval = Math.min(
        baseInterval * Math.pow(2, newErrorCount),
        120000
      );
      setInterval(backoffInterval);
    }
  };

  usePolling(pollWithBackoff, {
    interval,
    enabled: true,
    onlyWhenActive: true,
  });
};
```

**3. Network-Aware Polling:**
```typescript
import NetInfo from '@react-native-community/netinfo';

const useNetworkAwarePolling = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  return isConnected;
};

// In your component
const isConnected = useNetworkAwarePolling();
const { messages } = useMessagesPolling(isConnected);
```

**4. Battery-Aware Polling:**
```typescript
import { AppState } from 'react-native';
import * as Battery from 'expo-battery';

const useBatteryAwarePolling = (normalInterval: number, reducedInterval: number) => {
  const [interval, setInterval] = useState(normalInterval);

  useEffect(() => {
    const checkBattery = async () => {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryState = await Battery.getBatteryStateAsync();

      // If battery is low and not charging, reduce polling frequency
      if (batteryLevel < 0.2 && batteryState !== Battery.BatteryState.CHARGING) {
        setInterval(reducedInterval);
      } else {
        setInterval(normalInterval);
      }
    };

    checkBattery();
    const subscription = Battery.addBatteryLevelListener(checkBattery);

    return () => subscription.remove();
  }, [normalInterval, reducedInterval]);

  return interval;
};
```

---

### 7.3 WebSocket / Push Notifications

**Status:** 🚧 Planned for Phase 2

**Future Implementation:**
- **Socket.IO** for real-time chat
- **OneSignal** for push notifications
- **LiveKit** for video/audio calls (already integrated)

**Current Workaround:**
- Use polling intervals above
- LiveKit tokens available via `/api/chat/livekit-token`

### 7.4 Push Notification Events

When push notification system is live, these events will trigger notifications:

```typescript
type PushNotificationEvent = 
  | "new_match"
  | "new_message"
  | "like_received"
  | "super_like_received"
  | "profile_view"
  | "boost_started"
  | "boost_ended"
  | "subscription_expiring"
  | "event_reminder"
```

---

## 8. Rate Limits & Throttling

### 8.1 Global Rate Limits

| Endpoint Pattern | Limit | Window |
|------------------|-------|--------|
| `/api/auth/*` | 5 requests | 1 minute |
| `/api/interactions/like` | 50 requests | 1 day (free) / unlimited (premium) |
| `/api/interactions/super-like` | 5 requests | 1 day |
| `/api/messages/send` | 100 requests | 1 hour |
| `/api/upload` | 20 requests | 1 hour |
| `/api/admin/*` | 100 requests | 1 minute |
| **All other endpoints** | 200 requests | 1 minute |

### 8.2 Rate Limit Headers

Responses include these headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067800
```

### 8.3 Rate Limit Exceeded Response (429)

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 45,
  "resetAt": "2025-12-31T16:30:00Z"
}
```

---

## 9. Special Business Logic & Prerequisites

### 9.1 Love Language Selection

- **When:** During onboarding (Step 5)
- **Constraint:** User must select 1-2 love languages
- **Validation:** Server rejects if <1 or >2 selected
- **Impact:** Used in matching algorithm (10% weight)

### 9.2 Payment Prerequisites

**Before Charging:**
1. Verify user is not already subscribed to same/higher tier
2. Check for active trial period
3. Validate payment method
4. Create idempotency key to prevent double-charging

**Guaranteed Dating Prerequisites:**
1. User must have `premium_plus` or higher subscription
2. No active guaranteed dating request
3. Profile must be 80%+ complete

### 9.3 Boost Auction Logic

1. **Window Duration:** 1 hour slots (e.g., 8-9 PM peak time)
2. **Minimum Bid:** Dynamic based on demand (typically 10 credits)
3. **Auction Close:** 5 minutes before window start
4. **Winner Selection:** Top 50 bidders get slots
5. **Refunds:** Losing bidders refunded within 1 hour

### 9.4 Match Expiration

- **Free Users:** Matches expire after 24 hours if no message sent
- **Premium Users:** Matches never expire
- **Notification:** Sent at 22 hours, 23 hours, and at expiration

---

## 10. Environment Variables Reference

### 10.1 Required Backend ENV Variables

```bash
# Database
MONGODB_URI=mongodb+srv://tribalmingle_db_user:***@cluster0.waut05d.mongodb.net/tribalmingle
MONGODB_DB=tribalmingle

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024

# Email (Resend)
RESEND_API_KEY=re_7cKnP3va_***

# Feature Flags (LaunchDarkly)
LAUNCHDARKLY_SDK_KEY=sdk-4fc35730-f495-4cae-8e6c-7582aca0fab5
LAUNCHDARKLY_CLIENT_SIDE_ID=675b806fed1489094561e46a

# SMS Verification (Twilio) - CREDENTIALS PENDING
TWILIO_ACCOUNT_SID=<pending>
TWILIO_AUTH_TOKEN=<pending>
TWILIO_VERIFY_SERVICE_SID=<pending>

# Payments (Stripe) - CREDENTIALS PENDING
STRIPE_SECRET_KEY=<pending>
STRIPE_PUBLISHABLE_KEY=<pending>
STRIPE_WEBHOOK_SECRET=<pending>

# Media Storage (HostGator S3)
AWS_REGION=us-east-1
S3_MEDIA_BUCKET=tribalmingle-media-dev

# Real-time Video (LiveKit) - OPTIONAL
LIVEKIT_API_KEY=<optional>
LIVEKIT_API_SECRET=<optional>
LIVEKIT_HOST=<optional>

# Push Notifications (OneSignal) - OPTIONAL
ONESIGNAL_APP_ID=<optional>
ONESIGNAL_REST_API_KEY=<optional>
```

### 10.2 Mobile App Environment Variables

Create a `.env` file in your React Native project:

```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://tribalmingle.vercel.app
EXPO_PUBLIC_API_TIMEOUT=30000

# Feature Flags
EXPO_PUBLIC_LAUNCHDARKLY_CLIENT_ID=675b806fed1489094561e46a

# Payments (Client-side keys)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=<pending>

# Analytics (Optional)
EXPO_PUBLIC_SEGMENT_WRITE_KEY=<optional>
```

---

## 11. API Endpoints Still In Progress

### 11.1 Work-In-Progress Endpoints (Stub/Mock for Now)

These endpoints exist but may return incomplete data:

| Endpoint | Status | ETA | Notes |
|----------|--------|-----|-------|
| `/api/events` | 🟡 Partial | Jan 15 | Event registration works, but virtual lobby incomplete |
| `/api/community/topics` | 🟡 Partial | Jan 20 | Basic posts work, but moderation queue incomplete |
| `/api/gifts/send` | 🟡 Partial | Jan 10 | Gift catalog complete, but delivery animations pending |
| `/api/quests` | 🟢 Complete | ✅ | Fully functional |
| `/api/gamification/state` | 🟢 Complete | ✅ | Fully functional |

### 11.2 Upcoming Features (Not Yet Available)

These will be available in future releases:

- ❌ `/api/ai/coach` - AI dating coach (Phase 11)
- ❌ `/api/travel-mode` - Travel passport feature (Phase 11)
- ❌ `/api/guardian-approval` - Family approval portal (Phase 12)
- ❌ `/api/concierge/matchmaker` - Human matchmaker (Phase 12)

---

## 12. Testing & Debugging Tools

### 12.1 Postman Collection

**Download:** `https://tribalmingle.vercel.app/api/docs/postman.json`

**Pre-configured:**
- All endpoints documented
- Example requests with sample data
- Environment variables for dev/staging/prod
- Authentication flow with auto-token refresh

### 12.2 GraphQL Playground

**URL:** `https://tribalmingle.vercel.app/api/graphql`

**Usage:**
```graphql
query GetUserProfile {
  profile(id: "507f1f77bcf86cd799439011") {
    name
    age
    tribe
    location {
      city
      country
    }
    matchSuggestions(limit: 5) {
      candidateId
      matchScore
      profile {
        name
        age
      }
    }
  }
}
```

### 12.3 Debug Endpoints

#### GET `/api/debug/check-user?email=user@example.com`
Check if user exists and view profile data (dev only).

#### POST `/api/create-test-user`
Generate test user with random data (dev only).

---

## 13. Mobile-Specific Considerations

### 13.1 Deep Linking

**Format:** `tribalmingle://[route]`

**Examples:**
```
tribalmingle://discover
tribalmingle://profile/507f1f77bcf86cd799439011
tribalmingle://chat/507f1f77bcf86cd799439022
tribalmingle://events/event_abc123
tribalmingle://referral/JOHN2025
```

**Implementation:**
```typescript
// iOS: Add to Info.plist
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>tribalmingle</string>
    </array>
  </dict>
</array>

// Android: Add to AndroidManifest.xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="tribalmingle" />
</intent-filter>
```

### 13.2 Biometric Authentication

**Storage:**
- Store JWT token in iOS Keychain / Android Keystore
- Enable biometric unlock after first successful login

**Flow:**
1. User logs in with credentials
2. Save token to secure storage
3. Enable "Use Face ID / Touch ID" option
4. On subsequent launches, authenticate with biometrics
5. Retrieve token from secure storage
6. Validate token with `/api/auth/me`

### 13.3 Background Location (Travel Mode)

**Required Permissions:**
- iOS: `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysUsageDescription`
- Android: `ACCESS_FINE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`

**Implementation:**
```typescript
// Update location when user moves >50km
import * as Location from 'expo-location';

const updateTravelLocation = async () => {
  const location = await Location.getCurrentPositionAsync({});
  await fetch(`${API_URL}/api/profile/update`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      location: {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      }
    })
  });
};
```

### 13.4 Push Notification Device Tokens

**Register device token:**
```typescript
// When user grants notification permission
await fetch(`${API_URL}/api/notifications/device-token`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    deviceToken: expoPushToken,
    platform: Platform.OS,
    deviceId: Constants.deviceId
  })
});
```

---

## 14. Performance Recommendations

### 14.1 Caching Strategy

**Use React Query (or similar) for:**
- User profile: Cache for 5 minutes
- Discovery feed: Cache for 1 minute
- Matches: Cache for 30 seconds
- Messages: No cache (always fresh)

**Example (React Query):**
```typescript
const { data: profile } = useQuery({
  queryKey: ['profile', userId],
  queryFn: () => fetchProfile(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### 14.2 Image Optimization

**Use progressive image loading:**
```typescript
<Image
  source={{ uri: profilePhoto }}
  placeholder={{ blurhash: 'L6PZfSjE.AyE_3t7t7R**0o#DgR4' }}
  contentFit="cover"
  transition={200}
/>
```

**Thumbnail URLs:**
- Original: `https://media.tribalmingle.com/profiles/abc123.jpg`
- Thumbnail (300px): `https://media.tribalmingle.com/profiles/abc123_thumb.jpg`
- Small (600px): `https://media.tribalmingle.com/profiles/abc123_small.jpg`

### 14.3 Pagination

All list endpoints support pagination:

```http
GET /api/matches?page=1&limit=20
GET /api/messages/conversations?page=2&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [ /* results */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 245,
    "totalPages": 13,
    "hasMore": true
  }
}
```

---

## 15. Security Best Practices

### 15.1 Token Storage

**DO:**
- ✅ Use `expo-secure-store` for token storage
- ✅ Enable biometric authentication
- ✅ Clear token on logout
- ✅ Refresh token when <24h remaining

**DON'T:**
- ❌ Store tokens in AsyncStorage
- ❌ Log tokens to console
- ❌ Send tokens in URL query params

### 15.2 API Request Security

**Always:**
```typescript
const response = await fetch(`${API_URL}/api/endpoint`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Client-Platform': Platform.OS,
    'X-Client-Version': Constants.expoConfig?.version,
    'X-Device-ID': Constants.deviceId,
  },
  body: JSON.stringify(data),
});
```

### 15.3 SSL Pinning (Production)

**Recommended for production apps:**
```typescript
// Expo config
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSAppTransportSecurity": {
          "NSPinnedDomains": {
            "tribalmingle.vercel.app": {
              "NSIncludesSubdomains": true,
              "NSPinnedLeafIdentities": [
                {
                  "SPKI-SHA256-PIN": "<certificate-hash>"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

---

## 16. Next Steps & Support

### 16.1 Getting Started Checklist

- [ ] Clone repository / access API docs
- [ ] Set up `.env` file with provided credentials
- [ ] Test authentication with test users
- [ ] Implement discovery feed
- [ ] Integrate likes/matches
- [ ] Build messaging interface
- [ ] Add payment flows (Stripe)
- [ ] Implement push notifications
- [ ] Test on iOS & Android devices

### 16.2 Documentation Links

- **Full API Docs:** [Coming soon - Postman collection]
- **Mobile Screen Inventory:** `/mobile-app-integration/MOBILE_SCREEN_INVENTORY.md`
- **Product Blueprint:** `/PRODUCT_IMPLEMENTATION_BLUEPRINT.md`
- **Admin Dashboard:** `https://tribalmingle.vercel.app/admin`

### 16.3 Support Channels

**For urgent blockers:**
- Email: profmendel@gmail.com
- Expected response time: <2 hours (during work hours)

**For questions:**
- Email with subject: `[Mobile API] Your Question`
- Include: endpoint, request/response, error message, platform (iOS/Android)

**For credentials:**
- Stripe, Twilio, Apple Pay, Google Pay credentials are being obtained
- I'll send separate email with keys as soon as available (ETA: Jan 3-5)

---

## 17. FAQ

### Q: What if a credential is missing?
**A:** Stripe/Twilio/Apple/Google Pay endpoints will return `501 Not Implemented` until credentials are configured. You can stub these in your app with mock responses for now.

### Q: Can I test payments without Stripe?
**A:** Yes, use `POST /api/subscription/upgrade` with test plans. It will upgrade the user without payment processing.

### Q: How do I handle token expiration?
**A:** Check `exp` claim in JWT. If <24h remaining, call `POST /api/auth/refresh` to get new token.

### Q: Is there a sandbox/staging environment?
**A:** Staging environment is being set up. For now, use production with test users.

### Q: What's the matching algorithm?
**A:** Hybrid ML model using cosine similarity on embeddings (60%), cultural heuristics (30%), and behavioral signals (10%).

### Q: How do I report bugs?
**A:** Email with subject `[Bug Report] Brief Description`, include steps to reproduce, platform, and screenshots.

---

## 18. Appendix: Sample Integration Code

### React Native Authentication Service

```typescript
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://tribalmingle.vercel.app';

export class AuthService {
  static async login(email: string, password: string) {
    const response = await fetch(`${API_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Platform': `mobile-${Platform.OS}`,
        'X-Client-Version': Constants.expoConfig?.version || '1.0.0',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    // Store token securely
    await SecureStore.setItemAsync('auth-token', data.token);
    
    return data;
  }

  static async getToken() {
    return await SecureStore.getItemAsync('auth-token');
  }

  static async logout() {
    await SecureStore.deleteItemAsync('auth-token');
  }

  static async refreshToken() {
    const token = await this.getToken();
    if (!token) throw new Error('No token found');

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      await SecureStore.setItemAsync('auth-token', data.token);
      return data.token;
    }

    throw new Error('Token refresh failed');
  }
}
```

### React Query Discovery Hook

```typescript
import { useQuery } from '@tanstack/react-query';
import { AuthService } from './AuthService';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

export const useDiscoveryFeed = (filters?: DiscoveryFilters) => {
  return useQuery({
    queryKey: ['discovery', filters],
    queryFn: async () => {
      const token = await AuthService.getToken();
      
      const params = new URLSearchParams({
        mode: 'swipe',
        ...(filters?.verifiedOnly && { verifiedOnly: 'true' }),
        ...(filters?.onlineNow && { onlineNow: 'true' }),
      });

      const response = await fetch(`${API_URL}/api/discover?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Client-Platform': `mobile-${Platform.OS}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return data.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
};
```

---

**End of Document**

**Version:** 1.0  
**Last Updated:** December 31, 2025  
**Maintained By:** Backend Engineering Team  
**Contact:** profmendel@gmail.com

---

🎉 **Happy coding! Let's build something amazing together.** 🚀

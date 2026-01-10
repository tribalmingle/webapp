# Tribal Mingle - Complete API Endpoints Reference

**Base URL**: `https://tribalmingle.vercel.app/api`  
**Authentication**: JWT Bearer Token  
**Format**: JSON

---

## 🔑 Authentication Endpoints

### Register New User
```http
POST /users
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "dateOfBirth": "1990-05-15",
  "gender": "male",
  "country": "Nigeria",
  "city": "Lagos",
  "primaryTribe": "Igbo"
}

Response 201:
{
  "user": {
    "_id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "subscriptionPlan": "free",
    ...
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response 200:
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>

Response 200:
{
  "user": {
    "_id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "profile": { ... },
    "subscription": { ... }
  }
}
```

### Request Password Reset
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response 200:
{
  "message": "Password reset email sent"
}
```

### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!"
}

Response 200:
{
  "message": "Password updated successfully"
}
```

---

## 👤 User Profile Endpoints

### Get User Profile
```http
GET /users/:userId
Authorization: Bearer <token>

Response 200:
{
  "user": {
    "_id": "user_123",
    "name": "John Doe",
    "age": 34,
    "gender": "male",
    "city": "Lagos",
    "primaryTribe": "Igbo",
    "photos": [
      "https://storage.com/photo1.jpg",
      "https://storage.com/photo2.jpg"
    ],
    "bio": "Software engineer passionate about...",
    "interests": ["Technology", "Travel", "Music"],
    "height": 180,
    "education": "Masters",
    "occupation": "Software Engineer",
    "verified": true,
    "subscriptionPlan": "monthly"
  }
}
```

### Update Profile
```http
PUT /profile/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "bio": "Updated bio text",
  "interests": ["Technology", "Reading", "Fitness"],
  "height": 180,
  "education": "Masters",
  "occupation": "Software Engineer",
  "relationshipGoals": "Long-term relationship"
}

Response 200:
{
  "profile": { ... }
}
```

### Upload Photos
```http
POST /upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
- file: <image_file>
- type: "profile" | "verification"

Response 200:
{
  "url": "https://storage.com/photo_new.jpg",
  "message": "Photo uploaded successfully"
}
```

### Delete User Account
```http
DELETE /users/:userId
Authorization: Bearer <token>

Response 200:
{
  "message": "Account deleted successfully"
}
```

---

## ⚙️ Account & Settings Endpoints

### Get My Account
```http
GET /account
Authorization: Bearer <token>

Response 200:
{
  "account": {
    "_id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "subscriptionPlan": "free",
    "settings": { ... }
  }
}
```

### Update Settings / Preferences
```http
PUT /account/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "distance": 50,              // km
  "ageMin": 21,
  "ageMax": 45,
  "tribes": "Igbo,Yoruba",    // comma-separated list
  "pushNotifications": true,
  "emailUpdates": false,
  "showOnlineStatus": true,
  "readReceipts": true,
  "paused": false
}

Response 200:
{
  "settings": { ... }
}
```

### Get Settings / Preferences
```http
GET /account/settings
Authorization: Bearer <token>

Response 200:
{
  "settings": {
    "distance": 50,
    "ageMin": 21,
    "ageMax": 45,
    "tribes": "Igbo,Yoruba",
    "pushNotifications": true,
    "emailUpdates": false,
    "showOnlineStatus": true,
    "readReceipts": true,
    "paused": false
  }
}
```

### Pause / Resume Account
```http
POST /account/pause
Authorization: Bearer <token>
Content-Type: application/json

{
  "paused": true,            // true to pause, false to resume
  "reason": "taking_a_break" // optional
}

Response 200:
{
  "message": "Account pause state updated",
  "paused": true
}
```

### Delete My Account (alias used by mobile app)
```http
DELETE /account
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "no_longer_needed" // optional
}

Response 200:
{
  "message": "Account deleted successfully"
}
```

---

## 🔍 Discovery & Matching Endpoints

### Get Discovery Queue
```http
GET /users/discover?gender=female&minAge=25&maxAge=35&tribe=Igbo&limit=20
Authorization: Bearer <token>

Query Parameters:
- gender: "male" | "female" | "non-binary"
- minAge: number
- maxAge: number
- tribe: string
- city: string
- verified: boolean
- limit: number (default 20)
- offset: number (for pagination)

Response 200:
{
  "users": [
    {
      "_id": "user_456",
      "name": "Jane Smith",
      "age": 28,
      "photos": ["..."],
      "bio": "...",
      "matchScore": 85
    }
  ],
  "total": 50,
  "hasMore": true
}
```

### Get Today's Matches
```http
GET /matches/today
Authorization: Bearer <token>

Response 200:
{
  "matches": [
    {
      "_id": "match_789",
      "user": {
        "_id": "user_456",
        "name": "Jane Smith",
        ...
      },
      "matchScore": 92,
      "matchReasons": [
        "Same tribe",
        "Similar interests",
        "Close proximity"
      ],
      "createdAt": "2025-12-26T10:00:00Z"
    }
  ]
}
```

### Get All Matches
```http
GET /matches
Authorization: Bearer <token>

Response 200:
{
  "matches": [ ... ]
}
```

---

## ❤️ Likes & Interactions Endpoints

### Like a User
```http
POST /likes/like
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_456",
  "superLike": false
}

Response 200:
{
  "like": { ... },
  "match": {
    "isMatch": true,
    "matchId": "match_123"
  }
}
```

### Unlike a User
```http
POST /likes/unlike
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_456"
}

Response 200:
{
  "message": "Like removed successfully"
}
```

### Get Users I Liked
```http
GET /likes/i-liked
Authorization: Bearer <token>

Response 200:
{
  "likes": [
    {
      "_id": "like_123",
      "user": {
        "_id": "user_456",
        "name": "Jane Smith",
        "photos": ["..."]
      },
      "superLike": false,
      "createdAt": "2025-12-26T10:00:00Z"
    }
  ]
}
```

### Get Users Who Liked Me
```http
GET /likes/liked-me
Authorization: Bearer <token>

Response 200:
{
  "likes": [
    {
      "_id": "like_456",
      "user": {
        "_id": "user_789",
        "name": "Alice Johnson",
        "photos": ["..."],
        "blurred": true  // true for free users
      },
      "superLike": true,
      "createdAt": "2025-12-26T09:00:00Z"
    }
  ],
  "requiresPremium": true  // if any likes are blurred
}
```

### Track Profile View
```http
POST /profile/views
Authorization: Bearer <token>
Content-Type: application/json

{
  "viewedUserId": "user_456"
}

Response 200:
{
  "message": "View tracked"
}
```

### Get My Profile Views
```http
GET /profile/views
Authorization: Bearer <token>

Response 200:
{
  "views": [
    {
      "_id": "view_123",
      "viewer": {
        "_id": "user_789",
        "name": "Alice Johnson",
        "photos": ["..."],
        "blurred": false
      },
      "viewedAt": "2025-12-26T08:00:00Z",
      "duration": 45  // seconds
    }
  ]
}
```

---

## 💬 Chat & Messaging Endpoints

### Get Conversation with User
```http
GET /messages/:userId?limit=50&before=message_id
Authorization: Bearer <token>

Query Parameters:
- limit: number (default 50)
- before: message_id (for pagination)

Response 200:
{
  "messages": [
    {
      "_id": "msg_123",
      "senderId": "user_123",
      "recipientId": "user_456",
      "text": "Hey! How are you?",
      "mediaUrl": null,
      "read": true,
      "createdAt": "2025-12-26T10:30:00Z"
    }
  ],
  "hasMore": false
}
```

### Send Message
```http
POST /messages/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientId": "user_456",
  "text": "Hey! How are you?",
  "mediaUrl": null  // optional
}

Response 201:
{
  "message": {
    "_id": "msg_124",
    "senderId": "user_123",
    "recipientId": "user_456",
    "text": "Hey! How are you?",
    "read": false,
    "createdAt": "2025-12-26T10:31:00Z"
  }
}
```

### Get All Conversations
```http
GET /chat/conversations
Authorization: Bearer <token>

Response 200:
{
  "conversations": [
    {
      "user": {
        "_id": "user_456",
        "name": "Jane Smith",
        "photos": ["..."]
      },
      "lastMessage": {
        "text": "See you tomorrow!",
        "createdAt": "2025-12-26T10:30:00Z"
      },
      "unreadCount": 2
    }
  ]
}
```

### Mark Message as Read
```http
PUT /messages/:messageId/read
Authorization: Bearer <token>

Response 200:
{
  "message": "Message marked as read"
}
```

---

## 📊 Dashboard & Stats Endpoints

### Get Dashboard Stats
```http
GET /dashboard/stats
Authorization: Bearer <token>

Response 200:
{
  "likesCount": 45,
  "viewsCount": 123,
  "matchesCount": 12,
  "messagesCount": 8,
  "profileCompleteness": 85,
  "subscriptionPlan": "free",
  "creditsBalance": 10
}
```

---

## 💳 Subscription & Payment Endpoints

### Get Subscription Status
```http
GET /subscription/status
Authorization: Bearer <token>

Response 200:
{
  "subscription": {
    "plan": "monthly",
    "status": "active",
    "currentPeriodStart": "2025-12-01T00:00:00Z",
    "currentPeriodEnd": "2026-01-01T00:00:00Z",
    "cancelAtPeriodEnd": false,
    "features": [
      "unlimited_likes",
      "see_who_liked_you",
      "advanced_filters",
      "boost_monthly"
    ]
  }
}
```

### Upgrade Subscription
```http
POST /subscription/upgrade
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "monthly",  // "monthly" | "quarterly" | "biannual"
  "paymentMethodId": "pm_stripe_123"
}

Response 200:
{
  "subscription": { ... },
  "invoice": { ... }
}
```

### Cancel Subscription
```http
POST /subscription/cancel
Authorization: Bearer <token>

Response 200:
{
  "subscription": {
    "cancelAtPeriodEnd": true,
    "currentPeriodEnd": "2026-01-01T00:00:00Z"
  }
}
```

### Get Payment History
```http
GET /subscription/history
Authorization: Bearer <token>

Response 200:
{
  "payments": [
    {
      "_id": "pay_123",
      "amount": 1500,  // cents
      "currency": "USD",
      "status": "succeeded",
      "description": "Monthly Subscription",
      "createdAt": "2025-12-01T00:00:00Z"
    }
  ]
}
```

---

## 💍 Guaranteed Dating Endpoints

### Submit Guaranteed Dating Request
```http
POST /guaranteed-dating/request
Authorization: Bearer <token>
Content-Type: application/json

{
  "preferences": {
    "ageRange": { "min": 25, "max": 35 },
    "gender": "female",
    "tribes": ["Igbo", "Yoruba"],
    "city": "Lagos",
    "educationLevel": "Bachelors",
    "occupation": "Professional",
    "relationshipGoals": "Marriage",
    "loveLanguages": ["Quality Time", "Words of Affirmation"],
    "interests": ["Technology", "Travel"],
    "religion": "Christian",
    "height": { "min": 160, "max": 180 },
    "hasChildren": false,
    "wantsChildren": true,
    "additionalNotes": "Looking for someone family-oriented..."
  },
  "paymentMethodId": "pm_stripe_123"
}

Response 201:
{
  "request": {
    "_id": "gd_123",
    "userId": "user_123",
    "status": "pending",
    "amountPaid": 5000,  // cents ($50)
    "preferences": { ... },
    "createdAt": "2025-12-26T10:00:00Z",
    "expiresAt": "2026-01-26T10:00:00Z"
  }
}
```

### Get Request Status
```http
GET /guaranteed-dating/status
Authorization: Bearer <token>

Response 200:
{
  "request": {
    "_id": "gd_123",
    "status": "matched",  // pending | matched | completed | refunded
    "match": {
      "user": {
        "_id": "user_456",
        "name": "Jane Smith",
        "photos": ["..."]
      },
      "venue": {
        "name": "Cafe Neo",
        "address": "Victoria Island, Lagos",
        "date": "2026-01-05T18:00:00Z"
      }
    },
    "daysRemaining": 30
  }
}
```

### Request Refund
```http
POST /guaranteed-dating/refund
Authorization: Bearer <token>
Content-Type: application/json

{
  "requestId": "gd_123",
  "reason": "No suitable match found"
}

Response 200:
{
  "refund": {
    "amount": 5000,
    "status": "processing",
    "estimatedDate": "2025-12-30"
  }
}
```

### Submit Feedback
```http
PUT /guaranteed-dating/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "requestId": "gd_123",
  "rating": 5,
  "feedback": "Great match! We really connected.",
  "wentOnDate": true,
  "continuingRelationship": true
}

Response 200:
{
  "message": "Feedback submitted successfully"
}
```

---

## 📝 Dating Tips (Blog) Endpoints

### Get All Dating Tips
```http
GET /dating-tips?category=dating-advice&limit=10&offset=0
Authorization: Bearer <token> (optional)

Query Parameters:
- category: string
- limit: number (default 10)
- offset: number

Response 200:
{
  "tips": [
    {
      "_id": "tip_123",
      "title": "10 First Date Ideas in Lagos",
      "slug": "first-date-ideas-lagos",
      "excerpt": "Looking for the perfect first date spot...",
      "category": "dating-advice",
      "featuredImage": "https://...",
      "author": "Tribal Mingle Team",
      "readTime": 5,
      "publishedAt": "2025-12-20T00:00:00Z"
    }
  ],
  "total": 50,
  "hasMore": true
}
```

### Get Single Dating Tip
```http
GET /dating-tips/:id
Authorization: Bearer <token> (optional)

Response 200:
{
  "tip": {
    "_id": "tip_123",
    "title": "10 First Date Ideas in Lagos",
    "content": "Full markdown or HTML content here...",
    "category": "dating-advice",
    "featuredImage": "https://...",
    "author": "Tribal Mingle Team",
    "readTime": 5,
    "publishedAt": "2025-12-20T00:00:00Z",
    "relatedTips": [ ... ]
  }
}
```

---

## 🚀 Boosts & Spotlight Endpoints

### Get Boost Summary
```http
GET /boosts/summary
Authorization: Bearer <token>

Response 200:
{
  "currentBoost": {
    "active": true,
    "startTime": "2025-12-26T10:00:00Z",
    "endTime": "2025-12-26T11:00:00Z",
    "minutesRemaining": 45,
    "viewsGained": 127
  },
  "spotlightBids": [
    {
      "_id": "bid_123",
      "windowTime": "2025-12-26T20:00:00Z",
      "bidAmount": 50,
      "status": "winning",
      "currentHighestBid": 45
    }
  ],
  "history": [ ... ]
}
```

### Place Spotlight Bid
```http
POST /boosts/bid
Authorization: Bearer <token>
Content-Type: application/json

{
  "windowTime": "2025-12-26T20:00:00Z",  // Must be a valid spotlight window
  "bidAmount": 50  // Credits
}

Response 200:
{
  "bid": {
    "_id": "bid_124",
    "userId": "user_123",
    "windowTime": "2025-12-26T20:00:00Z",
    "bidAmount": 50,
    "status": "winning",
    "currentHighestBid": 50,
    "createdAt": "2025-12-26T10:00:00Z"
  }
}
```

### Get Available Spotlight Windows
```http
GET /boosts/windows
Authorization: Bearer <token>

Response 200:
{
  "windows": [
    {
      "time": "2025-12-26T20:00:00Z",
      "duration": 60,  // minutes
      "currentHighestBid": 45,
      "minimumBid": 46,
      "totalBids": 3
    }
  ]
}
```

---

## 🎁 Referrals & Rewards Endpoints

### Get Referral Progress
```http
GET /referrals/progress
Authorization: Bearer <token>

Response 200:
{
  "referralCode": "JOHN123",
  "totalReferrals": 5,
  "successfulReferrals": 3,
  "pendingReferrals": 2,
  "rewards": {
    "creditsEarned": 150,
    "freeDaysEarned": 7,
    "nextReward": {
      "referralsNeeded": 2,
      "reward": "30 days free premium"
    }
  },
  "referralHistory": [
    {
      "name": "Jane Smith",
      "signupDate": "2025-12-20T00:00:00Z",
      "status": "active",
      "rewardEarned": "50 credits"
    }
  ]
}
```

### Send Referral Invite
```http
POST /referrals/invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "friend@example.com",

### Activate Boost (on-demand)
```http
POST /boosts/activate
Authorization: Bearer <token>

Response 200:
{
  "active": true,
  "minutesRemaining": 60,
  "viewsGained": 0,
  "expiresAt": "2025-12-26T11:00:00Z"
}
```

---

  // OR
  "phone": "+2348012345678"
}

Response 200:
{
  "message": "Invitation sent successfully"
}
```

---

## 🤝 Concierge Endpoints

### Create Concierge Request
```http
POST /concierge/request
Authorization: Bearer <token>
Content-Type: application/json

{
  "preference": "introvert_in_lagos",
  "notes": "Prefers coffee shops and bookstores"
}

Response 201:
{
  "request": {
    "_id": "concierge_123",
    "status": "pending",
    "preference": "introvert_in_lagos",
    "notes": "Prefers coffee shops and bookstores",
    "createdAt": "2025-12-26T10:00:00Z"
  }
}
```

### Get My Concierge Requests
```http
GET /concierge/requests
Authorization: Bearer <token>

Response 200:
{
  "requests": [
    {
      "_id": "concierge_123",
      "status": "pending",
      "preference": "introvert_in_lagos",
      "notes": "Prefers coffee shops and bookstores",
      "createdAt": "2025-12-26T10:00:00Z"
    }
  ]
}
```

### Get My Referral Code
```http
GET /referrals/code
Authorization: Bearer <token>

Response 200:
{
  "code": "JOHN123",
  "shareUrl": "https://tribalmingle.app/invite/JOHN123"
}
```

---

## 🛡️ Safety & Trust Endpoints

### Report User
```http
POST /trust/report
Authorization: Bearer <token>
Content-Type: application/json

{
  "reportedUserId": "user_456",
  "reason": "inappropriate_content",  // inappropriate_content | harassment | fake_profile | scam | other
  "description": "This user sent inappropriate messages...",
  "evidence": [
    "https://storage.com/screenshot1.jpg"
  ]
}

Response 201:
{
  "report": {
    "_id": "report_123",
    "status": "pending_review",
    "createdAt": "2025-12-26T10:00:00Z"
  }
}
```

### Block User
```http
POST /trust/block
Authorization: Bearer <token>
Content-Type: application/json

{
  "blockedUserId": "user_456"
}

Response 200:
{
  "message": "User blocked successfully"
}
```

### Get Blocked Users
```http
GET /trust/blocked
Authorization: Bearer <token>

Response 200:
{
  "blockedUsers": [
    {
      "_id": "user_456",
      "name": "Blocked User",
      "blockedAt": "2025-12-26T10:00:00Z"
    }
  ],
  "blocked": [ ... ] // alias list for mobile client compatibility
}
```

### Unblock User
```http
POST /trust/unblock
Authorization: Bearer <token>
Content-Type: application/json

{
  "blockedUserId": "user_456"
}

Response 200:
{
  "message": "User unblocked successfully"
}
```

---

## 🔔 Notifications Endpoints

### Get All Notifications
```http
GET /notifications?limit=20&offset=0
Authorization: Bearer <token>

Response 200:
{
  "notifications": [
    {
      "_id": "notif_123",
      "type": "match",
      "title": "New Match! 💕",
      "body": "You matched with Jane Smith!",
      "data": {
        "userId": "user_456",
        "matchId": "match_789"
      },
      "read": false,
      "createdAt": "2025-12-26T10:00:00Z"
    }
  ],
  "unreadCount": 5
}
```

### Mark Notification as Read
```http
PUT /notifications/:notificationId/read
Authorization: Bearer <token>

Response 200:
{
  "message": "Notification marked as read"
}
```

### Mark All as Read
```http
PUT /notifications/read-all
Authorization: Bearer <token>

Response 200:
{
  "message": "All notifications marked as read"
}
```

### Register Device Token (Push Notifications)
```http
POST /notifications/device-token
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "ExponentPushToken[xxxxxxxxxxxxxx]",
  "platform": "ios"  // ios | android
}

Response 200:
{
  "message": "Device token registered"
}
```

### Get/Update Notification Preferences
```http
GET /notifications/preferences
Authorization: Bearer <token>

Response 200:
{
  "preferences": {
    "pushNotifications": true,
    "emailUpdates": false,
    "newMatches": true,
    "messages": true,
    "promotions": false
  }
}

PUT /notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "pushNotifications": true,
  "emailUpdates": false,
  "newMatches": true,
  "messages": true,
  "promotions": false
}

Response 200:
{
  "preferences": { ... }
}
```

---

## 🎉 Events Endpoints

### Get Upcoming Events
```http
GET /events?city=Lagos&limit=10
Authorization: Bearer <token>

Query Parameters:
- city: string
- category: string
- limit: number

Response 200:
{
  "events": [
    {
      "_id": "event_123",
      "title": "Singles Mixer - Victoria Island",
      "description": "Meet other singles in a fun, relaxed environment...",
      "date": "2026-01-10T19:00:00Z",
      "location": {
        "venue": "Cafe Neo",
        "address": "Victoria Island, Lagos",
        "city": "Lagos"
      },
      "capacity": 50,
      "attendees": 23,
      "price": 5000,  // Naira
      "featuredImage": "https://..."
    }
  ]
}
```

### RSVP to Event
```http
POST /events/:eventId/rsvp
Authorization: Bearer <token>

Response 200:
{
  "message": "RSVP confirmed",
  "ticket": {
    "_id": "ticket_123",
    "eventId": "event_123",
    "userId": "user_123",
    "status": "confirmed"
  }
}
```

### Get Event Details
```http
GET /events/:eventId
Authorization: Bearer <token>

Response 200:
{
  "event": {
    "_id": "event_123",
    "title": "Singles Mixer - Victoria Island",
    "description": "...",
    "date": "2026-01-10T19:00:00Z",
    "location": { ... },
    "attendees": [
      {
        "_id": "user_456",
        "name": "Jane Smith",
        "photos": ["..."]
      }
    ],
    "myRsvp": {
      "status": "confirmed",
      "ticketId": "ticket_123"
    }
  }
}
```

---

## 💰 Wallet & Credits Endpoints

### Get Wallet Balance
```http
GET /wallet/balance
Authorization: Bearer <token>

Response 200:
{
  "balance": 150,  // Credits
  "currency": "credits"
}
```

### Get Transaction History
```http
GET /wallet/transactions?limit=20&offset=0
Authorization: Bearer <token>

Response 200:
{
  "transactions": [
    {
      "_id": "tx_123",
      "type": "credit",  // credit | debit
      "amount": 50,
      "description": "Referral reward",
      "createdAt": "2025-12-26T10:00:00Z"
    }
  ]
}
```

### Purchase Credits
```http
POST /wallet/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "package": "50_credits",  // 50_credits | 100_credits | 200_credits
  "paymentMethodId": "pm_stripe_123"
}

Response 200:
{
  "purchase": {
    "amount": 50,
    "price": 500,  // cents
    "newBalance": 200
  }
}
```

---

## 🔧 Admin Endpoints (Restricted)

### Admin Login
```http
POST /admin/login
Content-Type: application/json

{
  "email": "admin@tribalmingle.com",
  "password": "admin_password"
}

Response 200:
{
  "admin": { ... },
  "token": "admin_jwt_token"
}
```

### Get Admin Dashboard Stats
```http
GET /admin/stats
Authorization: Bearer <admin_token>

Response 200:
{
  "users": {
    "total": 5000,
    "active": 2500,
    "newToday": 50
  },
  "revenue": {
    "today": 50000,
    "thisMonth": 1500000,
    "total": 5000000
  },
  "engagement": {
    "messagesPerDay": 10000,
    "matchesPerDay": 500
  }
}
```

### Get All Users (Admin)
```http
GET /admin/users?search=john&limit=50&offset=0
Authorization: Bearer <admin_token>

Response 200:
{
  "users": [ ... ],
  "total": 5000
}
```

### Get Guaranteed Dating Requests (Admin)
```http
GET /admin/guaranteed-dating/requests?status=pending
Authorization: Bearer <admin_token>

Response 200:
{
  "requests": [ ... ]
}
```

### Create Manual Match (Admin)
```http
POST /admin/guaranteed-dating/match
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "requestId": "gd_123",
  "matchUserId": "user_456",
  "venue": {
    "name": "Cafe Neo",
    "address": "Victoria Island, Lagos",
    "date": "2026-01-05T18:00:00Z"
  }
}

Response 200:
{
  "match": { ... }
}
```

---

## 📋 Error Responses

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "statusCode": 401
  }
}
```

Common error codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (auth required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## 🎯 Rate Limits

- **Default**: 100 requests per minute per IP
- **Authentication**: 10 requests per minute
- **Upload**: 10 requests per hour
- **Messaging**: 50 messages per hour (free users)

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1735214400
```

---

## ✅ Testing with Postman

Import this base configuration:
```json
{
  "baseUrl": "https://tribalmingle.vercel.app/api",
  "headers": {
    "Authorization": "Bearer {{token}}",
    "Content-Type": "application/json"
  }
}
```

**Happy coding! 🚀**

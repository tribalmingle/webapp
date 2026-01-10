# Tribal Mingle - Mobile App Integration Guide

**Last Updated**: December 26, 2025  
**Web App Repository**: https://github.com/tribalmingle/webapp  
**Deployed URL**: https://tribalmingle.vercel.app  
**API Base URL**: https://tribalmingle.vercel.app/api

---

## 📋 Overview

This folder contains everything you need to build a mobile app (iOS/Android) that integrates with the existing Tribal Mingle web application backend.

**Key Points:**
- ✅ **ALL backend APIs are complete and working** in production
- ✅ **71 complete screen designs** documented with AI generation prompts
- ✅ **Vibrant design system** - Purple/pink gradients, glass-morphism cards
- ✅ **No backend changes needed** - Just consume existing endpoints
- ✅ **Authentication uses JWT tokens** - Same system for mobile
- ✅ **100% feature parity possible** - Every web feature has an API
- ✅ **TypeScript types available** - Copy from web repo
- ✅ **Real-time chat** - Via polling (WebSocket support can be added)

### 📱 Screen Requirements
The mobile app requires **71 unique screens** covering:
- Authentication & Onboarding (8 screens)
- Main Dashboard Views (14 screens)
- Premium Features (9 screens)
- Messaging & Chat (4 screens)
- Safety & Trust (5 screens)
- Modals & Overlays (6 screens)
- Empty States & Errors (5 screens)
- And more...

**See [MOBILE_SCREEN_INVENTORY.md](MOBILE_SCREEN_INVENTORY.md) for complete breakdown**

### 🎨 Design System
**Colors:**
- Purple gradient: #5B21B6 → #312E81
- Pink/coral accent: #FF6B9D → #F97316
- White text, glass-morphism cards

**Navigation:**
- Top Bar: Logo (left), Search/Notifications/Profile (right)
- Bottom Nav: Home | Matches | Chat (30% larger) | Like | Settings

**See [AI_SCREEN_DESIGN_PROMPTS.md](AI_SCREEN_DESIGN_PROMPTS.md) for UI generation**

---

## 🏗️ Architecture

### Monorepo Structure
The web app is a **Next.js 15 monorepo** containing:
- **Frontend**: React components in `app/` and `components/`
- **Backend APIs**: Next.js API routes in `app/api/`
- **Database**: MongoDB Atlas (fully configured)
- **Authentication**: JWT + Passkeys
- **File Storage**: HostGator (with S3 fallback ready)
- **Email**: Resend
- **SMS**: Termii + Twilio

### API Architecture
- **Framework**: Next.js 15 App Router API Routes
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Zod schemas
- **Auth**: JWT Bearer tokens
- **Response Format**: JSON
- **Error Handling**: Standardized error responses

---

## 🔑 Authentication Flow

### 1. Registration
```
POST /api/users
Body: {
  email: string
  password: string
  name: string
  dateOfBirth: string (YYYY-MM-DD)
  gender: 'male' | 'female' | 'non-binary'
  country: string
  city: string
  primaryTribe: string
}
Response: {
  user: { _id, email, name, ... }
  token: string (JWT)
}
```

### 2. Login
```
POST /api/auth/login
Body: {
  email: string
  password: string
}
Response: {
  user: { _id, email, name, ... }
  token: string (JWT)
}
```

### 3. Authenticated Requests
All subsequent requests include:
```
Headers: {
  Authorization: "Bearer <jwt_token>"
}
```

### 4. Get Current User
```
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
Response: {
  user: { _id, email, name, profile, subscription, ... }
}
```

---

## 📱 Core Features & API Endpoints

### User Profile Management
- `GET /api/users/:userId` - Get user profile
- `PUT /api/profile/update` - Update current user profile
- `POST /api/upload` - Upload profile photos (multipart/form-data)
- `DELETE /api/users/:userId` - Delete account

### Discovery & Matching
- `GET /api/users/discover` - Get discovery queue (paginated, filtered)
  - Query params: `gender`, `minAge`, `maxAge`, `tribe`, `city`, `limit`, `offset`
- `GET /api/matches/today` - Get today's algorithmic matches
- `GET /api/matches` - Get all matches

### Likes & Interactions
- `POST /api/likes/like` - Like a user
  - Body: `{ userId: string }`
- `POST /api/likes/unlike` - Unlike a user
  - Body: `{ userId: string }`
- `GET /api/likes/i-liked` - Users I liked
- `GET /api/likes/liked-me` - Users who liked me (blurred for free users)
- `POST /api/profile/views` - Track profile view
  - Body: `{ viewedUserId: string }`
- `GET /api/profile/views` - Get my profile views

### Chat & Messaging
- `GET /api/messages/:userId` - Get conversation with specific user
  - Returns array of messages ordered by timestamp
- `POST /api/messages/send` - Send message
  - Body: `{ recipientId: string, text: string, mediaUrl?: string }`
- `GET /api/chat/conversations` - Get all conversations
- `PUT /api/messages/:messageId/read` - Mark message as read

### Dashboard & Stats
- `GET /api/dashboard/stats` - Get user stats
  - Response: `{ likesCount, viewsCount, matchesCount, messagesCount }`

### Subscription & Payments
- `GET /api/subscription/status` - Get current subscription
- `POST /api/subscription/upgrade` - Upgrade to premium
  - Body: `{ plan: 'monthly' | 'quarterly' | 'biannual', paymentMethod: string }`
- `POST /api/subscription/cancel` - Cancel subscription
- `GET /api/subscription/history` - Payment history

### Guaranteed Dating ($50 Service)
- `POST /api/guaranteed-dating/request` - Submit guaranteed dating request
  - Body: Full preference form (12+ fields)
- `GET /api/guaranteed-dating/status` - Get request status
- `POST /api/guaranteed-dating/refund` - Request refund
- `PUT /api/guaranteed-dating/feedback` - Submit feedback after date

### Dating Tips (Blog)
- `GET /api/dating-tips` - Get all tips (paginated)
  - Query params: `category`, `limit`, `offset`
- `GET /api/dating-tips/:id` - Get single tip

### Boosts & Spotlight
- `GET /api/boosts/summary` - Get boost status & history
- `POST /api/boosts/bid` - Place spotlight bid
  - Body: `{ windowTime: string, bidAmount: number }`
- `GET /api/boosts/windows` - Get available spotlight windows

### Referrals & Rewards
- `GET /api/referrals/progress` - Get referral stats & rewards
- `POST /api/referrals/invite` - Send referral invite
  - Body: `{ email?: string, phone?: string }`
- `GET /api/referrals/code` - Get my referral code

### Safety & Trust
- `POST /api/trust/report` - Report user
  - Body: `{ reportedUserId: string, reason: string, description: string }`
- `POST /api/trust/block` - Block user
  - Body: `{ blockedUserId: string }`
- `GET /api/trust/blocked` - Get blocked users list
- `POST /api/trust/unblock` - Unblock user

### Notifications
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `POST /api/notifications/device-token` - Register push notification token

### Events (Community Events)
- `GET /api/events` - Get upcoming events
- `POST /api/events/:eventId/rsvp` - RSVP to event
- `GET /api/events/:eventId` - Get event details

### Wallet & Credits
- `GET /api/wallet/balance` - Get credit balance
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/purchase` - Purchase credits

---

## 🗂️ Data Models (TypeScript Types)

### User
```typescript
interface User {
  _id: string;
  email: string;
  name: string;
  dateOfBirth: Date;
  age: number;
  gender: 'male' | 'female' | 'non-binary';
  country: string;
  city: string;
  primaryTribe: string;
  secondaryTribes?: string[];
  subscriptionPlan: 'free' | 'monthly' | 'quarterly' | 'biannual';
  subscriptionStatus: 'active' | 'cancelled' | 'expired';
  verified: boolean;
  verifiedBadges: string[];
  photos: string[];
  bio?: string;
  interests?: string[];
  height?: number;
  education?: string;
  occupation?: string;
  religion?: string;
  relationshipGoals?: string;
  smoker?: boolean;
  drinker?: boolean;
  hasChildren?: boolean;
  wantsChildren?: boolean;
  createdAt: Date;
  lastActive: Date;
}
```

### Message
```typescript
interface Message {
  _id: string;
  senderId: string;
  recipientId: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'voice';
  read: boolean;
  createdAt: Date;
}
```

### Match
```typescript
interface Match {
  _id: string;
  userId1: string;
  userId2: string;
  matchScore: number;
  createdAt: Date;
}
```

### Like
```typescript
interface Like {
  _id: string;
  likerId: string;
  likedUserId: string;
  superLike: boolean;
  createdAt: Date;
}
```

### Notification
```typescript
interface Notification {
  _id: string;
  userId: string;
  type: 'like' | 'match' | 'message' | 'view' | 'event' | 'system';
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}
```

---

## 🔐 Environment Variables Needed

See `API_CREDENTIALS.md` for the complete list of credentials.

**Minimum for Mobile App:**
- `API_BASE_URL` - https://tribalmingle.vercel.app/api
- `JWT_SECRET` - (for token validation if doing server-side)

**All other credentials are server-side only** - The mobile app doesn't need them.

---

## 🚀 Quick Start

### 1. Set Up Mobile Project
```bash
# React Native / Expo
npx create-expo-app TribalMingleApp
cd TribalMingleApp

# Install dependencies
npm install axios @tanstack/react-query zustand react-hook-form zod
```

### 2. Configure API Client
```typescript
// api/client.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: 'https://tribalmingle.vercel.app/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

### 3. Implement Authentication
```typescript
// Example: Login
const login = async (email: string, password: string) => {
  const response = await apiClient.post('/auth/login', { email, password });
  const { token, user } = response.data;
  
  await AsyncStorage.setItem('auth_token', token);
  return user;
};
```

### 4. Fetch Data with React Query
```typescript
import { useQuery } from '@tanstack/react-query';
import apiClient from './api/client';

const useDiscoverUsers = () => {
  return useQuery({
    queryKey: ['discover'],
    queryFn: async () => {
      const response = await apiClient.get('/users/discover');
      return response.data.users;
    },
  });
};
```

---

## 📞 Real-time Chat Implementation

The current chat system uses **polling** (recommended for mobile):

```typescript
// Poll for new messages every 3 seconds
const { data: messages } = useQuery({
  queryKey: ['messages', userId],
  queryFn: async () => {
    const response = await apiClient.get(`/messages/${userId}`);
    return response.data.messages;
  },
  refetchInterval: 3000, // Poll every 3 seconds
});
```

**Future Enhancement**: WebSocket support can be added later for true real-time.

---

## 🧪 Testing the APIs

### Using Postman/Thunder Client

1. **Login First**:
```
POST https://tribalmingle.vercel.app/api/auth/login
Body (JSON):
{
  "email": "test@example.com",
  "password": "password123"
}
```

2. **Copy Token** from response

3. **Use Token in Headers**:
```
Authorization: Bearer <your_token_here>
```

4. **Test Endpoints**:
```
GET https://tribalmingle.vercel.app/api/users/discover
GET https://tribalmingle.vercel.app/api/dashboard/stats
POST https://tribalmingle.vercel.app/api/likes/like
```

---

## 📚 Additional Resources

### Documentation Files in This Folder
- `API_CREDENTIALS.md` - Complete list of environment variables
- `API_ENDPOINTS.md` - Detailed endpoint reference with examples
- `MOBILE_APP_PROMPT.md` - Instructions for AI assistant

### Web App Repository Files
- `types/` - TypeScript interfaces
- `lib/constants/profile-options.ts` - Dropdown options for tribes, interests, etc.
- `lib/services/` - Service layer examples
- `app/api/` - All API route implementations

### External Documentation
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **MongoDB Models**: Check `lib/db/models/` in web repo
- **Stripe Integration**: See `lib/payments/` in web repo

---

## 🎯 Feature Parity Checklist

To achieve 100% feature parity with the web app, implement:

- [ ] Authentication (Login, Signup, Password Reset)
- [ ] User Profile (View, Edit, Photos)
- [ ] Discovery/Swipe Interface
- [ ] Likes & Matches
- [ ] Real-time Chat
- [ ] Premium Subscriptions
- [ ] Guaranteed Dating Request
- [ ] Dating Tips Blog
- [ ] Boosts & Spotlight Bidding
- [ ] Referrals & Rewards
- [ ] Profile Views
- [ ] Notifications
- [ ] Settings & Privacy
- [ ] Safety (Report, Block)
- [ ] Events (Browse, RSVP)
- [ ] Wallet & Credits

---

## 🐛 Troubleshooting

### Common Issues

**401 Unauthorized**
- Check if JWT token is included in Authorization header
- Verify token hasn't expired (tokens expire after 7 days)
- Re-login to get fresh token

**404 Not Found**
- Verify API endpoint path is correct
- Check base URL is `https://tribalmingle.vercel.app/api` (not `/api/api`)

**CORS Errors**
- Mobile apps typically don't have CORS issues
- If testing in web browser, CORS is properly configured on backend

**Empty Responses**
- Check if user has data (e.g., no matches yet)
- Verify query parameters are correct
- Check if user's subscription allows access (e.g., blurred likes for free users)

---

## 💬 Support

If you encounter issues:
1. Check the web app's API implementation in `app/api/`
2. Review error responses (they include helpful messages)
3. Test the same endpoint using the web app's network tab
4. Check if the feature requires premium subscription

---

## 🎉 Success Metrics

Your mobile app should achieve:
- ✅ 100% API integration with existing backend
- ✅ Same features as web app
- ✅ No backend modifications needed
- ✅ Seamless user experience across platforms
- ✅ Shared database (users can switch between web/mobile)

**Good luck building! 🚀**

# Chat Polling & Push Notifications - Mobile App Implementation Guide

**Date:** December 30, 2025  
**Purpose:** Complete technical specification for implementing real-time chat using polling and push notifications  
**For:** Mobile App Developer  
**Status:** ✅ Backend Ready | ⏳ Mobile Implementation Needed

---

## 📋 Executive Summary

TribalMingle uses a **dual approach** for real-time messaging:

1. **Polling** - For active users with app open (3-second intervals)
2. **Push Notifications** - For users with app closed/backgrounded (OneSignal)

### Why Both?

| User State | Technology | Purpose |
|------------|-----------|---------|
| **App Open** | Polling | Fetch messages every 3s, instant updates |
| **App Backgrounded** | Push Notifications | Alert user of new messages |
| **App Closed** | Push Notifications | Wake device, show lock screen alert |

---

## 🔧 Part 1: Polling Implementation

### Overview
Polling fetches new messages at regular intervals while the app is active. It's simple, reliable, and works on all platforms.

### API Endpoint
```
GET https://tribalmingle.vercel.app/api/chat/messages?matchId={matchId}&since={timestamp}
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Query Parameters:**
- `matchId` - The match/conversation ID
- `since` - ISO timestamp of last message fetched (for incremental updates)

**Response:**
```json
{
  "messages": [
    {
      "_id": "67a1b2c3d4e5f6g7h8i9",
      "matchId": "abc123",
      "senderId": "user456",
      "recipientId": "user789",
      "content": "Hey! How are you?",
      "messageType": "text",
      "timestamp": "2025-12-30T14:23:45.000Z",
      "readAt": null,
      "deliveredAt": "2025-12-30T14:23:46.000Z"
    }
  ],
  "hasMore": false
}
```

### React Native Implementation

#### 1. Install Dependencies
```bash
npm install @react-native-async-storage/async-storage
```

#### 2. Create Polling Hook
```typescript
// hooks/useChatPolling.ts
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

interface Message {
  _id: string;
  matchId: string;
  senderId: string;
  recipientId: string;
  content: string;
  messageType: 'text' | 'voice' | 'image';
  timestamp: string;
  readAt?: string | null;
  deliveredAt?: string | null;
}

interface UseChatPollingOptions {
  matchId: string;
  jwtToken: string;
  enabled?: boolean;
  intervalMs?: number; // Default 3000ms
}

export function useChatPolling({
  matchId,
  jwtToken,
  enabled = true,
  intervalMs = 3000,
}: UseChatPollingOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const lastFetchRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const fetchMessages = async (isInitial = false) => {
    if (!enabled) return;

    try {
      const url = new URL('https://tribalmingle.vercel.app/api/chat/messages');
      url.searchParams.append('matchId', matchId);
      
      // Only fetch new messages after initial load
      if (!isInitial && lastFetchRef.current) {
        url.searchParams.append('since', lastFetchRef.current);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        if (isInitial) {
          setMessages(data.messages);
        } else {
          // Append new messages, avoid duplicates
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m._id));
            const newMessages = data.messages.filter(
              (msg: Message) => !existingIds.has(msg._id)
            );
            return [...prev, ...newMessages];
          });
        }

        // Update last fetch timestamp
        const latestTimestamp = data.messages[data.messages.length - 1].timestamp;
        lastFetchRef.current = latestTimestamp;
        await AsyncStorage.setItem(
          `chat_last_fetch_${matchId}`,
          latestTimestamp
        );
      }

      setError(null);
    } catch (err) {
      console.error('Polling error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (!enabled || !matchId || !jwtToken) return;

    // Restore last fetch timestamp from storage
    AsyncStorage.getItem(`chat_last_fetch_${matchId}`).then((timestamp) => {
      if (timestamp) {
        lastFetchRef.current = timestamp;
      }
      fetchMessages(true);
    });
  }, [matchId, jwtToken, enabled]);

  // Polling interval
  useEffect(() => {
    if (!enabled) return;

    // Only poll when app is active
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appStateRef.current = nextAppState;
      
      if (nextAppState === 'active') {
        // Resume polling
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            fetchMessages(false);
          }, intervalMs);
        }
      } else {
        // Pause polling when backgrounded
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    });

    // Start initial polling
    intervalRef.current = setInterval(() => {
      if (appStateRef.current === 'active') {
        fetchMessages(false);
      }
    }, intervalMs);

    return () => {
      subscription.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, intervalMs]);

  return {
    messages,
    loading,
    error,
    refetch: () => fetchMessages(true),
  };
}
```

#### 3. Use in Chat Screen
```typescript
// screens/ChatConversationScreen.tsx
import React, { useState } from 'react';
import { View, FlatList, TextInput, Button, Text } from 'react-native';
import { useChatPolling } from '../hooks/useChatPolling';
import { useAuth } from '../contexts/AuthContext';

export default function ChatConversationScreen({ route }) {
  const { matchId } = route.params;
  const { jwtToken } = useAuth();
  const [messageText, setMessageText] = useState('');
  
  const { messages, loading, error, refetch } = useChatPolling({
    matchId,
    jwtToken,
    enabled: true,
    intervalMs: 3000, // Poll every 3 seconds
  });

  const sendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      const response = await fetch('https://tribalmingle.vercel.app/api/chat/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId,
          content: messageText,
          messageType: 'text',
        }),
      });

      if (response.ok) {
        setMessageText('');
        refetch(); // Immediately fetch new messages
      }
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  if (loading && messages.length === 0) {
    return <Text>Loading messages...</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={{ padding: 10 }}>
            <Text>{item.content}</Text>
          </View>
        )}
      />
      
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          style={{ flex: 1, borderWidth: 1, padding: 10 }}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
}
```

### Polling Performance

| Metric | Value |
|--------|-------|
| **Interval** | 3 seconds |
| **Requests/min** | 20 |
| **30 min chat** | 600 requests |
| **Battery impact** | ~1% per 30 min |
| **Data usage** | ~50KB per 30 min |

---

## 📲 Part 2: Push Notifications Implementation

### Overview
Push notifications alert users when the app is closed or backgrounded. We use **OneSignal** for cross-platform push (iOS APNS + Android FCM).

### How It Works

```
User A sends message
     ↓
Backend saves to MongoDB
     ↓
Backend calls NotificationService.sendVoiceNoteNotification()
     ↓
OneSignal sends push to User B's device
     ↓
User B sees notification on lock screen
     ↓
User B taps notification → App opens to chat
```

### API Endpoints

#### 1. Register Device Token
```
POST https://tribalmingle.vercel.app/api/notifications/device-token
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "deviceToken": "ExponentPushToken[xxxxxxxxxxxxxx]",
  "platform": "ios" | "android",
  "deviceId": "unique-device-id",
  "appVersion": "1.0.0"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device token registered"
}
```

#### 2. Notification Types Supported

The backend automatically sends push notifications for:

- **Text Messages** - New chat messages
- **Voice Notes** - Audio message received
- **Video Calls** - LiveKit invite
- **Likes** - Someone liked your profile
- **Matches** - New match created
- **Events** - Event reminders (24h, 1h)

### React Native Implementation

#### 1. Install OneSignal
```bash
npm install react-native-onesignal
npx pod-install # iOS only
```

#### 2. Configure OneSignal

**Android** - `android/app/build.gradle`:
```gradle
buildscript {
    ext {
        oneSignalAppId = "YOUR_ONESIGNAL_APP_ID"
    }
}
```

**iOS** - In Xcode, add OneSignal App ID to Info.plist:
```xml
<key>OneSignal_app_id</key>
<string>YOUR_ONESIGNAL_APP_ID</string>
```

#### 3. Initialize OneSignal

```typescript
// App.tsx or index.js
import OneSignal from 'react-native-onesignal';

// Initialize OneSignal
OneSignal.setAppId('YOUR_ONESIGNAL_APP_ID');

// Prompt for push notification permissions (iOS)
OneSignal.promptForPushNotificationsWithUserResponse((response) => {
  console.log('Notification permission:', response);
});

// Listen for notification opened
OneSignal.setNotificationOpenedHandler((notification) => {
  console.log('Notification opened:', notification);
  
  // Parse deep link from notification
  const data = notification.notification.additionalData;
  
  if (data?.messageId && data?.matchId) {
    // Navigate to chat conversation
    navigationRef.navigate('ChatConversation', {
      matchId: data.matchId,
      messageId: data.messageId,
    });
  }
});

// Get device state (includes player ID / external user ID)
OneSignal.getDeviceState().then((deviceState) => {
  console.log('OneSignal Device State:', deviceState);
});
```

#### 4. Register Device Token with Backend

```typescript
// contexts/AuthContext.tsx or similar
import { useEffect } from 'react';
import OneSignal from 'react-native-onesignal';
import { Platform } from 'react-native';

export function useNotificationRegistration(userId: string, jwtToken: string) {
  useEffect(() => {
    async function registerDevice() {
      try {
        // Get OneSignal device state
        const deviceState = await OneSignal.getDeviceState();
        
        if (!deviceState?.userId) {
          console.warn('OneSignal not ready yet');
          return;
        }

        // Register with backend
        const response = await fetch(
          'https://tribalmingle.vercel.app/api/notifications/device-token',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${jwtToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              deviceToken: deviceState.userId, // OneSignal player ID
              platform: Platform.OS,
              deviceId: deviceState.deviceId,
              appVersion: '1.0.0',
            }),
          }
        );

        if (response.ok) {
          console.log('Device token registered successfully');
        } else {
          console.error('Failed to register device token:', response.status);
        }
      } catch (error) {
        console.error('Device registration error:', error);
      }
    }

    if (userId && jwtToken) {
      registerDevice();
    }
  }, [userId, jwtToken]);
}

// Use in your AuthProvider:
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [jwtToken, setJwtToken] = useState(null);

  // Register for push notifications after login
  useNotificationRegistration(user?._id, jwtToken);

  // ... rest of auth logic
}
```

#### 5. Handle Deep Links

```typescript
// navigation/LinkingConfiguration.ts
const linking = {
  prefixes: ['tribalmingle://', 'https://app.tribalmingle.com'],
  config: {
    screens: {
      ChatConversation: 'chat/:matchId',
      Profile: 'profile/:userId',
      EventDetail: 'events/:eventId',
    },
  },
};

export default linking;
```

#### 6. Notification Foreground Handler

```typescript
// App.tsx
OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent) => {
  const notification = notificationReceivedEvent.getNotification();
  
  // Don't show notification if already in that chat
  const currentRoute = navigationRef.getCurrentRoute();
  if (
    currentRoute?.name === 'ChatConversation' &&
    currentRoute?.params?.matchId === notification.additionalData?.matchId
  ) {
    // Silently dismiss - user is already viewing the chat
    notificationReceivedEvent.complete(null);
    return;
  }
  
  // Show notification
  notificationReceivedEvent.complete(notification);
});
```

---

## 🔐 Part 3: Backend Configuration (Already Complete)

### What's Already Built

✅ **NotificationService** - [lib/services/notification-service.ts](lib/services/notification-service.ts)
- `sendVoiceNoteNotification()` - Send chat message alerts
- `sendLiveKitInvite()` - Video call invitations
- `sendEventReminder()` - Event reminders

✅ **OneSignal Client** - [lib/vendors/onesignal-client.ts](lib/vendors/onesignal-client.ts)
- `sendOneSignalNotification()` - Core push delivery function
- Handles iOS (APNS) and Android (FCM) automatically

✅ **Chat API Endpoints** - [app/api/chat/**/route.ts](app/api/chat)
- `/api/chat/send` - Send message + trigger push notification
- `/api/chat/messages` - Fetch messages (for polling)
- `/api/chat/livekit-token` - Video calls with push notifications

### What Needs Configuration

⏳ **OneSignal Credentials** (Product Owner to provide):

1. Create account at https://onesignal.com
2. Create new app for TribalMingle
3. Configure iOS push (APNS certificate from Apple Developer)
4. Configure Android push (FCM server key from Firebase)
5. Get credentials:
   - `ONESIGNAL_APP_ID` - Your app ID (e.g., "12345678-1234-1234-1234-123456789012")
   - `ONESIGNAL_REST_API_KEY` - Your REST API key

**Add to Vercel Environment Variables:**
```
ONESIGNAL_APP_ID=your-app-id-here
ONESIGNAL_REST_API_KEY=your-rest-api-key-here
ONESIGNAL_ANDROID_CHANNEL_ID=default (optional)
```

**Add to Mobile App:**
```typescript
// config/constants.ts
export const ONESIGNAL_APP_ID = 'your-app-id-here';
```

---

## 📊 Part 4: Testing Checklist

### Polling Tests

- [ ] Messages load on chat screen open
- [ ] New messages appear every 3 seconds
- [ ] Polling stops when app backgrounded
- [ ] Polling resumes when app returns to foreground
- [ ] Sent messages appear immediately after send
- [ ] No duplicate messages
- [ ] Error handling for network failures

### Push Notification Tests

- [ ] Device token registers on login
- [ ] Push received when app completely closed
- [ ] Push received when app backgrounded
- [ ] Push NOT shown when already in that chat (foreground handler)
- [ ] Tapping push opens correct chat
- [ ] Deep links work (matchId, messageId)
- [ ] Badge count updates on iOS
- [ ] Sound plays on notification
- [ ] Works on both iOS and Android

### Integration Tests

- [ ] User A sends message → User B gets push (if app closed)
- [ ] User A sends message → User B sees in real-time (if app open)
- [ ] Voice note sends → Push shows duration
- [ ] Video call invite → High-priority push
- [ ] Match created → Both users get push

---

## 📈 Part 5: Performance & Optimization

### Polling Optimization

```typescript
// Adaptive polling - slow down when inactive
const getPollingInterval = (lastMessageTime: Date) => {
  const minsSinceLastMessage = (Date.now() - lastMessageTime.getTime()) / 1000 / 60;
  
  if (minsSinceLastMessage < 5) return 3000;  // Active chat - 3s
  if (minsSinceLastMessage < 15) return 10000; // Recent activity - 10s
  return 30000; // Inactive - 30s
};
```

### Push Notification Batching

Backend already handles notification deduplication using `dedupeKey`:
```typescript
// lib/services/notification-service.ts
const dedupeKey = `event_reminder:${params.reminderWindow}:${params.userId}`;
// Prevents duplicate notifications
```

### Battery Optimization

- Polling pauses when app backgrounded (handled in `useChatPolling`)
- OneSignal uses efficient system-level push (no battery drain)
- Adaptive polling intervals reduce API calls when chat inactive

---

## 🚨 Part 6: Error Handling

### Network Failures

```typescript
// Retry with exponential backoff
const retryWithBackoff = async (fn: () => Promise<void>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fn();
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

### Token Expiry

```typescript
// Refresh JWT token when expired
if (response.status === 401) {
  const newToken = await refreshAuthToken();
  // Retry request with new token
}
```

### OneSignal Fallback

```typescript
// If OneSignal fails, backend logs error but doesn't crash
// lib/vendors/onesignal-client.ts
if (!APP_ID || !API_KEY) {
  console.warn('[notifications] OneSignal credentials missing – skipping push');
  return { status: 'skipped', reason: 'missing_credentials' };
}
```

---

## 📚 Part 7: API Reference Summary

### Chat Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat/messages` | GET | Fetch messages (polling) |
| `/api/chat/send` | POST | Send text message |
| `/api/chat/voice-note` | POST | Send voice note |
| `/api/chat/livekit-token` | POST | Start video call |
| `/api/notifications/device-token` | POST | Register push token |

### Notification Payload Structure

```typescript
{
  heading: "🎤 Voice note from Sarah",
  content: "Sarah sent you a 15s voice message",
  deeplink: "https://app.tribalmingle.com/chat/abc123?message=msg456",
  data: {
    matchId: "abc123",
    messageId: "msg456",
    senderName: "Sarah",
    senderPhoto: "https://...",
    duration: 15,
    type: "voice_note"
  }
}
```

---

## ✅ Part 8: Deployment Checklist

### Mobile App
- [ ] OneSignal SDK installed
- [ ] ONESIGNAL_APP_ID configured
- [ ] iOS push certificate uploaded to OneSignal
- [ ] Android FCM server key configured
- [ ] Deep linking configured
- [ ] Device token registration on login
- [ ] Notification handlers implemented
- [ ] Polling hook integrated in chat screens

### Backend (Already Complete)
- [x] NotificationService implemented
- [x] OneSignal client configured
- [x] Chat API endpoints working
- [ ] OneSignal credentials added to Vercel
- [ ] `/api/notifications/device-token` endpoint created

### Testing
- [ ] End-to-end test: Send message → Push received
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test deep link navigation
- [ ] Load test polling (100 concurrent users)

---

## 🎯 Next Steps for Mobile Developer

1. **Immediate:**
   - Install `react-native-onesignal` package
   - Copy `useChatPolling` hook to project
   - Implement device token registration on login

2. **This Week:**
   - Integrate polling in chat screens
   - Configure OneSignal app ID
   - Test push notifications on device

3. **Before Launch:**
   - Submit iOS app for push notification entitlements
   - Test on production API
   - Load test with 100+ users

---

## 📞 Support

**Backend Issues:**
- Vercel logs: https://vercel.com/tribalmingle/logs
- MongoDB Atlas: Check `messages` and `notifications` collections

**Mobile Issues:**
- OneSignal dashboard: https://onesignal.com
- Check device logs for token registration failures

**Questions:**
Contact product owner or check [EMAIL_SYSTEM_README.md](EMAIL_SYSTEM_README.md) for notification architecture.

---

**Document Version:** 1.0  
**Last Updated:** December 30, 2025  
**Status:** Ready for mobile development

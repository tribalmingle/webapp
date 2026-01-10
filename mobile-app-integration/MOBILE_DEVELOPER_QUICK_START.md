# Mobile Developer Quick Start - TribalMingle Chat

**What to Send to Mobile Developer:** This document  
**Full Technical Specs:** [CHAT_POLLING_AND_PUSH_NOTIFICATIONS.md](CHAT_POLLING_AND_PUSH_NOTIFICATIONS.md)

---

## 🎯 What You Need to Build

We're implementing real-time chat using **polling + push notifications**:

- **Polling** = Fetch new messages every 3 seconds when app is open
- **Push Notifications** = Alert users when app is closed (via OneSignal)

---

## 📦 Package Installation

```bash
npm install @react-native-async-storage/async-storage react-native-onesignal
npx pod-install  # iOS only
```

---

## 🔑 Configuration Needed

### 1. OneSignal App ID
You'll need this value from me (product owner):
```typescript
// config/constants.ts
export const ONESIGNAL_APP_ID = 'YOUR_APP_ID_HERE'; // I'll provide this
```

### 2. Backend API
All endpoints are at:
```
https://tribalmingle.vercel.app/api/
```

Authentication uses JWT Bearer tokens (you already have this from login).

---

## 🚀 Implementation Steps

### Step 1: Copy the Polling Hook
See [CHAT_POLLING_AND_PUSH_NOTIFICATIONS.md](CHAT_POLLING_AND_PUSH_NOTIFICATIONS.md) **Section: Part 1, Create Polling Hook**

This gives you:
```typescript
const { messages, loading, error } = useChatPolling({
  matchId: 'abc123',
  jwtToken: 'your-jwt-token',
  intervalMs: 3000, // Poll every 3 seconds
});
```

### Step 2: Integrate in Chat Screen
See [CHAT_POLLING_AND_PUSH_NOTIFICATIONS.md](CHAT_POLLING_AND_PUSH_NOTIFICATIONS.md) **Section: Part 1, Use in Chat Screen**

Displays messages and sends new ones.

### Step 3: Setup OneSignal
See [CHAT_POLLING_AND_PUSH_NOTIFICATIONS.md](CHAT_POLLING_AND_PUSH_NOTIFICATIONS.md) **Section: Part 2, Initialize OneSignal**

Initialize OneSignal in your `App.tsx` or `index.js`:
```typescript
import OneSignal from 'react-native-onesignal';

OneSignal.setAppId('YOUR_ONESIGNAL_APP_ID');
OneSignal.promptForPushNotificationsWithUserResponse();
```

### Step 4: Register Device Token
See [CHAT_POLLING_AND_PUSH_NOTIFICATIONS.md](CHAT_POLLING_AND_PUSH_NOTIFICATIONS.md) **Section: Part 2, Register Device Token with Backend**

After user logs in, register their device:
```typescript
const deviceState = await OneSignal.getDeviceState();

await fetch('https://tribalmingle.vercel.app/api/notifications/device-token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    deviceToken: deviceState.userId,
    platform: Platform.OS,
  }),
});
```

### Step 5: Handle Notification Taps
See [CHAT_POLLING_AND_PUSH_NOTIFICATIONS.md](CHAT_POLLING_AND_PUSH_NOTIFICATIONS.md) **Section: Part 2, Handle Deep Links**

When user taps a push notification, open the chat:
```typescript
OneSignal.setNotificationOpenedHandler((notification) => {
  const { matchId, messageId } = notification.notification.additionalData;
  navigation.navigate('ChatConversation', { matchId, messageId });
});
```

---

## 📋 API Endpoints You'll Use

### 1. Fetch Messages (Polling)
```
GET /api/chat/messages?matchId={matchId}&since={timestamp}
```

**Response:**
```json
{
  "messages": [
    {
      "_id": "msg123",
      "content": "Hey! How are you?",
      "senderId": "user456",
      "timestamp": "2025-12-30T14:23:45.000Z"
    }
  ]
}
```

### 2. Send Message
```
POST /api/chat/send
```

**Body:**
```json
{
  "matchId": "abc123",
  "content": "I'm good, thanks!",
  "messageType": "text"
}
```

### 3. Register Device Token
```
POST /api/notifications/device-token
```

**Body:**
```json
{
  "deviceToken": "ExponentPushToken[...]",
  "platform": "ios"
}
```

---

## ✅ Testing Checklist

- [ ] Messages load when opening chat
- [ ] New messages appear every 3 seconds
- [ ] Send button adds message immediately
- [ ] Push notification received when app closed
- [ ] Tapping push opens correct chat
- [ ] Polling stops when app backgrounded
- [ ] Works on both iOS and Android

---

## 🎨 UI/UX Notes

### Chat Screen Layout
Reference image: [chat list.jpeg](c:\Users\CCMendel\OneDrive\Documents\Portfolio\Tribal Mingle\New folder (2)\chat list.jpeg)

Design system:
- **Background:** Purple-pink gradient (#7C3AED → #EC4899)
- **Message bubbles:** Glass-morphism cards with 20px border radius
- **Sender messages:** Orange gradient (#FF6B35)
- **Received messages:** White/transparent

### Loading State
```typescript
if (loading && messages.length === 0) {
  return <LoadingSpinner />;
}
```

### Empty State
```typescript
if (!loading && messages.length === 0) {
  return <EmptyState message="No messages yet. Say hi! 👋" />;
}
```

---

## 🆘 Common Issues

### "Messages not loading"
- Check JWT token is valid
- Check network connection
- Check API endpoint: `https://tribalmingle.vercel.app/api/chat/messages`

### "Push notifications not working"
- Check OneSignal App ID is correct
- Check device token registered with backend
- Check iOS push certificate uploaded to OneSignal
- Check Android FCM server key configured

### "Polling stops randomly"
- Check app state listener is working
- Check for JavaScript errors in console
- Ensure `intervalRef.current` is not null

---

## 📞 Questions?

- **Full technical specs:** [CHAT_POLLING_AND_PUSH_NOTIFICATIONS.md](CHAT_POLLING_AND_PUSH_NOTIFICATIONS.md)
- **Design system:** [REFERENCE_IMAGES_INVENTORY.md](REFERENCE_IMAGES_INVENTORY.md)
- **API credentials:** [API_CREDENTIALS.md](API_CREDENTIALS.md)

Contact product owner for:
- OneSignal App ID
- iOS push certificate
- Android FCM server key

---

**Ready to Start?** Read the full spec at [CHAT_POLLING_AND_PUSH_NOTIFICATIONS.md](CHAT_POLLING_AND_PUSH_NOTIFICATIONS.md)

**Version:** 1.0  
**Date:** December 30, 2025

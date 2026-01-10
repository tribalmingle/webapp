# 🚀 Tribal Mingle Mobile App - Quick Start Guide

**For**: Mobile App Developers (React Native / Flutter)  
**Last Updated**: December 26, 2025  
**Time to First API Call**: 15 minutes

---

## 📱 Before You Start

### Review Design Requirements
Before coding, understand the UI requirements:

**📋 Screen Inventory**: [MOBILE_SCREEN_INVENTORY.md](MOBILE_SCREEN_INVENTORY.md)
- 71 unique screens documented
- Component breakdowns
- Navigation structure
- Development phases

**🎨 Design System**: [AI_SCREEN_DESIGN_PROMPTS.md](AI_SCREEN_DESIGN_PROMPTS.md)
- Purple/pink gradient theme (#5B21B6→#312E81, #FF6B9D→#F97316)
- Glass-morphism cards (20px radius)
- Bottom nav: Home | Matches | Chat (30% larger) | Like | Settings
- Top bar: Logo, Search, Notifications, Profile

---

## ⚡ Super Quick Start (5 Steps)

### 1️⃣ Read the Documentation (20 min)
```bash
✅ Review: MOBILE_SCREEN_INVENTORY.md (all 71 screens)
✅ Check: AI_SCREEN_DESIGN_PROMPTS.md (design system)
✅ Read: README.md (comprehensive overview)
✅ Skim: API_ENDPOINTS.md (reference as you build)
✅ Note: API_CREDENTIALS.md (security guidelines)
✅ Follow: MOBILE_APP_PROMPT.md (AI assistant instructions)
```

### 2️⃣ Test the API (5 min)
```bash
# Test login endpoint
curl -X POST https://tribalmingle.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Expected response:
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# Copy the token and test an authenticated endpoint
curl -X GET https://tribalmingle.vercel.app/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3️⃣ Set Up Your Project (10 min)

**React Native / Expo:**
```bash
npx create-expo-app TribalMingleApp
cd TribalMingleApp

# Install core dependencies
npm install axios @tanstack/react-query zustand
npm install react-hook-form zod @hookform/resolvers
npx expo install expo-secure-store
```

**Flutter:**
```bash
flutter create tribal_mingle_app
cd tribal_mingle_app

# Add dependencies to pubspec.yaml
# - dio (HTTP client)
# - flutter_secure_storage (token storage)
# - provider or riverpod (state management)
```

### 4️⃣ Configure API Client (5 min)

**React Native:**
```typescript
// src/api/client.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const apiClient = axios.create({
  baseURL: 'https://tribalmingle.vercel.app/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to all requests
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      // Navigate to login screen
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

**Flutter:**
```dart
// lib/services/api_client.dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  final Dio dio = Dio(BaseOptions(
    baseUrl: 'https://tribalmingle.vercel.app/api',
    connectTimeout: Duration(seconds: 15),
    headers: {'Content-Type': 'application/json'},
  ));

  final storage = FlutterSecureStorage();

  ApiClient() {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.read(key: 'auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          await storage.delete(key: 'auth_token');
          // Navigate to login
        }
        return handler.next(error);
      },
    ));
  }
}
```

### 5️⃣ Implement Login (10 min)

**React Native:**
```typescript
// src/screens/LoginScreen.tsx
import { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/client';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });
      
      const { token, user } = response.data;
      await SecureStore.setItemAsync('auth_token', token);
      
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Error', 'Invalid credentials');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}
```

**Flutter:**
```dart
// lib/screens/login_screen.dart
class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _apiClient = ApiClient();

  Future<void> _login() async {
    try {
      final response = await _apiClient.dio.post('/auth/login', data: {
        'email': _emailController.text,
        'password': _passwordController.text,
      });

      final token = response.data['token'];
      await _apiClient.storage.write(key: 'auth_token', value: token);

      Navigator.pushReplacementNamed(context, '/home');
    } catch (e) {
      // Show error
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          TextField(controller: _emailController, decoration: InputDecoration(labelText: 'Email')),
          TextField(controller: _passwordController, decoration: InputDecoration(labelText: 'Password'), obscureText: true),
          ElevatedButton(onPressed: _login, child: Text('Login')),
        ],
      ),
    );
  }
}
```

---

## 🎯 Next Steps (Build Features)

### Day 1: Core Authentication ✅
- [x] Login screen
- [ ] Signup flow (multi-step)
- [ ] Password reset
- [ ] Biometric auth (Face ID / Touch ID)
- [ ] Auto-login with stored token

### Day 2: User Profile 👤
- [ ] View profile (mine & others)
- [ ] Edit profile form
- [ ] Photo upload
- [ ] Photo gallery viewer

### Day 3: Discovery & Matching 🔍
- [ ] Swipe interface (Tinder-like)
- [ ] Filter options
- [ ] Today's matches screen
- [ ] Match algorithm display

### Day 4: Likes & Interactions ❤️
- [ ] Like/unlike users
- [ ] View who liked me (blurred for free)
- [ ] View my likes
- [ ] Track profile views

### Day 5: Real-time Chat 💬
- [ ] Conversation list
- [ ] Chat screen with messages
- [ ] Send text messages
- [ ] Message polling (every 3 seconds)
- [ ] Typing indicators

### Day 6: Dashboard & Stats 📊
- [ ] Home dashboard
- [ ] Stats cards (likes, views, matches)
- [ ] Recent activity feed
- [ ] Notifications bell

### Day 7: Premium Features 💎
- [ ] Subscription plans screen
- [ ] Payment integration (Stripe)
- [ ] Premium benefits display
- [ ] Upgrade prompts

### Day 8: Guaranteed Dating 💍
- [ ] Service info screen
- [ ] Preference form (12+ fields)
- [ ] Request submission
- [ ] Status tracking

### Day 9: Additional Features 🎁
- [ ] Dating tips blog
- [ ] Boosts & spotlight
- [ ] Referrals & rewards
- [ ] Events (browse & RSVP)

### Day 10: Polish & Testing ✨
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states
- [ ] Animations
- [ ] Push notifications
- [ ] Deep linking

---

## 📚 Essential Code Snippets

### Fetch Data with React Query
```typescript
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

function useDiscoverUsers() {
  return useQuery({
    queryKey: ['discover'],
    queryFn: async () => {
      const response = await apiClient.get('/users/discover', {
        params: { limit: 20, gender: 'female' },
      });
      return response.data.users;
    },
    refetchInterval: false, // Don't auto-refresh
  });
}

// Usage in component
const { data: users, isLoading, error } = useDiscoverUsers();
```

### Send a Like
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useLikeUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.post('/likes/like', { userId });
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['discover'] });
      queryClient.invalidateQueries({ queryKey: ['likes'] });

      // Check if it's a match
      if (data.match?.isMatch) {
        Alert.alert('Match! 💕', "You have a new match!");
      }
    },
  });
}

// Usage
const likeMutation = useLikeUser();
likeMutation.mutate('user_123');
```

### Real-time Chat Polling
```typescript
function useChatMessages(userId: string) {
  return useQuery({
    queryKey: ['messages', userId],
    queryFn: async () => {
      const response = await apiClient.get(`/messages/${userId}`);
      return response.data.messages;
    },
    refetchInterval: 3000, // Poll every 3 seconds
    enabled: !!userId, // Only fetch if userId exists
  });
}
```

### Upload Photos
```typescript
async function uploadPhoto(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'profile');

  const response = await apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.url;
}
```

---

## 🔐 Security Checklist

Before you ship:
- [ ] JWT tokens stored in SecureStore (iOS Keychain / Android Keystore)
- [ ] No API keys hardcoded in app
- [ ] HTTPS only (no HTTP fallback)
- [ ] Certificate pinning implemented
- [ ] Biometric authentication option
- [ ] Auto-logout after 30 minutes inactivity
- [ ] Sensitive data cleared on logout
- [ ] Input validation on all forms
- [ ] XSS protection in chat messages

---

## 🧪 Testing Accounts

Use these test accounts to develop and test:

```
Email: test@example.com
Password: password123

Email: demo@tribalmingle.com
Password: demo123
```

**These accounts work on production API for testing purposes.**

---

## 📞 Common Issues & Solutions

### Issue: 401 Unauthorized
**Solution**: Token expired. Re-login to get new token (tokens expire after 7 days).

### Issue: Empty discover queue
**Solution**: Adjust filters (age, gender, tribe) or check if your profile is complete.

### Issue: Likes are blurred
**Solution**: Expected behavior for free users. Premium subscription required to unlock.

### Issue: Upload fails
**Solution**: Check file size (<5MB), format (JPEG/PNG), and that Authorization header is included.

### Issue: Messages not real-time
**Solution**: Implement polling with `refetchInterval: 3000` in React Query.

---

## 🎯 Success Metrics

Your app is ready when:
- ✅ Users can login, view profiles, and send likes
- ✅ Real-time chat works smoothly
- ✅ Premium subscription flow is complete
- ✅ Push notifications are configured
- ✅ App feels fast and native
- ✅ No critical bugs on real devices

---

## 🚀 Launch Checklist

Before submitting to app stores:
- [ ] All core features tested
- [ ] Real device testing (iOS & Android)
- [ ] Push notifications working
- [ ] Deep linking configured
- [ ] App icons created (all sizes)
- [ ] Screenshots prepared
- [ ] Privacy policy added
- [ ] Terms of service added
- [ ] Beta testing completed
- [ ] Crash reporting enabled
- [ ] Analytics integrated

---

## 📖 Full Documentation

- **README.md** - Comprehensive guide
- **API_ENDPOINTS.md** - Complete API reference
- **API_CREDENTIALS.md** - Security & credentials
- **API_ROUTES_DIRECTORY.md** - All available routes
- **MOBILE_APP_PROMPT.md** - AI assistant instructions

---

## 💪 You're Ready!

You now have everything you need:
✅ Working backend APIs  
✅ Complete documentation  
✅ Test accounts  
✅ Code examples  
✅ Security guidelines

**Start building and ship an amazing mobile app! 🚀📱**

---

**Questions?** Test endpoints using Postman or review the web app implementation in the GitHub repo.

**Happy coding! 🎉**

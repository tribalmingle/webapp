# INSTRUCTIONS FOR MOBILE APP WORKSPACE AI ASSISTANT

**Date**: December 26, 2025  
**Project**: Tribal Mingle Mobile App Development  
**Backend Repository**: https://github.com/tribalmingle/webapp

---

## 🎯 YOUR MISSION

You are tasked with building a **native mobile app (iOS & Android)** that integrates with an existing, fully-functional web application backend. Your job is to:

1. **Consume existing APIs** - Do NOT build new backend code
2. **Achieve 100% feature parity** with the web app
3. **Use React Native** - based on best fit
4. **Follow mobile best practices** - Native UI/UX patterns
5. **Prioritize user experience** - Fast, smooth, intuitive

---

## 📚 REQUIRED READING

Before you start coding, **YOU MUST READ AND UNDERSTAND** the following documents in this folder:

### 1. MOBILE_SCREEN_INVENTORY.md (CRITICAL - READ FIRST)
- Complete inventory of all 71 screens needed
- Screen components and navigation structure
- Development phases and priorities
- State variations (free vs premium users)
- Design system requirements

### 2. AI_SCREEN_DESIGN_PROMPTS.md (DESIGN - READ SECOND)
- AI-generated UI design specifications
- Vibrant purple/pink gradient design system
- Glass-morphism card patterns
- Standardized navigation templates
- African cultural design elements

### 3. README.md (ARCHITECTURE - READ THIRD)
- Overview of the architecture
- Authentication flow (JWT-based)
- Core features and their API endpoints
- Quick start guide
- TypeScript types and data models
- Implementation tips and common pitfalls

### 4. API_ENDPOINTS.md (REFERENCE - READ THOROUGHLY)
- Complete API reference with 200+ endpoints
- Request/response examples for every feature
- Authentication, profiles, discovery, chat, payments, etc.
- Error handling and rate limits
- Postman testing guide

### 5. API_CREDENTIALS.md (SECURITY - READ CAREFULLY)
- What credentials mobile app needs (spoiler: just API_BASE_URL!)
- What credentials are server-side only
- Security best practices
- Environment variable configuration
- Token management guidelines

---

## ⚠️ CRITICAL RULES

### DO:
✅ **Use the existing backend** - All APIs are production-ready
✅ **Copy TypeScript types** from web repo (`types/` folder)
✅ **Follow JWT authentication** pattern described in README
✅ **Implement offline support** where applicable
✅ **Use React Query** or equivalent for API state management
✅ **Store tokens securely** (iOS Keychain, Android Keystore)
✅ **Test on real devices** before considering features "done"
✅ **Handle loading, error, and empty states** for every screen
✅ **Respect rate limits** specified in API docs
✅ **Ask questions** if API behavior is unclear

### DON'T:
❌ **Don't modify the backend** - It's shared with web users
❌ **Don't hardcode API keys** - Everything is server-side
❌ **Don't skip authentication** - All features require JWT
❌ **Don't ignore pagination** - Endpoints return limited results
❌ **Don't forget biometric auth** - Users expect Face ID/Touch ID
❌ **Don't skip push notifications** - Critical for engagement
❌ **Don't test only in simulator** - Real devices behave differently
❌ **Don't rush** - Quality over speed

---

## 🏗️ IMPLEMENTATION APPROACH

### Phase 1: Foundation (Days 1-2)
1. **Read all documentation** in this folder
2. **Set up project** (React Native/Expo or Flutter)
3. **Configure API client** with base URL and JWT interceptor
4. **Test authentication** (login, signup, token refresh)
5. **Implement secure storage** for JWT tokens
6. **Build navigation structure** (tabs, stack navigation)

### Phase 2: Core Features (Days 3-7)
1. **User Profile** - View, edit, photo upload
2. **Discovery** - Swipe interface, filters
3. **Likes & Matches** - Like/unlike, view matches
4. **Chat** - Real-time messaging (polling or WebSocket)
5. **Dashboard** - Stats overview

### Phase 3: Premium Features (Days 8-10)
1. **Subscriptions** - Stripe/payment integration
2. **Guaranteed Dating** - $50 service request flow
3. **Boosts & Spotlight** - Bidding interface
4. **Dating Tips** - Blog content display

### Phase 4: Polish (Days 11-14)
1. **Push Notifications** - OneSignal integration
2. **Biometric Auth** - Face ID/Touch ID
3. **Deep Linking** - Handle app URLs
4. **Animations & Transitions**
5. **Testing** - Unit, integration, E2E
6. **Performance Optimization**

---

## 🔍 UNDERSTANDING THE BACKEND

### Technology Stack
- **Framework**: Next.js 15 (React-based)
- **Database**: MongoDB Atlas
- **Authentication**: JWT with 7-day expiry
- **File Storage**: HostGator (S3 fallback available)
- **Email**: Resend
- **SMS**: Termii + Twilio
- **Payments**: Stripe (pending configuration)

### API Architecture
- **RESTful JSON APIs** - Standard HTTP methods
- **Bearer Token Auth** - JWT in Authorization header
- **Consistent Responses** - Standardized error format
- **Pagination Support** - limit/offset query params
- **Rate Limiting** - 100 req/min default

### Key Design Decisions
1. **Polling for Chat** - Currently no WebSocket (can add later)
2. **Free vs Premium** - Many features gate behind subscription
3. **Tribe-First Matching** - Primary tribe gets priority
4. **Profile Views** - Tracked and visible to users
5. **Guaranteed Dating** - Premium $50 service with 30-day match promise
6. **Credits System** - Used for boosts, spotlight, gifts

---

## 📱 FEATURE REQUIREMENTS

### Must-Have (MVP - Phase 1: 12 screens)
- [ ] Splash Screen
- [ ] Welcome Screen
- [ ] Authentication (Login, Signup screens)
- [ ] Home Dashboard
- [ ] Discovery/Swipe Interface
- [ ] Profile View (Other User)
- [ ] My Profile Screen
- [ ] Chat List Screen
- [ ] Chat Conversation Screen
- [ ] Bottom Navigation
- [ ] Top Navigation
- [ ] Basic Settings

### Should-Have (Launch - Phase 2-3: 35 screens)
- [ ] Authentication (Login, Signup, Password Reset)
- [ ] Profile Management (View, Edit, Photos)
- [ ] Discovery/Swipe Interface
- [ ] Likes & Matches
- [ ] Real-time Chat
- [ ] Push Notifications
- [ ] Premium Subscription
- [ ] Basic Settings

### Should-Have (Launch)
- [ ] Guaranteed Dating
- [ ] Dating Tips Blog
- [ ] Boosts & Spotlight
- [ ] Referrals & Rewards
- [ ] Profile Views
- [ ] Safety Features (Report, Block)
- [ ] Events (Browse, RSVP)

### Nice-to-Have (Post-Launch)
- [ ] Video Chat
- [ ] Voice Messages
- [ ] Icebreaker Questions
- [ ] Advanced Filters
- [ ] Offline Mode
- [ ] Dark Mode

---

## 🎨 DESIGN GUIDELINES

### Complete Screen Inventory
The app requires **71 unique screens** organized into:
- Authentication & Onboarding: 8 screens
- Main Dashboard Views: 14 screens
- Profile Management: 6 screens
- Discovery & Matching: 7 screens
- Messaging & Chat: 4 screens
- Likes & Engagement: 5 screens
- Premium Features: 9 screens
- Settings & Preferences: 8 screens
- Safety & Trust: 5 screens
- Modals & Overlays: 6 screens
- Empty States & Errors: 5 screens
- Navigation Components: 4 components

**Full details in MOBILE_SCREEN_INVENTORY.md**

### Design System
**Colors:**
- Purple gradient: #5B21B6 → #312E81 (background)
- Pink/coral accent: #FF6B9D → #F97316 (CTAs, active states)
- White text: #FFFFFF (primary text)
- Light purple: #C4B5FD (secondary text)

**Cards & Surfaces:**
- Glass-morphism effect (frosted semi-transparent)
- Border radius: 20px (consistent across all cards)
- Subtle purple/pink shadows for depth
- Smooth gradients and professional polish

**Typography:**
- Headings: Bold, 24-32px
- Body: Regular, 14-16px
- Small/Meta: 12-14px
- Font: SF Pro (iOS), Roboto (Android)

**Spacing:**
- Padding: 16-20px (within cards)
- Margins: 24-32px (between sections)
- Grid gaps: 12px

### Standard Navigation (ALL authenticated screens)

**Top Bar:**
- Left: "TribalMingle" logo (tappable, goes to home)
- Right (3 icons): 
  - Search icon 🔍 (opens search)
  - Notification/Megaphone icon 🔔 (shows notifications)
  - Profile Photo (circular, tappable, opens profile)

**Bottom Navigation:**
- Order: **Home | Matches | Chat | Like | Settings**
- Layout: Icon on top, text label below
- Special: **Chat icon is 30% larger than other icons**
- Active state: Coral fill (#FF6B9D) on active button
- Style: Clean, modern, consistent with gradient theme

**Note:** Top bar does NOT appear on:
- Splash screen
- Welcome screen
- Sign In screen
- Sign Up screen
- Profile Setup Wizard

### UI/UX Principles
1. **Native Feel** - Use platform-specific components where appropriate
2. **Fast Loading** - Skeleton screens, optimistic updates
3. **Clear CTAs** - Users should know what to do next
4. **Error Messages** - Human-friendly, actionable
5. **Empty States** - Beautiful screens when no data
6. **Premium Clarity** - Make it obvious what requires upgrade

### Color Palette
**Primary Colors:**
```
Purple Gradient: #5B21B6 → #312E81
Pink/Coral Accent: #FF6B9D → #F97316
White: #FFFFFF
Light Purple: #C4B5FD
```

**From Web App (for reference):**
```
Primary: #8B5CF6 (Purple)
Secondary: #EC4899 (Pink)
Accent: #F59E0B (Gold/Orange)
Background: #FFFFFF
Surface: #F9FAFB
Text: #111827, #6B7280, #9CA3AF
```

**Mobile Design:** Use the vibrant purple/pink gradients as primary, with glass-morphism cards for modern polish.

### Typography
- **Headings**: Bold, clear hierarchy
- **Body**: 16px minimum for readability
- **Captions**: 14px for metadata
- **Accessibility**: Support dynamic type sizing

---

## 🔐 SECURITY CHECKLIST

Before any release:
- [ ] JWT tokens stored in secure storage (NOT AsyncStorage)
- [ ] HTTPS only (no HTTP fallback)
- [ ] Certificate pinning implemented
- [ ] No API keys hardcoded in app
- [ ] Biometric authentication available
- [ ] Auto-logout after inactivity
- [ ] Sensitive data cleared on logout
- [ ] Network requests use SSL/TLS
- [ ] Input validation on all forms
- [ ] XSS protection in chat messages

---

## 🧪 TESTING STRATEGY

### Types of Tests
1. **Unit Tests** - API functions, utilities
2. **Component Tests** - UI components in isolation
3. **Integration Tests** - Feature flows end-to-end
4. **E2E Tests** - Critical user journeys
5. **Manual Testing** - On real devices (iOS & Android)

### Test Scenarios
- [ ] New user signup flow
- [ ] Login with invalid credentials
- [ ] Profile photo upload
- [ ] Like/unlike users
- [ ] Send and receive messages
- [ ] Purchase subscription
- [ ] Submit guaranteed dating request
- [ ] Logout and token expiry

### Test Users
```
Email: test@example.com
Password: password123

Email: demo@tribalmingle.com
Password: demo123
```

---

## 📊 SUCCESS METRICS

Your mobile app should achieve:
- ✅ **100% API integration** - All endpoints working
- ✅ **95%+ feature parity** - Core features match web
- ✅ **<2s load time** - For most screens
- ✅ **99%+ crash-free rate** - Stable and reliable
- ✅ **4.5+ star rating** - App store reviews
- ✅ **Native UX** - Feels like a mobile-first app

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Submitting to App Stores
- [ ] All features tested on real devices
- [ ] Push notifications configured
- [ ] Deep linking works
- [ ] Privacy policy added
- [ ] Terms of service added
- [ ] App icons created (all sizes)
- [ ] Screenshots prepared (all device sizes)
- [ ] App Store descriptions written
- [ ] Beta testing completed (TestFlight/Google Play Beta)
- [ ] Analytics integrated
- [ ] Crash reporting enabled (Sentry)
- [ ] Performance monitoring active

### iOS Specific
- [ ] Code signing certificates
- [ ] Provisioning profiles
- [ ] TestFlight release
- [ ] App Store Connect metadata
- [ ] App Review guidelines followed

### Android Specific
- [ ] Keystore generated
- [ ] Google Play Console setup
- [ ] Internal testing track
- [ ] Production release AAB
- [ ] Google Play guidelines followed

---

## 📞 GETTING HELP

### Resources Available
1. **Web App Source Code**: https://github.com/tribalmingle/webapp
2. **API Documentation**: See `API_ENDPOINTS.md`
3. **Type Definitions**: Copy from `types/` folder in web repo
4. **Constants**: See `lib/constants/` in web repo
5. **Test API**: https://tribalmingle.vercel.app/api

### When Stuck
1. Check the web app's implementation in `app/` folder
2. Test the endpoint using Postman/curl
3. Review error responses (they're descriptive)
4. Check if feature requires premium subscription
5. Verify JWT token is valid and not expired

### Common Issues & Solutions

**Problem**: 401 Unauthorized  
**Solution**: Token expired or missing. Re-login to get new token.

**Problem**: Empty discovery queue  
**Solution**: Adjust filters or check if user's profile is complete.

**Problem**: Blurred likes/views  
**Solution**: Expected behavior for free users. Premium required.

**Problem**: Upload failing  
**Solution**: Check file size (<5MB), format (JPEG/PNG), and Authorization header.

**Problem**: Messages not updating  
**Solution**: Implement polling (fetch every 3 seconds) or add WebSocket support.

---

## 🎯 FINAL INSTRUCTIONS

### Before You Write Any Code:
1. ✅ **Read MOBILE_SCREEN_INVENTORY.md** - Understand all 71 screens
2. ✅ **Review AI_SCREEN_DESIGN_PROMPTS.md** - See design system and UI patterns
3. ✅ **Read README.md completely** - Understand architecture
4. ✅ **Skim through API_ENDPOINTS.md** (reference it as you build)
5. ✅ **Review API_CREDENTIALS.md** for security
6. ✅ **Test login endpoint** with Postman/curl
7. ✅ **Copy TypeScript types** from web repo

### As You Build:
- 🔍 **Reference API_ENDPOINTS.md** constantly
- 🧪 **Test on real devices** frequently
- 📝 **Document any API issues** you discover
- 🐛 **Report bugs** to backend team (if any)
- 💬 **Ask questions** when API behavior is unclear

### Your Success Criteria:
You've succeeded when:
1. ✅ Users can do everything on mobile that they can on web
2. ✅ The app feels fast and native (not like a web wrapper)
3. ✅ Authentication is secure and seamless
4. ✅ Real-time features work smoothly
5. ✅ Premium features drive upgrade conversions
6. ✅ Users leave 5-star reviews

---

## 💪 YOU'VE GOT THIS!

The backend is solid. The APIs are clean. The documentation is comprehensive. You have everything you need to build an amazing mobile app.

**Now go build something incredible!** 🚀📱✨

---

**Last Updated**: December 26, 2025  
**Questions**: Refer to documentation or test against production API

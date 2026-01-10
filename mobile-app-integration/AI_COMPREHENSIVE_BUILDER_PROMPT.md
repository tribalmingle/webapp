# AI Comprehensive Screen Builder Prompt

**Date:** December 28, 2025  
**Purpose:** Build all 71 mobile app screens based on 17 reference designs  
**Target:** AI Screen Design System  
**Priority:** CRITICAL - Complete Mobile App Implementation

---

## 🎯 YOUR MISSION

You are an expert mobile app designer tasked with building **all 73 screens** for the TribalMingle dating app. You have been provided with **17 reference screen designs** (local image files) that establish the visual style, creativity, and user experience for the entire app.

**Reference Images Provided (17 screens):**

**📸 Onboarding & Authentication (6 screens):**
1. `splash.jpeg` - Splash screen with branding
2. `Welcome.jpeg` - Welcome screen 1
3. `Welcome 2.jpeg` - Welcome screen 2  
4. `Welcome 3.jpeg` - Welcome screen 3
5. `Sign up form.jpeg` - Sign up registration screen
6. `Sign in.jpeg` - Sign in login screen

**📸 Profile Setup (1 screen):**
7. `Profile setup.jpeg` - Profile setup wizard screen

**📸 Discovery & Home (3 screens):**
8. `discover.png` - Discover feed with swipeable cards
9. `discover2.jpeg` - Discover feed alternate view
10. `home.jpeg` - Home dashboard screen

**📸 Matches (4 screens):**
11. `MATCHES.jpeg` - Matches overview screen
12. `Matches List.jpeg` - Matches list view
13. `Match Profile View.jpeg` - Individual match profile
14. `Likes.jpeg` - Likes/Who Liked You screen

**📸 Chat (1 screen):**
15. `chat list.jpeg` - Chat conversations list

**📸 Profile & Settings (2 screens):**
16. `profile edit.jpeg` - Profile edit screen
17. `preferences.jpeg` - Settings/preferences screen

---

**Your task:**
1. **ANALYZE** the 17 reference screen images from the file paths above
2. **EXTRACT** the complete design system (colors, typography, components, spacing, creative elements)
3. **RECREATE** designs matching the 17 reference images pixel-perfect
4. **BUILD** all remaining screens (56 screens) using the same design excellence
5. **INTEGRATE** with existing backend APIs for all functionality
6. **MAINTAIN** perfect consistency across all 73 screens

---

## 📚 STEP 1: Analyze the 17 Reference Screen Images

### What You're Working With

You have **17 screen design images** covering multiple categories:
- ✅ **Splash & Onboarding (4 screens):** splash.jpeg, Welcome.jpeg, Welcome 2.jpeg, Welcome 3.jpeg
- ✅ **Authentication (2 screens):** Sign up form.jpeg, Sign in.jpeg
- ✅ **Profile Setup (1 screen):** Profile setup.jpeg
- ✅ **Discover (2 screens):** discover.png, discover2.jpeg
- ✅ **Home (1 screen):** home.jpeg
- ✅ **Matches (4 screens):** MATCHES.jpeg, Matches List.jpeg, Match Profile View.jpeg, Likes.jpeg
- ✅ **Chat (1 screen):** chat list.jpeg
- ✅ **Settings/Profile (2 screens):** profile edit.jpeg, preferences.jpeg

**These 17 images establish the complete design language for the entire app.**

### Design System Elements Visible in References

From the discover.png image, we can see key design elements:
- **Background:** Vibrant purple-to-pink gradient (#7C3AED → #EC4899)
- **Cards:** Large glass-morphism effect with rounded corners (~20-24px radius)
- **Top Bar:** Dark purple pill-shaped bar with logo, search, messages, profile photo
- **Typography:** Bold white text for names, orange/yellow for tribe names
- **Buttons:** Circular X button (black/dark), circular heart button (orange gradient)
- **Navigation:** Bottom bar with Home | Matches | Like | Chat | Settings
- **Active State:** Orange gradient highlight (Settings button shown active)
- **Profile Images:** Circular thumbnails with orange/coral border rings

### How to Analyze Each Image

**Step 1: Visual Inspection**
For each image file, carefully examine:

### How to Analyze the Images

**Step 1: Visual Inspection**
For each image URL provided, carefully examine:

**Visual Design Elements:**
- Color palette: Identify all colors used (gradients, backgrounds, text, buttons)
- Typography: Font families, sizes, weights, and hierarchy
- Spacing & Layout: Padding, margins, alignment, grid system
- Card designs: Border radius, shadows, glass-morphism effects
- Icon style: Outline vs filled, size, color treatment
- Image treatments: Rounded corners, aspect ratios, overlays

**UI Components:**
- Button styles: Primary, secondary, tertiary variations
- Input field designs: Height, padding, border radius, focus states
- Card variations: Standard cards, premium cards, glass effects
- Modal designs: Overlay style, positioning, animations
- Navigation elements: Top bar, bottom nav, tab styling
- Loading states: Skeleton screens, spinners, progress indicators
- Empty state designs: Illustrations, messaging, CTAs

**Creative Elements:**
- African cultural integration: Patterns, colors, imagery
- Photo and image styling: Filters, borders, compositions
- Illustrations: Style, color treatment, usage patterns
- Animations: Transitions, micro-interactions, celebrations
- Emotional tone: How the design "feels" (welcoming, modern, cultural)
- Premium differentiation: How premium features are visually distinct

**Layout Patterns:**
- Information hierarchy: How content is prioritized
- Call-to-action placement: Button positioning, prominence
- Progressive disclosure: How information is revealed step-by-step
- Form layouts: Field arrangement, label positioning, validation display
- Navigation structure: Top bar, bottom nav, back buttons
- Screen header patterns: Titles, subtitles, progress indicators

**Step 2: Extract Measurements**
From the images, document specific measurements:
- Border radius (likely 20px for cards, 12px for buttons)
- Button heights (likely 48-52px for touch targets)
- Input field heights (likely 48-56px)
- Icon sizes (16px, 20px, 24px, 32px)
- Spacing scale (4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px)
- Font sizes (10px, 12px, 14px, 16px, 18px, 20px, 24px, 32px, 40px)

**Step 3: Color Extraction**
Use the images to identify the exact color palette:
- Primary purple gradient values
- Secondary pink/coral gradient values
- Success, warning, error, info colors
- Text colors (headings, body, captions, disabled)
- Background colors (dark mode, light mode)
- Border colors and divider colors

---

## 🎨 STEP 2: Extract Design System from Reference Images

After analyzing all 17 image URLs, create a comprehensive design system document:

### Color Palette (Extract from Images)
```
Based on visible reference (discover.png):
Primary Purple: #7C3AED (vibrant purple)
Primary Pink: #EC4899 (hot pink)
Gradient Background: #7C3AED → #EC4899 (purple to pink)
Accent Orange/Coral: #FF6B35 to #FF8C42 (tribe names, active states, borders)
Dark Navy/Purple: #1E1B4B to #2D1B69 (top bar, buttons)
White: #FFFFFF (text, icons)
Glass Card: rgba(255, 255, 255, 0.15) with backdrop-blur

[Extract additional colors from other images:]
Success Green: #______ (if visible)
Warning: #______ (if visible)
Error Red: #______ (if visible)
Text Gray: #______ (secondary text)
Border/Ring Orange: #FF6B35 (profile photo borders)
```

### Typography Scale (Extract from Images)
```
Heading 1: [Size]px, [Weight], [Color], [Line Height]
Heading 2: [Size]px, [Weight], [Color], [Line Height]
Heading 3: [Size]px, [Weight], [Color], [Line Height]
Body Large: [Size]px, [Weight], [Color], [Line Height]
Body Regular: [Size]px, [Weight], [Color], [Line Height]
Body Small: [Size]px, [Weight], [Color], [Line Height]
Caption: [Size]px, [Weight], [Color], [Line Height]
Button Text: [Size]px, [Weight], [Transform]
```

### Component Specifications (Extract from Images)
```
Button Primary:
  - Height: [X]px
  - Padding: [X]px horizontal
  - Border Radius: [X]px
  - Background: [Gradient or Color]
  - Text Color: [Color]
  - Font Weight: [Weight]
  - Shadow: [Values]

Button Secondary:
  - Height: [X]px
  - Border Radius: [X]px
  - Background: [Gradient or Color]
  - Border: [Width] [Color]

Input Field:
  - Height: [X]px
  - Padding: [X]px
  - Border Radius: [X]px
  - Border: [Width] [Color]
  - Focus State: [Color/Shadow]

Card Standard:
  - Border Radius: [X]px (likely 20px)
  - Padding: [X]px
  - Background: [Color/Gradient]
  - Shadow: [Values]
  - Backdrop Blur: [Value] (if glass-morphism)

Modal/Overlay:
  - Border Radius: [X]px
  - Backdrop: rgba(___,___,___,___)
  - Animation: [Type]
```

### Spacing System (Extract from Images)
```
xs: [X]px (small gaps)
sm: [X]px (between related elements)
md: [X]px (between sections)
lg: [X]px (screen padding)
xl: [X]px (large sections)
2xl: [X]px (major separations)
```

### Navigation Structure (Observed in Images)
```
Bottom Navigation (from discover.png):
  - Order: Home | Matches | Like | Chat | Settings
  - Active State: Orange gradient fill (#FF6B35)
  - Inactive State: White/light gray text
  - Spacing: Even distribution across bottom
  - Background: Dark semi-transparent bar

Top Bar (from discover.png):
  - Shape: Rounded pill (~30-40px height, full border radius)
  - Background: Dark purple/navy (#1E1B4B)
  - Logo: "TRIBAL MINGLE" with icon (left side)
  - Icons: Search, Messages (right side)
  - Profile Photo: Circular (far right)
  - Position: Top of screen with margin
```

---

## 📱 STEP 3: Build All 73 Screens

### Complete Screen Inventory

**Your workflow:**
1. **First:** Analyze all 17 provided images and extract the design system
2. **Second:** Recreate the 17 screens from the images (match pixel-perfect)
3. **Third:** Build the remaining 56 screens using the extracted design system

---

#### **1. Splash & Onboarding (4 screens) - 📸 IMAGES PROVIDED**
1. Splash Screen - `splash.jpeg` ✅
2. Welcome Screen 1 - `Welcome.jpeg` ✅
3. Welcome Screen 2 - `Welcome 2.jpeg` ✅
4. Welcome Screen 3 - `Welcome 3.jpeg` ✅

**Status:** 📸 **Match these images pixel-perfect**

---

#### **2. Authentication (8 screens) - 📸 2 PROVIDED, BUILD 6**
5. Sign Up Form - `Sign up form.jpeg` ✅
6. Sign In - `Sign in.jpeg` ✅
7. Sign Up Password - Password creation 🚀 **BUILD**
8. Sign Up Success - Welcome message 🚀 **BUILD**
9. Forgot Password - Email input 🚀 **BUILD**
10. Reset Password - New password 🚀 **BUILD**
11. OTP Verification - 6-digit code 🚀 **BUILD**
12. Phone Number - Phone registration 🚀 **BUILD**

**Status:** 📸 Match 2 images, build 6 more using design system

**APIs to integrate:**
- POST `/api/auth/signup` - User registration with email/password
- POST `/api/auth/signin` - User login
- POST `/api/auth/forgot-password` - Request password reset
- POST `/api/auth/reset-password` - Complete password reset
- POST `/api/auth/verify-otp` - Verify OTP code
- POST `/api/auth/send-otp` - Send OTP via SMS/email

---

#### **2. Profile Setup Wizard (11 screens) - 📸 SOME IMAGES PROVIDED, BUILD REST**
11. Photos Upload - Upload 1-10 profile photos 📸
12. ID Verification - Capture government ID (if in images) 📸
13. Selfie Verification - Live selfie capture (if in images) 📸
14. Location - Country + City selection 📸
15. Heritage - Country of origin + Tribe 📸
16. Personal Details - Height, body type, marital status, education 📸
17. Work - Occupation, work type 📸
18. Faith - Religion selection 📸
19. Interests - Multi-select interests (sports, music, etc.) 📸
20. Bio - Write personal bio (500 chars) 🚀 **BUILD using design system**
21. Looking For - Relationship goals and preferences 🚀 **BUILD using design system**

**Status:** 📸 **Match provided images for screens 11-19, build screens 20-21 from design system**

**APIs to integrate:**
- POST `/api/upload` - Upload photos (folder: 'profile', 'id-verification', 'selfie')
- GET `/api/countries` - Country list
- GET `/api/cities?country=X` - Cities by country
- GET `/api/tribes?country=X` - Tribes by country
- POST `/api/auth/signup` - Final registration submission with all data

---

#### **3. Home Dashboard (14 screens) - 🚀 BUILD ALL FROM DESIGN SYSTEM**
22. Discover Feed - Swipeable card stack with profiles
23. Profile Card Detail - Expanded profile view in discover
24. Matches Grid - Grid view of all matches
25. Match Detail - Single match profile view
26. New Match Modal - Celebration screen for new match
27. Activity Feed - Recent likes, views, profile visitors
28. Who Liked You - Grid of users who liked you (Premium feature)
29. Who Viewed You - List of profile viewers
30. Boost Active - Dashboard when boost is active
31. Super Like Sent - Confirmation screen after super like
32. Undo Last Swipe - Modal to undo with Premium
33. Filters Modal - Age, distance, height, tribe filters
34. Sort Options - Sort matches by recent, distance, etc.
35. Empty Discover - No more profiles in area

**Status:** 🚀 **Build all 14 screens using design system from references**

**APIs to integrate:**
- GET `/api/discover?page=1&limit=20` - Get profiles for discovery
- POST `/api/like` - Like a profile
- POST `/api/dislike` - Dislike a profile
- POST `/api/super-like` - Send super like
- GET `/api/matches` - Get all matches
- GET `/api/activity` - Get activity feed
- GET `/api/likes/received` - Get users who liked you (Premium)
- GET `/api/profile/views` - Get profile viewers
- POST `/api/boost/activate` - Activate profile boost
- POST `/api/undo-swipe` - Undo last swipe (Premium)

#### **4. Chat & Messaging (4 screens) - 🚀 BUILD ALL FROM DESIGN SYSTEM**
36. Chat List - All conversations with matches
37. Chat Conversation - 1-on-1 messaging interface
38. Message Request - Unmatched user message request
39. Chat Empty State - No conversations yet

**Status:** 🚀 **Build all 4 screens using design system from references**

**APIs to integrate:**
- GET `/api/chat/conversations` - Get all conversations
- GET `/api/chat/:conversationId/messages` - Get messages
- POST `/api/chat/:conversationId/messages` - Send message
- POST `/api/chat/read/:messageId` - Mark message as read
- WebSocket `/api/chat/socket` - Real-time messaging

#### **5. Profile & Settings (6 screens) - 🚀 BUILD ALL FROM DESIGN SYSTEM**
40. My Profile - Own profile view
41. Edit Profile - Edit all profile fields
42. Edit Photos - Manage profile photos (reorder, delete, add)
43. Settings Menu - Account, privacy, notifications, etc.
44. Notification Settings - Push, email, SMS preferences
45. Privacy Settings - Profile visibility, online status, read receipts

**Status:** 🚀 **Build all 6 screens using design system from references**

**APIs to integrate:**
- GET `/api/user/profile` - Get own profile
- PUT `/api/user/profile` - Update profile
- PUT `/api/user/photos` - Update profile photos
- GET `/api/user/settings` - Get user settings
- PUT `/api/user/settings` - Update settings
- PUT `/api/user/privacy` - Update privacy settings

#### **6. Premium Features (9 screens) - 🚀 BUILD ALL FROM DESIGN SYSTEM**
46. Premium Landing - Premium subscription overview
47. Premium Features List - Detailed feature breakdown
48. Pricing Plans - Monthly, 6-month, 12-month plans
49. Payment Method - Payment selection (card, mobile money)
50. Payment Success - Subscription confirmation
51. See Who Liked You - Premium feature showcase
52. Advanced Filters - Premium filters (education, religion, tribe)
53. Read Receipts - See when messages are read
54. Unlimited Rewinds - Undo unlimited swipes

**Status:** 🚀 **Build all 9 screens using design system from references**

**APIs to integrate:**
- GET `/api/premium/plans` - Get pricing plans
- POST `/api/premium/subscribe` - Create subscription
- POST `/api/payment/initialize` - Initialize payment
- GET `/api/payment/verify/:reference` - Verify payment
- GET `/api/user/subscription` - Get subscription status

#### **7. Safety & Trust (5 screens) - 🚀 BUILD ALL FROM DESIGN SYSTEM**
55. Safety Center - Trust & safety resources
56. Report User - Report user with reason selection
57. Block User - Block user confirmation
58. Verify Profile - ID verification flow
59. Safety Tips - Dating safety guidelines

**Status:** 🚀 **Build all 5 screens using design system from references**

**APIs to integrate:**
- POST `/api/report` - Report user
- POST `/api/block` - Block user
- GET `/api/blocked-users` - Get blocked users list
- POST `/api/verification/submit` - Submit verification
- GET `/api/safety/tips` - Get safety tips

#### **8. Community Features (4 screens) - 🚀 BUILD ALL FROM DESIGN SYSTEM**
60. Tribes List - Browse all tribes
61. Tribe Detail - Single tribe community view
62. Events List - Browse dating events
63. Event Detail - Single event details with RSVP

**Status:** 🚀 **Build all 4 screens using design system from references**

**APIs to integrate:**
- GET `/api/tribes` - Get all tribes
- GET `/api/tribes/:id` - Get tribe details
- POST `/api/tribes/:id/join` - Join tribe
- GET `/api/events` - Get all events
- GET `/api/events/:id` - Get event details
- POST `/api/events/:id/rsvp` - RSVP to event

#### **9. Concierge Service (3 screens) - 🚀 BUILD ALL FROM DESIGN SYSTEM**
64. Concierge Landing - Premium concierge service intro
65. Concierge Chat - 1-on-1 chat with dating concierge
66. Date Planning - Concierge date planning interface

**Status:** 🚀 **Build all 3 screens using design system from references**

**APIs to integrate:**
- POST `/api/concierge/request` - Request concierge service
- GET `/api/concierge/conversations` - Get concierge chats
- POST `/api/concierge/messages` - Send message to concierge

#### **10. Dating Tips (2 screens) - 🚀 BUILD ALL FROM DESIGN SYSTEM**
67. Dating Tips List - Browse all dating tips articles
68. Dating Tip Article - Single article view

**Status:** 🚀 **Build all 2 screens using design system from references**

**APIs to integrate:**
- GET `/api/dating-tips` - Get all tips
- GET `/api/dating-tips/:id` - Get single tip

#### **11. Boosts & Features (2 screens) - 🚀 BUILD ALL FROM DESIGN SYSTEM**
69. Boost Confirmation - Confirm boost purchase
70. Boost Active Status - Boost timer and stats

**Status:** 🚀 **Build all 2 screens using design system from references**

**APIs to integrate:**
- POST `/api/boost/purchase` - Purchase boost
- GET `/api/boost/status` - Get boost status

#### **12. Modals & Overlays (3 screens) - 🚀 BUILD ALL FROM DESIGN SYSTEM**
71. Match Celebration - Animated celebration for new match
72. Super Like Modal - Confirm super like usage
73. Filter Results - Results count for applied filters

**Status:** 🚀 **Build all 3 modals using design system from references**

**Note:** Modals should overlay existing screens with backdrop blur and animation

---

#### **13. Empty States (5 screens)**
**Status:** ✅ Empty states are integrated within main screens above (Chat Empty, Discover Empty, etc.)

---

## 📊 Screen Breakdown Summary

**Total Screens:** 73 (including Splash + Welcome)
- 📸 **Image References Provided:** ~17 screens
  - Splash Screen
  - Welcome Screen
  - Authentication: Sign Up, Sign In, Password screens
  - Profile Setup: Most wizard screens (Photos, Location, Heritage, etc.)
  
- 🚀 **To Build from Design System:** ~56 screens
  - Profile Setup: Bio, Looking For (2 screens)
  - Dashboard: All 14 screens
  - Chat: All 4 screens
  - Profile & Settings: All 6 screens
  - Premium: All 9 screens
  - Safety: All 5 screens
  - Community: All 4 screens
  - Concierge: All 3 screens
  - Dating Tips: All 2 screens
  - Boosts: All 2 screens
  - Modals: All 3 screens

**Your Process:**
1. 📸 **Phase 1:** Analyze 17 image URLs and extract complete design system
2. 📸 **Phase 2:** Recreate the 17 screens matching the provided images exactly
3. 🚀 **Phase 3:** Build remaining 56 screens using the extracted design system
4. 🔌 **Phase 4:** Integrate all backend APIs as documented

---

## 🔌 STEP 4: API Integration Guidelines

### Backend Base URL
```
https://tribalmingle.vercel.app/api
```

### Authentication
All authenticated requests must include JWT token:
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Common API Patterns

**GET Request Example:**
```typescript
const response = await fetch('https://tribalmingle.vercel.app/api/discover?page=1', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  }
})
const data = await response.json()
```

**POST Request Example:**
```typescript
const response = await fetch('https://tribalmingle.vercel.app/api/like', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ userId: targetUserId })
})
const data = await response.json()
```

**File Upload Example:**
```typescript
const formData = new FormData()
formData.append('file', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'photo.jpg',
} as any)
formData.append('folder', 'profile')

const response = await fetch('https://tribalmingle.vercel.app/api/upload', {
  method: 'POST',
  body: formData,
})
const data = await response.json()
```

### Error Handling
```typescript
try {
  const response = await fetch(url, options)
  const data = await response.json()
  
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Request failed')
  }
  
  return data
} catch (error) {
  console.error('API Error:', error)
  // Show user-friendly error message
  Alert.alert('Error', error.message || 'Something went wrong')
}
```

---

## 🎯 STEP 5: Design Consistency Rules

### Navigation Structure (Apply to ALL screens)

**Bottom Navigation Bar:**
- Home | Matches | Chat (30% larger icon) | Like | Settings
- Always visible except: Sign In, Sign Up, Onboarding, Full-screen modals
- Active tab: Purple gradient (#5B21B6)
- Inactive tabs: Gray (#9CA3AF)

**Top Bar:**
- Logo (left) | Search | Notifications | Profile (right)
- NOT visible on: Sign In, Sign Up, Onboarding screens
- Background: Transparent or subtle glass-morphism

### Universal Design Patterns

**Cards:**
- Border radius: 20px (consistent across all cards)
- Glass-morphism effect: rgba(255, 255, 255, 0.1) with backdrop-blur
- Shadow: 0 8px 32px rgba(0, 0, 0, 0.1)
- Padding: 16-24px

**Buttons:**
- Primary: Purple gradient (#5B21B6 → #312E81)
- Secondary: Pink gradient (#FF6B9D → #F97316)
- Tertiary: Outlined with purple border
- Border radius: 12px
- Height: 48px minimum for touch targets
- Font weight: 600 (semi-bold)

**Forms:**
- Input fields: 52px height, 16px padding, 12px border radius
- Labels: 14px, gray color, above input
- Error messages: Red (#EF4444), below input
- Validation: Real-time with debounce

**Images:**
- Profile photos: Circular or rounded square (20px radius)
- Cover images: 20px border radius
- Aspect ratios: 1:1 for profile, 16:9 for cover images

**Typography:**
- Headings: Bold (700), purple color
- Body text: Regular (400), dark gray
- Captions: Regular (400), light gray
- Line height: 1.5 for readability

---

## 🚀 STEP 6: Implementation Instructions

### For Each Screen You Build:

1. **Reference Analysis**
   - If image URL provided: Match it pixel-perfect
   - If no image: Apply extracted design system consistently
   - Identify which components to reuse from reference images
   - Note any unique patterns in that screen category

2. **Layout Construction**
   - Start with navigation (top bar + bottom nav if applicable)
   - Build main content area with proper spacing
   - Add call-to-action buttons at bottom

3. **Component Styling**
   - Apply color palette consistently
   - Use 20px border radius for cards
   - Add glass-morphism effects
   - Include hover/active states

4. **API Integration**
   - Identify required endpoints from list above
   - Add loading states (skeleton screens)
   - Add error states (retry options)
   - Add empty states (if no data)

5. **Interaction Design**
   - Add animations for transitions
   - Include haptic feedback (where appropriate)
   - Add confirmation modals for destructive actions
   - Include success celebrations

6. **Accessibility**
   - Touch targets minimum 44x44px
   - High contrast for text (WCAG AA)
   - Screen reader labels
   - Keyboard navigation support

7. **Responsive Design**
   - Support various screen sizes (small phones to tablets)
   - Adjust layout for landscape orientation
   - Scale images appropriately
   - Adjust font sizes for readability

---

## ✅ Quality Checklist (For Each Screen)

Before considering a screen "complete," verify:

- [ ] If reference image provided: Design matches image pixel-perfect
- [ ] If no reference: Design uses extracted system consistently
- [ ] Uses correct color palette (purple/pink gradients from images)
- [ ] Border radius matches reference images (likely 20px for cards)
- [ ] Glass-morphism effects applied (if present in references)
- [ ] Navigation bar present and matches reference style
- [ ] Correct API endpoints integrated
- [ ] Loading states designed
- [ ] Error states handled
- [ ] Empty states designed (if applicable)
- [ ] Success states celebrated
- [ ] Touch targets minimum 44px
- [ ] Text is readable (matches contrast from references)
- [ ] Images are properly sized (match reference proportions)
- [ ] Animations match style from references
- [ ] Back navigation works correctly
- [ ] Can handle network errors gracefully

---

## 📦 Deliverable Format

For each screen you build, provide:

1. **Screen Name & Number** (e.g., "20. Discover Feed")
2. **Visual Design** (high-fidelity mockup)
3. **Component Breakdown** (list of UI components used)
4. **API Endpoints** (which endpoints this screen calls)
5. **User Flow** (how user navigates to/from this screen)
6. **States** (normal, loading, error, empty, success)
7. **Animations** (describe any transitions or micro-interactions)

---

## 🎨 Creative Freedom Guidelines

While maintaining consistency with the 17 reference screens, you have creative freedom to:

**DO:**
- ✅ Adapt layouts for different content types
- ✅ Create unique empty state illustrations
- ✅ Design creative success celebrations
- ✅ Add delightful micro-interactions
- ✅ Incorporate African cultural elements tastefully
- ✅ Design premium features to feel luxurious
- ✅ Make error states friendly and helpful

**DON'T:**
- ❌ Change the color palette
- ❌ Use different border radius (must be 20px)
- ❌ Remove navigation components
- ❌ Change button hierarchy
- ❌ Use inconsistent spacing
- ❌ Ignore the API integration requirements
- ❌ Create designs that can't be implemented

---

## 📚 Required Reading (Study These Documents)

1. **MOBILE_SCREEN_INVENTORY.md** - Complete list of all 71 screens
2. **API_DOCUMENTATION.md** - Full API reference with all endpoints
3. **MOBILE_APP_PROMPT.md** - Core mobile app requirements
4. **AI_SCREEN_DESIGN_PROMPTS.md** - Existing screen design examples
5. **MOBILE_AUTH_BACKEND_RESPONSE.md** - Authentication implementation
6. **MOBILE_ID_VERIFICATION_GUIDE.md** - ID verification flow

---

## 🎯 Success Criteria

You have successfully completed this task when:

1. ✅ Design system fully extracted from 17 reference images
2. ✅ All 17 reference screens recreated pixel-perfect from images
3. ✅ All remaining 56 screens designed using extracted design system
4. ✅ Every screen integrates with correct API endpoints
5. ✅ Navigation is consistent across all screens
6. ✅ Loading, error, empty, and success states are designed for each screen
7. ✅ All screens are responsive and accessible
8. ✅ Design system is consistently applied
9. ✅ User flows are intuitive and logical
10. ✅ Premium features are visually differentiated
11. ✅ African cultural elements are tastefully integrated (as seen in references)

---

## 🚨 Important Notes

**Before You Start:**
- You will receive 17 screen design images via URLs
- Thoroughly analyze all image URLs first to extract the complete design system
- Document colors, typography, spacing, components before building anything
- Understand the user flows and navigation patterns established in the images
- Review the API documentation to understand data structures
- Note: The 17 image references cover Auth + Profile Setup; you'll create Dashboard, Chat, Premium, etc. from scratch using the extracted design system

**During Implementation:**
- Build screens in logical groupings (e.g., all authentication screens together)
- Reuse components across screens for consistency
- Test each screen's API integration as you build
- Keep track of which screens are complete

**Quality Over Speed:**
- Don't rush through screens
- Each screen should match the quality of the references
- Pay attention to details (spacing, alignment, colors)
- Ensure all interactive elements are designed

---

## 📞 Questions or Issues?

If you encounter any issues during implementation:

1. **Missing API endpoint?** Check API_DOCUMENTATION.md for alternatives
2. **Unclear design pattern?** Refer back to 17 reference screens
3. **Technical limitation?** Document it and propose alternative
4. **Inconsistency found?** Flag it and request clarification

---

**START WITH:** Analyzing all 17 reference image URLs to extract the complete design system. Document colors, typography, spacing, components, and creative patterns. Then recreate the 17 screens matching the images pixel-perfect. Finally, build all remaining screens systematically using the extracted design system.

**REMEMBER:** The reference images are your source of truth for the design language. Every new screen you create must feel like it came from the same design system. Pay attention to details - they matter.

---

**Document Created:** December 28, 2025  
**Version:** 2.0  
**Status:** Ready for AI Implementation (Image Analysis Mode)  
**Expected Timeline:** 3-4 weeks for analysis + all 73 screens  

🚀 **Provide the 17 image URLs and begin analysis immediately!**

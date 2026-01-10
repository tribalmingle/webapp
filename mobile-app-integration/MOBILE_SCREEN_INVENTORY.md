# Complete Mobile App Screen Inventory

**Based on:** TribalMingle Web App Analysis (tribalmingle.vercel.app)  
**Total Screens Estimated:** 65+ unique screens (70+ with variations)  
**Last Updated:** January 2025

---

## Screen Count Summary

| Category | Screen Count | Priority |
|----------|-------------|----------|
| **Authentication & Onboarding** | 8 | Critical |
| **Main Dashboard Views** | 14 | Critical |
| **Profile Management** | 6 | Critical |
| **Discovery & Matching** | 7 | Critical |
| **Messaging & Chat** | 4 | Critical |
| **Likes & Engagement** | 5 | High |
| **Premium Features** | 9 | High |
| **Settings & Preferences** | 8 | High |
| **Safety & Trust** | 5 | Medium |
| **Navigation Components** | 4 | Critical |
| **Modals & Overlays** | 6 | High |
| **Empty States & Errors** | 5 | Medium |
| **TOTAL** | **~71** | - |

---

## Navigation Structure

### Bottom Navigation (5 Primary Buttons + Settings Icon)
```
┌─────────────────────────────────────────────┐
│  [Home] [Discover] [Matches] [Like] [Chat]  │
│                                   [⚙️ Settings]│
└─────────────────────────────────────────────┘
```

### Top Navigation Bar
```
┌────────────────────────────────────────────┐
│ [Logo]           🔍  🔔  👤               │
└────────────────────────────────────────────┘
```

**Icons:**
- 🔍 Search
- 🔔 Notifications  
- 👤 Profile Photo (tappable)
- ⚙️ Settings (gear icon on bottom nav)

---

## Complete Screen Breakdown

## 1. Authentication & Onboarding (8 Screens)

### 1.1 **Splash Screen**
- **Route:** `/splash`
- **Description:** App logo with animated loading
- **Components:**
  - Animated logo
  - Loading indicator
  - Version number

### 1.2 **Welcome Screen**
- **Route:** `/welcome`
- **Description:** First-time user welcome with value proposition
- **Components:**
  - Hero image/video
  - Main headline: "Find Love Within Your Tribe"
  - Subtitle
  - "Sign Up" CTA button (primary)
  - "Log In" link (secondary)

### 1.3 **Sign Up Screen**
- **Route:** `/sign-up` or `/register`
- **Description:** Account creation form
- **Components:**
  - Name input
  - Email input
  - Password input (with strength indicator)
  - Confirm password input
  - Date of birth picker
  - Gender selector
  - Terms & conditions checkbox
  - "Create Account" button
  - "Already have account? Log In" link

### 1.4 **Login Screen**
- **Route:** `/login`
- **Description:** Existing user authentication
- **Components:**
  - Email/username input
  - Password input (with show/hide toggle)
  - "Remember me" checkbox
  - "Forgot Password?" link
  - "Log In" button
  - Social login options (Google, Apple)
  - "Don't have account? Sign Up" link

### 1.5 **Forgot Password Screen**
- **Route:** `/forgot-password`
- **Description:** Password reset request
- **Components:**
  - Email input
  - Instructions text
  - "Send Reset Link" button
  - "Back to Login" link

### 1.6 **Reset Password Screen**
- **Route:** `/reset-password`
- **Description:** Set new password after email verification
- **Components:**
  - New password input
  - Confirm password input
  - Password requirements list
  - "Reset Password" button

### 1.7 **Profile Setup Wizard (Multi-step)**
- **Route:** `/onboarding`
- **Description:** Complete profile setup after registration
- **Steps:**
  1. **Photo Upload** (upload 1-10 photos)
  2. **Location** (current residence: country + city)
  3. **Heritage** (country of origin + tribe)
  4. **Personal Details** (height, body type, marital status, education)
  5. **Work** (occupation, work type)
  6. **Faith** (religion)
  7. **Interests** (select from list)
  8. **Bio** (write about yourself)
  9. **Looking For** (relationship goals)
- **Components:**
  - Progress indicator (step X of 9)
  - Back button
  - Skip button (for non-required)
  - Next/Continue button

### 1.8 **Verification Pending Screen**
- **Route:** `/verification-pending`
- **Description:** Account created, awaiting admin approval
- **Components:**
  - Success icon
  - "Welcome to TribalMingle!" message
  - "Your account is under review" text
  - Estimated review time
  - "Continue" button (takes to limited dashboard)

---

## 2. Main Dashboard Views (13 Screens)

### 2.1 **Home Dashboard**
- **Route:** `/dashboard` or `/home`
- **Description:** Main feed with personalized content
- **Components:**
  - Top navigation bar (logo, search, notifications, profile)
  - **Premium Stats Cards** (4 cards):
    - Likes
    - Chats
    - Views
    - Matches
  - **Today's Matches Section**
    - Carousel of recommended profiles
    - Match percentage badge
    - Quick action buttons (Like, View, Chat)
  - **Who Likes You** (preview of 2 people)
    - Blurred for free users (after first)
    - Upgrade prompt overlay
  - **Testimonials** (free users only)
    - 3-6 success stories
    - Star ratings
    - User photos
  - **Inspirational Banner** (premium users)
    - Rotating motivational messages
  - **Upgrade CTA** (free users)
    - "Boost Visibility" banner
  - **Bottom navigation** (5 tabs + settings icon)

### 2.2 **Discover/Swipe View**
- **Route:** `/discover`
- **Description:** Tinder-style card swiping interface
- **Components:**
  - Top bar (back button, "Discover" title, filter icon)
  - **Profile Card Stack**:
    - Large profile photo (swipeable)
    - Name, age
    - Tribe badge
    - Location (city, country)
    - Bio preview
    - Interests tags
    - Match percentage
  - **Action Buttons** (bottom):
    - X icon (Pass/Dislike) - left
    - ❤️ icon (Like) - right
  - **Photo Gallery Dots** (if multiple photos)
  - Swipe left animation (pass)
  - Swipe right animation (like)
  - Match popup modal (if mutual like)

### 2.3 **Advanced Search/Filters Screen**
- **Route:** `/discover/filters`
- **Description:** Detailed search filters
- **Components:**
  - **Basic Filters:**
    - Age range slider (min/max)
    - Tribe selector (dropdown)
  - **Advanced Filters:**
    - Marital status
    - Country of residence
    - City of residence
    - Tribe (by country of origin)
    - Religion
    - Education
    - Work type
  - "Clear All" button
  - "Apply Filters" button (primary)
  - Close button

### 2.4 **Matches Screen**
- **Route:** `/matches`
- **Description:** List of mutual matches
- **Components:**
  - Grid layout (2 columns)
  - Match cards:
    - Profile photo
    - Name, age
    - Tribe
    - Match date/time
    - "View Profile" button
    - "Message" button
  - Empty state (no matches yet)
  - Pull to refresh

### 2.5 **Likes Screen (3 Tabs)**
- **Route:** `/likes`
- **Description:** Likes management with tabs
- **Tabs:**
  1. **Who Liked Me**
     - Grid of people who liked you
     - First person clear (free users)
     - Rest blurred with upgrade prompt
     - "Like Back" button
     - Time stamp (e.g., "2h ago")
  2. **I Liked**
     - People you've liked
     - "Unlike" option
     - Time stamp
  3. **Profile Views**
     - Who viewed your profile
     - Viewing duration (e.g., "5 min")
     - First view clear (free users)
     - Rest blurred with upgrade prompt
- **Components:**
  - Tab switcher at top
  - Grid layout (2-3 columns)
  - Empty states for each tab

### 2.6 **Chat/Messages List Screen**
- **Route:** `/chat` or `/messages`
- **Description:** Conversations inbox
- **Components:**
  - Search bar (find conversations)
  - Conversation list:
    - User avatar
    - Name
    - Last message preview
    - Unread count badge
    - Timestamp
    - Online status indicator (green dot)
  - First conversation visible (free users)
  - Rest blurred with upgrade CTA
  - Empty state (no conversations)
  - Pull to refresh

### 2.7 **Chat Conversation Screen**
- **Route:** `/chat/:userId`
- **Description:** 1-on-1 messaging interface
- **Components:**
  - **Header:**
    - Back button
    - User avatar
    - Name, age
    - City
    - Online status
  - **Message Thread:**
    - Date dividers (e.g., "Today", "Yesterday")
    - Sent messages (right-aligned, colored bubble)
    - Received messages (left-aligned, gray bubble)
    - Timestamps
    - First message visible (free users)
    - Rest blurred with upgrade prompt
  - **Input Area:**
    - Emoji picker button
    - Text input field
    - Send button
  - Free user restriction message:
    - "You can only send 1 message per person as free member"

### 2.8 **Profile View (Other User)**
- **Route:** `/profile/:userId` or `/user/:userId`
- **Description:** View another user's full profile
- **Components:**
  - **Photo Gallery:**
    - Main photo (large, fullscreen swipeable)
    - Photo count indicator (e.g., "3/5")
    - Photo dots
  - **Profile Info:**
    - Name, age
    - Verified badge (if verified)
    - Tribe badge
    - Location
    - Bio
    - Personal details (height, education, religion, etc.)
    - Interests tags
  - **Action Buttons:**
    - Like button
    - Message button
    - Report/Block (menu)
  - Back button

### 2.9 **My Profile Screen**
- **Route:** `/profile` or `/profile/me`
- **Description:** View and edit own profile
- **Components:**
  - Profile photo (large)
  - Verification status badge
  - Subscription plan badge
  - Name, username, email
  - "Edit Profile" button
  - Profile completeness indicator
  - Quick stats (likes, views, matches)
  - Bio
  - All profile fields (view mode)
  - Photos grid (1-10 photos)
  - "Manage Subscription" button
  - "Go to Settings" button

### 2.10 **Edit Profile Screen**
- **Route:** `/profile/edit`
- **Description:** Edit profile information
- **Components:**
  - **Photo Upload Section:**
    - Current photos (deletable, reorderable)
    - "Add Photos" button
    - Upload progress
    - Primary photo indicator
  - **Personal Details Section:**
    - Name input
    - Date of birth
    - Bio textarea
    - Gender selector
    - Marital status dropdown
    - Height dropdown
    - Body type selector
    - Education dropdown
    - Occupation input
    - Work type dropdown
    - Religion dropdown
    - Looking for selector
  - **Location Section:**
    - Country (current residence)
    - City (current residence)
  - **Heritage Section:**
    - Country of origin
    - Tribe dropdown (filtered by origin country)
  - **Interests Section:**
    - Multi-select checkboxes
    - Interest count indicator
  - "Save Changes" button (sticky at bottom)
  - "Cancel" button

### 2.11 **Settings Screen**
- **Route:** `/settings`
- **Description:** App settings and preferences
- **Sections:**
  1. **Account**
     - Edit Profile
     - Subscription & Billing
  2. **Notifications**
     - Email notifications toggle
     - Push notifications toggle
  3. **Privacy & Safety**
     - Profile visibility dropdown
     - Show online status toggle
     - Allow messages toggle
     - Blocked members list
  4. **Security**
     - Change password
     - Two-factor authentication
  5. **Support & Legal**
     - Help Center
     - Safety Tips
     - Terms of Service
     - Privacy Policy
  6. **Log Out** button (red)

### 2.12 **Notifications Screen**
- **Route:** `/notifications`
- **Description:** Activity notifications
- **Components:**
  - Notification list:
    - Icon (like, message, match, view)
    - Message text
    - User avatar (if applicable)
    - Timestamp
    - Read/unread indicator
  - Mark all as read button
  - Empty state (no notifications)
  - Pull to refresh

### 2.13 **Search Screen**
- **Route:** `/search`
- **Description:** Global user search
- **Components:**
  - Search bar (name, city, tribe)
  - Filter options (inline)
  - Results grid (2 columns)
  - User cards:
    - Photo
    - Name, age
    - Tribe
    - Location
    - Like button
    - View button
  - Empty state (no results)
  - Loading skeleton

### 2.14 **Submit Testimonial Screen**
- **Route:** `/testimonials/submit`
- **Description:** Users (especially premium) share success stories
- **Access:** 
  - Triggered automatically for premium users after activity
  - Accessible from Settings > Share Your Story
  - Can be accessed from Profile menu
- **Components:**
  - **Header:**
    - Back button
    - "Share Your Story" title
    - Close icon
  - **User Info Preview:**
    - Profile photo (auto-filled)
    - Name (auto-filled)
    - Age (auto-filled)
    - Tribe (auto-filled)
    - City, Country (auto-filled)
  - **Rating Section:**
    - "Rate your experience" label
    - 5 star rating selector (interactive, 1-5)
    - Selected stars highlighted in gold
  - **Testimonial Content:**
    - "Your Story" label
    - Multi-line text area
    - Placeholder: "Share your Tribal Mingle experience with the community..."
    - Character counter (e.g., "0/500")
    - Minimum character requirement indicator
  - **Privacy Notice:**
    - Info box explaining:
      - "Your testimonial will be reviewed by our team"
      - "We may feature it on our website and app"
      - "You can remain anonymous or share your full profile"
    - Anonymous option checkbox
  - **Action Buttons:**
    - "Submit Testimonial" button (primary, disabled until valid)
    - "Cancel" or "Maybe Later" button (secondary)
  - **Validation:**
    - Rating required (must select stars)
    - Testimonial text required (min 50 characters)
    - Error messages inline
  - **Success State:**
    - Confirmation modal after submission
    - "Thank you for sharing!" message
    - "Our team will review it shortly"
    - Return to previous screen
- **User Types:**
  - **Premium Users:** Prompted periodically (e.g., after successful match)
  - **Free Users:** Can still submit, but less prominently featured

---

## 3. Premium Features (9 Screens)

### 3.1 **Subscription Plans Screen**
- **Route:** `/subscription` or `/upgrade`
- **Description:** View and purchase subscription plans
- **Components:**
  - Current plan indicator
  - **Plan Cards** (4 cards):
    - Free (grey gradient)
    - Monthly £15 (blue gradient)
    - 3 Months £35 (purple gradient, "Most Popular" badge)
    - 6 Months £60 (orange gradient)
  - Each card shows:
    - Icon
    - Plan name
    - Price
    - Period/savings
    - Features list (with checkmarks)
    - "Select Plan" button (or "Current Plan" if active)
  - **Wallet Checkout Section:**
    - Apple Pay button
    - Google Pay button
    - Availability status by region
  - "Restore Purchases" link (iOS)

### 3.2 **Payment Checkout Screen**
- **Route:** `/checkout`
- **Description:** Payment processing
- **Components:**
  - Selected plan summary
  - Price breakdown
  - Payment method selector:
    - Apple Pay
    - Google Pay
    - Credit/Debit Card
    - Paystack (for some regions)
  - Card input form (if card selected)
  - "Complete Purchase" button
  - Secure payment badges

### 3.3 **Boost/Spotlight Screen**
- **Route:** `/boost` or `/spotlight`
- **Description:** Boost auction bidding
- **Components:**
  - **Header:**
    - "Boost Spotlight" title
    - Credits available display
    - Refresh button
  - **Region & Placement Selectors:**
    - Locale dropdown (Africa West, East, Diaspora EU/NA)
    - Placement dropdown (Spotlight, Travel, Event)
  - **Current Window Info:**
    - Window timing
    - Min bid amount
    - Your pending bid (if any)
    - Auto-rollover status
  - **Active Boosts:**
    - List of currently running boosts
    - End times
  - **Bid History:**
    - Recent bids
    - Status (active, won, lost, refunded)
  - **Place Bid Form:**
    - Bid amount input (credits)
    - Min bid requirement
    - Auto-rollover checkbox
    - "Submit Bid" button
  - Info text about how it works

### 3.4 **Referral Program Screen**
- **Route:** `/referrals`
- **Description:** Referral tier progress and rewards
- **Components:**
  - **Referral Code Card:**
    - Your unique referral code (large, copyable)
    - Share link (copyable)
    - "Copy Code" button
    - "Copy Link" button
  - **Invite Stats:**
    - Pending invites count
    - Successful invites count
    - Rewarded count
    - Total sent count
    - Rolling 90-day count
  - **Tier Ladder:**
    - List of tiers (Novice, Advocate, Champion, Elite)
    - Each tier shows:
      - Lock/unlock status
      - Required successful invites
      - Member reward
      - Guardian reward (if applicable)
  - **Next Milestone Card:**
    - Next tier name
    - Invites remaining
    - Rewards preview
  - **Invite Contacts Button:**
    - Opens invite modal
  - **Preview Landing Page Button:**
    - Opens referral link in browser

### 3.5 **Referral Invite Modal**
- **Route:** Modal overlay on `/referrals`
- **Description:** Send direct referral invitations
- **Components:**
  - Invitee email input (required)
  - Invitee name input (optional)
  - Guardian email input (optional)
  - Custom message textarea (optional)
  - "Send Invite" button
  - "Cancel" button
  - Loading state during submission
  - Error messages
  - Success confirmation

### 3.6 **Guaranteed Dating Screen**
- **Route:** `/guaranteed-dating`
- **Description:** $50 guaranteed match service
- **Components:**
  - **Hero Pricing Card:**
    - "$50" large display
    - "One-Time Fee" label
    - "Independent of subscription" note
  - **How It Works Section:**
    - 5-step process with numbered icons
    - Detailed explanation of each step
  - **Active Request Status** (if user has one):
    - Request status (pending, matched, expired)
    - Days remaining countdown
    - Match info (if found)
    - Request refund button (if eligible)
  - **Request Form** (if no active request):
    - Love languages (select 1-2)
    - Ideal date activities (checkboxes)
    - Deal breakers (checkboxes)
    - Communication style
    - Conflict resolution style
    - Family plans
    - Religious practice level
    - Political views
    - Dating goals
    - Ideal first date description
    - Must-have qualities
    - Additional notes
    - "Submit Request ($50)" button
  - **Request History:**
    - Past requests list
    - Outcome status
    - Date submitted

### 3.7 **Guaranteed Dating Request Confirmation**
- **Route:** `/guaranteed-dating/confirm`
- **Description:** Confirm payment and submission
- **Components:**
  - Request summary
  - "$50 charge" confirmation
  - Terms reminder (30-day guarantee)
  - Payment method selector
  - "Confirm & Pay" button
  - "Edit Request" button

### 3.8 **Credits/Wallet Screen** (Future)
- **Route:** `/credits` or `/wallet`
- **Description:** Buy and manage credits for boosts
- **Components:**
  - Current credit balance (large display)
  - Credit packages:
    - 100 credits - £10
    - 500 credits - £40
    - 1000 credits - £70
  - "Buy Credits" buttons
  - Transaction history
  - How credits work (info section)

### 3.9 **Credits/Wallet Screen** (Future Feature)
- **Route:** `/credits` or `/wallet`
- **Description:** Buy and manage credits for boosts
- **Components:**
  - Current credit balance (large display)
  - Credit packages:
    - 100 credits - £10
    - 500 credits - £40
    - 1000 credits - £70
  - "Buy Credits" buttons
  - Transaction history
  - How credits work (info section)

**Note:** Testimonial Submission is covered in detail in Section 2.14

---

## 4. Safety & Trust (5 Screens)

### 4.1 **Safety & Verification Screen**
- **Route:** `/safety`
- **Description:** Safety resources and verification status
- **Components:**
  - **Verification Status Card:**
    - Verified badge (green checkmark)
    - Or "Verification Pending" (yellow clock)
    - Status message
    - "Start Verification" button (if not verified)
  - **Safety Tips Grid:**
    - 6 tip cards with icons:
      - Verify profiles
      - Keep personal info private
      - Chat on platform first
      - Meet in public places
      - Trust your instincts
      - Block & report
  - **Report Concerns Section:**
    - "Report a User" button (red)
    - "Safety Guidelines" button
  - Help contact info

### 4.2 **Report User Screen**
- **Route:** `/report/:userId`
- **Description:** Report inappropriate behavior
- **Components:**
  - User being reported (name, photo)
  - Reason selector (dropdown):
    - Fake profile/scam
    - Inappropriate messages
    - Harassment
    - Offensive photos
    - Other
  - Description textarea
  - Evidence upload (optional)
  - "Submit Report" button
  - Cancel button
  - Confirmation that report is anonymous

### 4.3 **Block User Screen**
- **Route:** `/block/:userId`
- **Description:** Block a user
- **Components:**
  - User being blocked (name, photo)
  - Explanation text
  - Checkbox confirmations:
    - They won't see your profile
    - They can't message you
    - You won't see them
  - "Block User" button (red)
  - "Cancel" button

### 4.4 **Blocked Users List Screen**
- **Route:** `/settings/blocked`
- **Description:** Manage blocked users
- **Components:**
  - List of blocked users:
    - Avatar
    - Name
    - Block date
    - "Unblock" button
  - Empty state (no blocked users)

### 4.5 **Safety Guidelines Screen**
- **Route:** `/safety/guidelines`
- **Description:** Comprehensive safety information
- **Components:**
  - Guidelines list (long scrollable page)
  - Expandable sections
  - Contact support button
  - Emergency resources

---

## 5. Empty States & Errors (5 Screens)

### 5.1 **No Internet Connection Screen**
- **Description:** Offline error state
- **Components:**
  - Wifi icon with X
  - "No Internet Connection" message
  - "Please check your connection and try again"
  - "Retry" button

### 5.2 **Server Error Screen**
- **Description:** API/server error
- **Components:**
  - Error icon
  - "Something went wrong" message
  - Error code (optional)
  - "Try Again" button
  - "Contact Support" link

### 5.3 **Empty Matches Screen**
- **Description:** No matches yet
- **Components:**
  - Heart icon (faded)
  - "No matches yet" message
  - "Complete your profile to get better matches"
  - "Complete Profile" button

### 5.4 **Empty Chat Screen**
- **Description:** No conversations
- **Components:**
  - Message icon (faded)
  - "No conversations yet" message
  - "Start chatting with people you like!"
  - "Discover People" button

### 5.5 **Empty Notifications Screen**
- **Description:** No notifications
- **Components:**
  - Bell icon (faded)
  - "No notifications" message
  - "You're all caught up!"

---

## 6. Modals & Overlays (6 Screens)

### 6.1 **Match Confirmation Modal**
- **Trigger:** When mutual like occurs
- **Components:**
  - Celebratory animation (hearts, confetti)
  - "It's a Match!" headline
  - Both user photos side by side
  - Names
  - "Send Message" button (primary)
  - "Keep Swiping" button (secondary)
  - Close icon

### 6.2 **Upgrade/Premium Prompt Modal**
- **Trigger:** Various paywalls (likes, views, chats)
- **Components:**
  - Crown icon
  - "Upgrade to Premium" headline
  - Benefit text
  - Pricing preview
  - "View Plans" button
  - "Maybe Later" button
  - Close icon

### 6.3 **Photo Gallery Modal**
- **Trigger:** Tap on profile photo
- **Components:**
  - Fullscreen photo viewer
  - Swipe left/right for multiple photos
  - Photo counter (e.g., "2 / 5")
  - Close button
  - Black overlay background

### 6.4 **Advanced Search Modal**
- **Trigger:** Filter icon on Discover screen
- **Components:**
  - (Same as Advanced Search Screen above)
  - Full-screen modal on mobile
  - Slide up animation

### 6.5 **Testimonial Prompt Modal**
- **Trigger:** Premium users after certain activity (e.g., successful match, after 1 month of subscription)
- **Type:** Bottom sheet or card overlay
- **Components:**
  - Sparkle/heart icon
  - "Share Your Story" headline
  - Subtext: "Help others in our community find love. Share your experience!"
  - "Share Now" button (opens full Submit Testimonial Screen - 2.14)
  - "Maybe Later" link (dismisses for now)
  - "Don't ask again" checkbox (optional)
- **Behavior:**
  - Non-blocking (can be dismissed)
  - Re-appears after certain interval if dismissed
  - Does NOT appear if user already submitted testimonial
- **Note:** This modal is just a prompt - full submission happens on dedicated screen (2.14)

### 6.6 **Confirmation Dialog**
- **Trigger:** Destructive actions (logout, unlike, block, etc.)
- **Components:**
  - Alert icon
  - Confirmation message
  - "Are you sure?" text
  - "Confirm" button (red if destructive)
  - "Cancel" button

---

## 7. Navigation Components (4 Critical Components)

### 7.1 **Bottom Navigation Bar**
- **Persistent:** Yes (on all main screens)
- **Buttons (5):**
  1. Home icon
  2. Discover icon
  3. Matches icon (heart)
  4. Like icon
  5. Chat icon (with unread badge)
- **Extra:**
  - Settings gear icon (top right or floating)
- **Active state:** Highlighted/colored when selected

### 7.2 **Top Navigation Bar**
- **Persistent:** Yes (on most screens)
- **Components:**
  - Logo (left) - tappable, goes to home
  - Search icon (right side)
  - Notifications icon (with unread badge)
  - Profile photo (right-most)
- **Conditional:** May hide on certain full-screen views

### 7.3 **Back Button (Header)**
- **Persistent:** On detail/secondary screens
- **Components:**
  - Back arrow icon
  - Optional: Screen title

### 7.4 **Tab Bar (Within Screens)**
- **Example:** Likes screen with 3 tabs
- **Components:**
  - Tab labels
  - Active indicator (underline)
  - Swipeable content

---

## State Variations & Special Cases

### Free vs Premium User Views

Many screens have different states for free vs premium users:

| Screen | Free User | Premium User |
|--------|-----------|--------------|
| **Home Dashboard** | Shows upgrade CTAs, testimonials | Shows inspirational messages, no ads |
| **Likes (Who Liked Me)** | First person clear, rest blurred | All visible |
| **Profile Views** | First view clear, rest blurred | All visible |
| **Chat List** | First conversation clear, rest blurred | All conversations visible |
| **Chat Conversation** | Only 1 message visible per person | Full conversation visible |
| **Messages Sending** | Can send 1 message per person | Unlimited messages |

### Verification States

| Screen | Unverified | Pending | Verified |
|--------|------------|---------|----------|
| **Profile** | Yellow "Pending" badge | Yellow clock icon | Green checkmark badge |
| **Discover Cards** | No badge | N/A | Verified badge shown |
| **Safety Screen** | "Start Verification" CTA | "Under Review" status | "Verified" status |

### Subscription Plan Badge Colors

| Plan | Badge Color |
|------|-------------|
| Free | Grey |
| Monthly | Blue |
| 3 Months | Purple (Most Popular) |
| 6 Months | Orange/Red gradient |

---

## Screen Flow Examples

### Example 1: First-Time User Journey
```
1. Splash Screen → 2. Welcome Screen → 3. Sign Up Screen
→ 4. Profile Setup Wizard (9 steps) → 5. Verification Pending Screen
→ 6. Home Dashboard (limited view until verified)
```

### Example 2: Discover and Match
```
1. Home Dashboard → 2. Tap "Discover" → 3. Discover/Swipe View
→ 4. Swipe right on someone → 5. Match Confirmation Modal (if mutual)
→ 6. Tap "Send Message" → 7. Chat Conversation Screen
```

### Example 3: View Profile and Like
```
1. Home Dashboard → 2. Today's Matches card → 3. Tap user card
→ 4. Profile View (Other User) → 5. Tap "Like" button
→ 6. Like confirmed (toast notification) → 7. Back to Dashboard
```

### Example 4: Upgrade to Premium
```
1. Home Dashboard → 2. Tap blurred "Who Likes You" card
→ 3. Upgrade Prompt Modal → 4. Tap "View Plans"
→ 5. Subscription Plans Screen → 6. Select plan
→ 7. Payment Checkout Screen → 8. Complete purchase
→ 9. Success confirmation → 10. Return to Dashboard (now premium features unlocked)
```

### Example 5: Send Referral Invite
```
1. Home Dashboard → 2. Tap "Referrals" in navigation
→ 3. Referral Program Screen → 4. Tap "Invite Contacts"
→ 5. Referral Invite Modal → 6. Fill in email
→ 7. Tap "Send Invite" → 8. Success message
→ 9. Modal closes, return to Referral Program Screen
```

---

## Screen Priority for Development

### Phase 1: MVP Core (Critical - Week 1-2)
- [ ] Splash Screen
- [ ] Welcome Screen
- [ ] Login Screen
- [ ] Sign Up Screen
- [ ] Home Dashboard
- [ ] Discover/Swipe View
- [ ] Profile View (Other User)
- [ ] My Profile Screen
- [ ] Chat List Screen
- [ ] Chat Conversation Screen
- [ ] Bottom Navigation
- [ ] Top Navigation
- [ ] Submit Testimonial Screen (basic version)

### Phase 2: Engagement (High Priority - Week 3-4)
- [ ] Profile Setup Wizard
- [ ] Edit Profile Screen
- [ ] Matches Screen
- [ ] Likes Screen (3 tabs)
- [ ] Advanced Search/Filters
- [ ] Notifications Screen
- [ ] Match Confirmation Modal
- [ ] Upgrade Prompt Modal
- [ ] Photo Gallery Modal

### Phase 3: Premium & Monetization (Week 5-6)
- [ ] Subscription Plans Screen
- [ ] Payment Checkout Screen
- [ ] Boost/Spotlight Screen
- [ ] Referral Program Screen
- [ ] Referral Invite Modal
- [ ] Guaranteed Dating Screen
- [ ] Testimonial Submission

### Phase 4: Safety & Settings (Week 7)
- [ ] Safety & Verification Screen
- [ ] Report User Screen
- [ ] Block User Screen
- [ ] Settings Screen
- [ ] Forgot Password Screen
- [ ] Reset Password Screen
- [ ] Blocked Users List

### Phase 5: Polish & Edge Cases (Week 8)
- [ ] All Empty States
- [ ] Error Screens
- [ ] Loading States
- [ ] Skeleton Screens
- [ ] Confirmation Dialogs
- [ ] Toast Notifications

---

## Design System Requirements

### Color Palette
Based on web app analysis:
- **Primary Purple:** `#7C3AED` (purple-royal)
- **Gold Accent:** `#F59E0B` (gold-warm)
- **Background Primary:** `#FFFFFF` (light mode), `#0F172A` (dark mode)
- **Background Secondary:** `#F8FAFC` (light), `#1E293B` (dark)
- **Text Primary:** `#0F172A` (light), `#F8FAFC` (dark)
- **Border:** `#E2E8F0` (light), `#334155` (dark)

### Typography
- **Display Font:** System/Platform default (e.g., SF Pro on iOS, Roboto on Android)
- **Headings:** Bold, 24-32px
- **Body:** Regular, 14-16px
- **Small/Meta:** 12-14px

### Spacing
- **Section Spacing:** 32px
- **Card Padding:** 16px
- **Button Height:** 48px (touch target minimum 44px)
- **Bottom Navigation Height:** 60px

### Components to Build
- **Button:** Primary, Secondary, Outline, Destructive
- **Card:** Various styles (premium, standard, blurred)
- **Badge:** Color variants (purple, gold, grey, green)
- **Input:** Text, Email, Password, TextArea
- **Dropdown/Selector:** Native pickers
- **Checkbox:** Standard with label
- **Tab Bar:** Swipeable tabs
- **Modal:** Full screen and bottom sheet
- **Toast/Snackbar:** Success, Error, Info
- **Loading Indicator:** Spinner
- **Skeleton Screen:** Content placeholders

---

## API Endpoints Needed

All screens rely on the 200+ API endpoints documented in:
- `mobile-app-integration/API_ENDPOINTS.md`
- `mobile-app-integration/API_ROUTES_DIRECTORY.md`

**Key endpoint categories:**
- Authentication (`/api/auth/*`)
- User profile (`/api/profile/*`, `/api/users/*`)
- Discovery (`/api/users/discover`, `/api/matches/*`)
- Likes (`/api/likes/*`)
- Messages (`/api/messages/*`)
- Subscription (`/api/subscription/*`, `/api/payments/*`)
- Boosts (`/api/boosts/*`)
- Referrals (`/api/referrals/*`)
- Guaranteed Dating (`/api/guaranteed-dating/*`)
- Testimonials (`/api/testimonials/*`)1 unique screens** (including variations and modals). The mobile app will closely mirror the web app's functionality, with mobile-optimized UI/UX patterns.

**Important Note on Testimonials:**
The testimonial submission feature is strategically placed to encourage community engagement:
- Dedicated full screen (2.14) for complete experience
- Prompt modal (6.5) to encourage premium users
- Accessible from multiple entry points (Settings, Profile menu)
- Auto-populated with user info for convenience
- Reports (`/api/reports/*`)

---

## Conclusion

This inventory covers **approximately 70 unique screens** (including variations and modals). The mobile app will closely mirror the web app's functionality, with mobile-optimized UI/UX patterns.

**Recommended Approach:**
1. Build Phase 1 MVP first (core 12 screens)
2. Test with real users
3. Iterate based on feedback
4. Roll out premium features (Phase 3)
5. Polish and add safety features (Phase 4-5)

**Estimated Development Time:**
- **Phase 1 (MVP):** 2-3 weeks
- **Phase 2 (Engagement):** 2-3 weeks
- **Phase 3 (Premium):** 2 weeks
- **Phase 4 (Safety):** 1 week
- **Phase 5 (Polish):** 1 week
- **Total:** 8-10 weeks for initial release

**Next Steps:**
1. Review this inventory with your mobile team
2. Prioritize screens based on business goals
3. Use AI prompts document (next file) to generate screen designs
4. Build API integration layer first
5. Implement authentication flow
6. Build main dashboard
7. Iterate from there

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Maintained By:** TribalMingle Product Team

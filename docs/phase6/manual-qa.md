# Phase 6 Community & Gamification - Manual QA Checklist

## Test Environment Setup

### Prerequisites
- [ ] Staging environment deployed with Phase 6 features
- [ ] Redis server running (for leaderboard)
- [ ] MongoDB collections indexed
- [ ] Feature flags enabled: `community-beta`, `gamification-v1`, `insights-ai-coach`
- [ ] Three test accounts created (User A, User B, Admin)
- [ ] Socket.IO connection working

---

## 1. Events Platform

### 1.1 Event Listing & RSVP
- [ ] **TC-101**: User A views upcoming events at `/events`
  - Expected: Events sorted by date, shows capacity and RSVP count
  
- [ ] **TC-102**: User A RSVPs to event with available capacity
  - Expected: `POST /api/events/register` returns 200, RSVP confirmed
  
- [ ] **TC-103**: User B joins waitlist for full event
  - Expected: Status shows "waitlisted", email notification sent
  
- [ ] **TC-104**: User A cancels RSVP
  - Expected: Spot opens, first waitlisted user promoted

### 1.2 Event Reminders
- [ ] **TC-105**: Run `scripts/event-reminder-worker.ts` manually
  - Expected: Notifications sent 24h and 1h before event
  - Verify: Analytics event `notifications.event_reminder.sent`

### 1.3 Event Feedback
- [ ] **TC-106**: After event ends, User A submits feedback
  - Expected: `POST /api/events/feedback` creates community post
  - Verify: Post appears in `/community` feed

---

## 2. Community Hub

### 2.1 Post Creation
- [ ] **TC-201**: User A creates text post at `/community`
  - Expected: Post appears in feed immediately
  - Verify: Real-time Socket.IO event `post:created` received by User B
  
- [ ] **TC-202**: User A creates post with image attachment
  - Expected: Image uploaded to S3, thumbnail shown
  
- [ ] **TC-203**: Post body exceeds 5000 characters
  - Expected: API returns 400 validation error

### 2.2 Comments & Reactions
- [ ] **TC-204**: User B comments on User A's post
  - Expected: Comment appears, Socket.IO event `comment:created` sent
  
- [ ] **TC-205**: User B reacts with ❤️ to post
  - Expected: Reaction count increments, Socket.IO event `reaction:added`
  
- [ ] **TC-206**: User B unreacts (clicks heart again)
  - Expected: Reaction count decrements, Socket.IO event `reaction:removed`

### 2.3 Feed Filtering
- [ ] **TC-207**: Filter feed by tribe (e.g., "Navajo")
  - Expected: Only posts from Navajo members shown
  
- [ ] **TC-208**: Sort feed by "recent" vs "popular"
  - Expected: Order changes based on createdAt vs reaction count

---

## 3. Moderation

### 3.1 Content Flagging
- [ ] **TC-301**: User B flags User A's post as inappropriate
  - Expected: Post appears in moderation queue with `pending_review` state
  
- [ ] **TC-302**: Admin views moderation queue at `/admin/community/moderation`
  - Expected: Flagged posts and comments listed with context
  
- [ ] **TC-303**: Admin approves post
  - Expected: GraphQL mutation `moderateCommunityPost(action: "approve")` succeeds
  - Verify: Post status changes to `approved`, visible in feed
  
- [ ] **TC-304**: Admin rejects post with notes
  - Expected: Post hidden from feed, creator notified

### 3.2 Automated Safety
- [ ] **TC-305**: User A posts content with banned keywords
  - Expected: Post auto-flagged, enters moderation queue
  
- [ ] **TC-306**: User A posts normal content
  - Expected: No safety flags, post immediately visible

---

## 4. Gamification - Quests

### 4.1 Quest Progress
- [ ] **TC-401**: User A views quests at `/quests`
  - Expected: Daily, weekly, one-time quests listed with progress bars
  
- [ ] **TC-402**: User A sends first message (triggers `daily_first_message` quest)
  - Expected: Quest progress updates to 1/1, marked complete
  
- [ ] **TC-403**: User A RSVPs to event (triggers `daily_rsvp_event` quest)
  - Expected: Quest marked complete, shows "Ready to claim!"

### 4.2 Quest Claiming
- [ ] **TC-404**: User A claims completed quest
  - Expected: `POST /api/gamification/quests/{id}/claim` awards XP
  - Verify: User's XP balance increases (check wallet)
  
- [ ] **TC-405**: User A attempts to claim incomplete quest
  - Expected: API returns 400 "Quest not complete"
  
- [ ] **TC-406**: User A attempts to claim already-claimed quest
  - Expected: API returns 200 with `alreadyClaimed: true`, no XP awarded

### 4.3 Quest Reset
- [ ] **TC-407**: Run `scripts/gamification-reset-worker.ts` manually
  - Expected: Daily quests reset at midnight, weekly quests on Monday
  - Verify: Quest progress set to 0, `completedAt` cleared

---

## 5. Gamification - Leaderboard

### 5.1 Global Leaderboard
- [ ] **TC-501**: View global leaderboard at `/admin/gamification/leaderboard`
  - Expected: Top 50 users ranked by XP, shows rank/name/tribe/score
  
- [ ] **TC-502**: User A's XP increases (from quest claim)
  - Expected: Leaderboard position updates in real-time (Redis sorted set)

### 5.2 Tribe Leaderboard
- [ ] **TC-503**: Filter leaderboard by tribe (e.g., "Cherokee")
  - Expected: Only Cherokee members shown, ranked within tribe
  
- [ ] **TC-504**: User A views their own rank
  - Expected: API returns user's position even if outside top 50

### 5.3 Load Testing
- [ ] **TC-505**: Run K6 load test `scripts/load/leaderboard-k6.js`
  - Expected: p95 latency <500ms under 100 concurrent users
  - Verify: Error rate <10%

---

## 6. XP Wallet

### 6.1 Wallet Balance
- [ ] **TC-601**: User A views XP wallet (TBD: add UI or check via API)
  - Expected: Shows current balance, total earned, total spent
  
- [ ] **TC-602**: User A claims quest, XP transaction recorded
  - Expected: Transaction log includes amount, source (`quest`), reference (questId)

### 6.2 Spending XP (Future)
- [ ] **TC-603**: User A spends XP on virtual item
  - Expected: Balance decreases, `totalSpent` increments
  - Verify: Transaction with negative amount recorded

---

## 7. Insights Dashboard

### 7.1 Realtime Stats
- [ ] **TC-701**: Admin views insights at `/insights`
  - Expected: Shows activeUsers, onlineNow, coinsSpentToday, etc.
  
- [ ] **TC-702**: GraphQL query `statsRealtime` returns data
  - Expected: All fields populated with non-zero values (or realistic zeros)

### 7.2 Daily Snapshots
- [ ] **TC-703**: View daily trend chart (last 7 days)
  - Expected: Table shows date, activeUsers, giftsSent, subscriptions, referrals
  
- [ ] **TC-704**: GraphQL query `dailySnapshots(limit: 7)` returns array
  - Expected: Sorted by date descending

### 7.3 Analytics API
- [ ] **TC-705**: Call `GET /api/analytics/stats`
  - Expected: Returns activeUsers, eventCounts, funnel data
  
- [ ] **TC-706**: GraphQL query `analyticsEventCounts(startDate, endDate)`
  - Expected: Returns event types with counts for date range
  
- [ ] **TC-707**: GraphQL query `analyticsFunnel(steps, startDate, endDate)`
  - Expected: Returns funnel steps with counts and dropoff percentages

---

## 8. Feature Flags

### 8.1 Community Beta
- [ ] **TC-801**: Disable flag `community-beta`, reload `/community`
  - Expected: Page shows "Coming soon" or redirect
  
- [ ] **TC-802**: Enable flag for specific user, reload
  - Expected: Full community features accessible

### 8.2 Gamification V1
- [ ] **TC-803**: Disable flag `gamification-v1`, check `/quests`
  - Expected: Page shows "Feature not available"
  
- [ ] **TC-804**: Enable flag, verify quests load normally

### 8.3 Insights AI Coach
- [ ] **TC-805**: Disable flag `insights-ai-coach`, check `/insights`
  - Expected: Advanced AI features hidden or disabled

---

## 9. Real-time Events (Socket.IO)

### 9.1 Community Namespace
- [ ] **TC-901**: User A creates post, User B receives `post:created` event
  - Expected: User B's feed updates without refresh
  
- [ ] **TC-902**: User A adds comment, User B receives `comment:created`
  - Expected: Comment appears in real-time for User B
  
- [ ] **TC-903**: Admin moderates post, users receive `post:moderated` event
  - Expected: Post disappears from feed if rejected

---

## 10. Performance

### 10.1 Response Times
- [ ] **TC-1001**: Community feed loads in <2s with 100 posts
- [ ] **TC-1002**: Leaderboard API responds in <200ms
- [ ] **TC-1003**: Quest claim completes in <500ms
- [ ] **TC-1004**: GraphQL analytics query in <1s for 30-day range

### 10.2 Caching
- [ ] **TC-1005**: Leaderboard uses Redis caching
  - Expected: Second request returns cached data (check logs)

---

## 11. Error Handling

### 11.1 Network Errors
- [ ] **TC-1101**: Simulate MongoDB down, load community feed
  - Expected: Graceful error message, no stack trace exposed
  
- [ ] **TC-1102**: Simulate Redis down, load leaderboard
  - Expected: Falls back to MongoDB or shows error

### 11.2 Invalid Input
- [ ] **TC-1103**: Submit empty post body
  - Expected: API returns 400 with validation error
  
- [ ] **TC-1104**: Claim quest with invalid questId
  - Expected: API returns 404 "Quest not found"

---

## 12. Security

### 12.1 Authorization
- [ ] **TC-1201**: User A cannot moderate posts (non-admin)
  - Expected: GraphQL mutation returns permission error
  
- [ ] **TC-1202**: User A cannot delete User B's post
  - Expected: API returns 403 Forbidden

### 12.2 Rate Limiting
- [ ] **TC-1203**: User A creates 20 posts in 1 minute
  - Expected: API rate limit kicks in, returns 429

---

## Exit Criteria

- [ ] **All test cases passed** (100% completion)
- [ ] **No P0/P1 bugs open**
- [ ] **Performance tests meet SLA**
- [ ] **Security review approved**
- [ ] **Feature flags tested for rollout readiness**
- [ ] **Load test passed** (K6 results documented)

---

## Test Results Summary

| Category | Total Tests | Passed | Failed | Notes |
|----------|-------------|--------|--------|-------|
| Events | 6 | | | |
| Community | 8 | | | |
| Moderation | 6 | | | |
| Quests | 7 | | | |
| Leaderboard | 5 | | | |
| XP Wallet | 3 | | | |
| Insights | 7 | | | |
| Feature Flags | 5 | | | |
| Real-time | 3 | | | |
| Performance | 5 | | | |
| Errors | 4 | | | |
| Security | 3 | | | |
| **TOTAL** | **62** | | | |

---

**Tester**: _______________  
**Date**: _______________  
**Environment**: _______________  
**Build Version**: _______________

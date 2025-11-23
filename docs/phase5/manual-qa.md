# Phase 5 Messaging Platform - Manual QA Checklist

## Test Environment Setup

### Prerequisites
- [ ] Staging environment deployed with latest code
- [ ] Redis server running and accessible
- [ ] S3 bucket configured with test credentials
- [ ] LiveKit server available (or mock)
- [ ] Two test accounts created (User A, User B)
- [ ] Socket.IO connection working
- [ ] Feature flag `chat-phase5-core` enabled for test users

### Test Data
- User A: `test-user-a@tribalmingle.test`
- User B: `test-user-b@tribalmingle.test`
- Test thread ID: Create fresh thread between A & B

---

## 1. Voice Notes

### 1.1 Voice Note Upload
- [ ] **TC-001**: User A can record and send a voice note (30s)
  - Expected: Audio file uploads to S3, message appears in chat
  - Verify: `POST /api/chat/voice-note` returns 200 with S3 URL
  
- [ ] **TC-002**: Voice note appears for User B in real-time
  - Expected: Socket.IO event received, audio player displayed
  
- [ ] **TC-003**: User B can play voice note
  - Expected: Audio plays from S3 pre-signed URL
  
- [ ] **TC-004**: Rate limit enforced (6th voice note in 1 hour fails)
  - Expected: API returns 429 error with retry-after header
  
- [ ] **TC-005**: Large voice note (>10MB) rejected
  - Expected: API returns 400 error before S3 upload

### 1.2 Voice Note Metadata
- [ ] **TC-006**: Voice note shows duration and waveform data
  - Expected: Message metadata includes duration_seconds
  
- [ ] **TC-007**: Transcription placeholder exists
  - Expected: Message shows "Transcription pending..." (stub)

---

## 2. Real-time Translation

### 2.1 Translation Flow
- [ ] **TC-101**: User B can translate User A's English message to Spanish
  - Expected: `POST /api/chat/translate` returns Spanish translation
  - Verify: Translation appears inline without page reload
  
- [ ] **TC-102**: Second translation of same message returns cached result
  - Expected: Response header shows `x-cache: hit`, <50ms latency
  
- [ ] **TC-103**: GraphQL `translateMessage` mutation works
  - Expected: Returns `{ translatedText, cached }` object
  
- [ ] **TC-104**: User can toggle between original and translated
  - Expected: UI shows both versions clearly labeled

### 2.2 Translation Rate Limiting
- [ ] **TC-105**: 21st translation in 1 hour blocked
  - Expected: API returns 429 with clear error message
  
- [ ] **TC-106**: Cached translations don't count toward rate limit
  - Expected: User can view same translation unlimited times

### 2.3 Supported Languages
- [ ] **TC-107**: Test translation for: Spanish, French, Navajo, Cherokee
  - Expected: All return non-empty translations (mock or real)

---

## 3. LiveKit Video Integration

### 3.1 Token Generation
- [ ] **TC-201**: User A can generate LiveKit room token
  - Expected: `POST /api/chat/livekit-token` returns valid JWT
  - Verify: Token includes room name and participant metadata
  
- [ ] **TC-202**: User A can invite User B to video call
  - Expected: Socket.IO `livekit:invite` event sent to User B
  
- [ ] **TC-203**: User B receives call invite notification
  - Expected: Real-time toast/modal appears with join button

### 3.2 Room Creation
- [ ] **TC-204**: Room name follows pattern `thread-{threadId}`
  - Expected: Consistent naming for same thread
  
- [ ] **TC-205**: Metadata includes user profiles
  - Expected: Token metadata has userId, name, avatar

---

## 4. Message Recall

### 4.1 Recall Within Window
- [ ] **TC-301**: User A can recall message within 15 minutes
  - Expected: `POST /api/chat/recall` marks message as recalled
  - Verify: Message text changes to "[Message recalled]"
  
- [ ] **TC-302**: User B sees recalled message update in real-time
  - Expected: Socket.IO event triggers UI update
  
- [ ] **TC-303**: GraphQL `recallMessage` mutation works
  - Expected: Returns `{ success: true }`

### 4.2 Recall Window Expired
- [ ] **TC-304**: User A cannot recall message after 15 minutes
  - Expected: API returns error "Recall window closed"
  
- [ ] **TC-305**: Background job closes recall windows
  - Expected: Run `runMessageRecallWindowJob()` and verify `recallWindowClosed: true`

### 4.3 Analytics
- [ ] **TC-306**: Recalled messages tracked in analytics
  - Expected: Event `chat.message.recalled` appears in analytics dashboard

---

## 5. Disappearing Messages

### 5.1 Message Expiry
- [ ] **TC-401**: User A sends message with 1-minute expiry
  - Expected: Message includes `expiresAt` timestamp
  
- [ ] **TC-402**: Wait 1 minute, run `runDisappearingMessagesJob()`
  - Expected: Message status changes to "expired"
  - Verify: Content replaced with "[Message expired]"
  
- [ ] **TC-403**: User B sees expired message state
  - Expected: UI shows expiry indicator

### 5.2 Expiry Options
- [ ] **TC-404**: Test expiry options: 30s, 5m, 1h, 1d, 7d
  - Expected: All options set correct `expiresAt` value

---

## 6. Chat Safety

### 6.1 Content Scanning
- [ ] **TC-501**: Send message with suspicious pattern (e.g., phone number)
  - Expected: GraphQL `chatSafetyScan` returns warning nudge
  
- [ ] **TC-502**: Send message with blocked keyword
  - Expected: API returns block nudge with actionable guidance
  
- [ ] **TC-503**: Normal message passes safety check
  - Expected: No nudge returned, message sends normally

### 6.2 Safety Actions
- [ ] **TC-504**: Warning nudge shows "Are you sure?" dialog
  - Expected: User can proceed or cancel
  
- [ ] **TC-505**: Block nudge prevents message send
  - Expected: Message not saved, user sees educational content

### 6.3 Moderation Integration
- [ ] **TC-506**: Flagged message appears in moderation queue
  - Expected: Admin can review at `/admin/community/moderation`

---

## 7. Notifications

### 7.1 Message Notifications
- [ ] **TC-601**: User B receives notification when User A sends message
  - Expected: Push notification (if enabled) or in-app badge
  
- [ ] **TC-602**: Voice note notification includes waveform icon
  - Expected: Distinct notification style for voice vs text

### 7.2 Safety Notifications
- [ ] **TC-603**: User receives notification when content flagged
  - Expected: "Your message was reviewed" notification

### 7.3 Call Notifications
- [ ] **TC-604**: User B receives call invite notification
  - Expected: High-priority notification with accept/decline

---

## 8. Background Jobs

### 8.1 Disappearing Messages Job
- [ ] **TC-701**: Run `runDisappearingMessagesJob()` manually
  - Expected: Console logs show count of expired messages
  - Verify: Analytics event `job.disappearing_messages.completed` tracked

### 8.2 Recall Window Job
- [ ] **TC-702**: Run `runMessageRecallWindowJob()` manually
  - Expected: Console logs show count of closed windows

### 8.3 Attachment Cleanup Job
- [ ] **TC-703**: Run `runAttachmentCleanupJob()` manually
  - Expected: Old attachments marked for S3 deletion
  - Verify: `attachmentsArchived: true` flag set

### 8.4 Analytics Snapshot Job
- [ ] **TC-704**: Run `runMessagingAnalyticsJob()` manually
  - Expected: Daily snapshot created with voice/translation/recall counts
  - Verify: Event `messaging.daily_snapshot` tracked

---

## 9. Performance & Load

### 9.1 Response Times
- [ ] **TC-801**: Voice note upload completes in <5s for 5MB file
- [ ] **TC-802**: Translation returns in <200ms (uncached)
- [ ] **TC-803**: Translation returns in <50ms (cached)
- [ ] **TC-804**: Safety scan completes in <100ms
- [ ] **TC-805**: Recall action completes in <2s

### 9.2 Concurrent Users
- [ ] **TC-806**: 10 users send messages simultaneously
  - Expected: All messages delivered, no timeouts
  
- [ ] **TC-807**: 5 users request translations at same time
  - Expected: Redis handles concurrent cache reads

---

## 10. Error Handling

### 10.1 Network Errors
- [ ] **TC-901**: Simulate S3 upload failure
  - Expected: User sees friendly error, can retry
  
- [ ] **TC-902**: Simulate Redis down (rate limiting)
  - Expected: Fallback allows operation with warning log

### 10.2 Invalid Input
- [ ] **TC-903**: Send voice note with invalid format
  - Expected: API rejects with clear error message
  
- [ ] **TC-904**: Request translation for unsupported language
  - Expected: API returns error with supported languages list

---

## 11. Security

### 11.1 Authorization
- [ ] **TC-1001**: User A cannot recall User B's message
  - Expected: API returns 403 Forbidden
  
- [ ] **TC-1002**: User A cannot access User C's voice note URL
  - Expected: S3 pre-signed URL expires after 1 hour

### 11.2 Rate Limiting
- [ ] **TC-1003**: Verify rate limit headers in API responses
  - Expected: `x-ratelimit-remaining`, `x-ratelimit-reset` present

---

## Exit Criteria

- [ ] **All test cases passed** (100% completion)
- [ ] **No P0/P1 bugs open**
- [ ] **Performance tests meet SLA** (<500ms p95)
- [ ] **Security review approved**
- [ ] **Load test passed** (see `leaderboard-k6.js` for reference)

---

## Test Results Summary

| Category | Total Tests | Passed | Failed | Notes |
|----------|-------------|--------|--------|-------|
| Voice Notes | 7 | | | |
| Translation | 7 | | | |
| LiveKit | 5 | | | |
| Recall | 6 | | | |
| Disappearing | 4 | | | |
| Safety | 6 | | | |
| Notifications | 4 | | | |
| Jobs | 4 | | | |
| Performance | 7 | | | |
| Errors | 4 | | | |
| Security | 3 | | | |
| **TOTAL** | **57** | | | |

---

**Tester**: _______________  
**Date**: _______________  
**Environment**: _______________  
**Build Version**: _______________

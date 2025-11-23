# Phase 5 Messaging Platform Rollout Plan

## Overview
Phase 5 introduces advanced messaging capabilities including voice notes, real-time translation, LiveKit video integration, message recall, disappearing messages, and comprehensive safety tooling.

## Feature Breakdown

### 1. Voice Notes
- **Status**: ✅ Complete
- **Components**:
  - S3 upload with pre-signed URLs
  - Audio transcription pipeline (stub)
  - Rate limiting (5 voice notes per hour)
  - Analytics tracking
- **API**: `POST /api/chat/voice-note`

### 2. Real-time Translation
- **Status**: ✅ Complete
- **Components**:
  - Redis caching for translations
  - Rate limiting (20 translations per hour)
  - Support for 10+ locales
  - GraphQL mutation support
- **API**: `POST /api/chat/translate`, GraphQL `translateMessage`

### 3. LiveKit Video Integration
- **Status**: ✅ Complete
- **Components**:
  - Token generation endpoint
  - Room creation with metadata
  - Socket.IO real-time invites
- **API**: `POST /api/chat/livekit-token`

### 4. Message Recall
- **Status**: ✅ Complete
- **Components**:
  - 15-minute recall window
  - Background job to close windows
  - Real-time notification to recipients
  - Analytics tracking
- **API**: `POST /api/chat/recall`, GraphQL `recallMessage`

### 5. Disappearing Messages
- **Status**: ✅ Complete
- **Components**:
  - Configurable expiry (30s to 7d)
  - Background job for cleanup
  - Temporal workflow stub
- **Background Jobs**: `runDisappearingMessagesJob()`

### 6. Chat Safety
- **Status**: ✅ Complete
- **Components**:
  - Real-time content scanning
  - Safety nudges (warning/block)
  - Moderation API integration
  - GraphQL safety check
- **Service**: `ChatSafetyService`

### 7. Notifications
- **Status**: ✅ Complete
- **Components**:
  - Message notifications
  - Safety alert notifications
  - Call invite notifications
- **Service**: `NotificationService` extensions

## Rollout Phases

### Phase 1: Internal Testing (Week 1)
- [ ] Deploy to staging environment
- [ ] Run full test suite (unit + integration)
- [ ] Manual QA using checklist (see `manual-qa.md`)
- [ ] Load test voice upload and translation APIs
- [ ] Verify background jobs run correctly
- [ ] Test LiveKit token generation

### Phase 2: Alpha (Week 2)
- [ ] Enable for 5% of users via feature flag `chat-phase5-core`
- [ ] Monitor error rates and performance metrics
- [ ] Gather user feedback on voice notes
- [ ] Verify Redis rate limiting effectiveness
- [ ] Check S3 storage costs and cleanup job

### Phase 3: Beta (Week 3-4)
- [ ] Increase to 25% of users
- [ ] A/B test translation feature adoption
- [ ] Monitor recall usage patterns
- [ ] Tune safety thresholds based on false positives
- [ ] Validate analytics events in dashboard

### Phase 4: General Availability (Week 5)
- [ ] Roll out to 100% of users
- [ ] Announce new features in-app
- [ ] Update help documentation
- [ ] Monitor support tickets for issues

## Monitoring & Observability

### Key Metrics
- Voice note upload success rate (target: >95%)
- Translation cache hit rate (target: >60%)
- Message recall completion time (target: <2s)
- Safety scan latency (target: <100ms)
- Background job execution time

### Alerts
- Voice upload failures >5%
- Translation API errors >2%
- LiveKit token generation failures
- Disappearing message job lag >15 minutes
- Safety scan timeouts

### Dashboards
- Real-time messaging analytics (`/insights`)
- Daily snapshots (voice notes, translations, recalls)
- Admin moderation queue (`/admin/community/moderation`)

## Database Migration

Run migration script before rollout:
```bash
pnpm exec tsx scripts/migrations/phase5-collections.ts
```

Creates:
- `messages` collection with indexes on `threadId`, `senderId`, `createdAt`
- `chat_threads` collection
- Indexes for safety and recall queries

## Configuration

### Environment Variables
```env
# Redis (required for rate limiting & caching)
REDIS_URL=redis://localhost:6379

# S3 (required for voice notes & attachments)
AWS_S3_BUCKET=tribalmingle-attachments
AWS_REGION=us-west-2

# LiveKit (required for video calls)
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
LIVEKIT_WS_URL=wss://your-livekit-server

# Feature Flags
LAUNCHDARKLY_SDK_KEY=sdk-xxx
```

### Feature Flags
- `chat-phase5-core`: Master toggle for all Phase 5 features
- `chat-voice-notes`: Voice note uploads
- `chat-translation`: Real-time translation
- `chat-livekit`: Video calling
- `chat-recall`: Message recall
- `chat-disappearing`: Disappearing messages

## Rollback Plan

### Quick Rollback (< 5 minutes)
1. Disable feature flag `chat-phase5-core`
2. Users revert to Phase 4 chat experience
3. Background jobs continue processing existing data

### Full Rollback (< 1 hour)
1. Stop background job workers
2. Disable Socket.IO chat namespace
3. Roll back API endpoints
4. Clear Redis rate limit keys
5. Database remains intact (read-only mode)

## Exit Criteria

- ✅ All unit tests pass (90%+ coverage)
- ✅ Integration tests for all APIs pass
- ❌ Manual QA checklist 100% complete
- ❌ Load testing shows p95 latency <500ms
- ✅ Background jobs run without errors for 48 hours
- ❌ Security review approved
- ❌ Documentation complete and published

## Dependencies

- Redis cluster (production-grade)
- S3 bucket with CORS configured
- LiveKit server (self-hosted or cloud)
- Temporal server (for workflows)
- Socket.IO server scaled horizontally

## Post-Launch Tasks

- [ ] Monitor first 24 hours closely
- [ ] Collect user feedback via in-app survey
- [ ] Analyze translation language preferences
- [ ] Review safety false positive rate
- [ ] Optimize S3 storage costs
- [ ] Document lessons learned

## Support Contacts

- **Engineering Lead**: [Your Name]
- **On-Call Engineer**: [Rotation Schedule]
- **Product Manager**: [PM Name]
- **Security**: [Security Team]

---

**Last Updated**: November 23, 2025  
**Rollout Target**: December 2025

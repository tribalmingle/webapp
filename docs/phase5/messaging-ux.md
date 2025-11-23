# Phase 5 Messaging UX Criteria

_Last updated: 2025-11-23_

## Source Inputs
- `PRODUCT_IMPLEMENTATION_BLUEPRINT.md` section 3.2 (Member App – Chat + Insights).
- `PRODUCT_IMPLEMENTATION_TODOS.md` section 3.3 (Matches, Likes, Chat) plus sections 4, 5, 7 for supporting services.
- Phase 4 deliverables from `STEDOWN_PHASE_4_TODO.md` to ensure continuity across discovery → chat handoff.

## Thread States & Folder Semantics
| Folder | Definition | Default Audience | Visual Treatment | Escalation Rules |
|--------|------------|------------------|------------------|------------------|
| Spark | Newly-matched or reactivated threads (last inbound <24h) that have not received a member reply. | Everyone | Neon gradient accent, pulse badge, unread counter, translator + safety capsules inline. | Auto-downgrade to Active after 24h or once member replies. |
| Active | Ongoing dialogs with replies on both sides in the last 72h. | Everyone | Neutral glassmorphic tile, status dot from presence service, translator toggle indicator. | Drops to Snoozed if either party snoozes or no reply in 72h. |
| Snoozed | Threads manually snoozed or auto-muted by lifecycle jobs (e.g., expired boosts, cooldown). | Free + Premium | Muted color, snooze badge, “Resume” CTA; push notifications suppressed unless override. | Digest email recaps only; quiet-hours logic enforced. |
| Trust Review | Threads flagged by TrustService, guardian escalation, or moderation heuristics. | Premium + Guardians + Trust Ops | High-contrast warning banner, inline policy copy, quick link to report/escalate. | Auto-lock outbound composer until trust team resolves; evidence logged to `activity_logs`. |

### Supporting Indicators
- **Safety badge:** Derived from TrustService heuristics (`safetyFlags`); displays contextual copy ("Verified ID", "Watch for payment requests").
- **Translator chips:** Show source/target languages, translator availability (premium gating), auto-detect state, and token budget.
- **Presence ribbon:** Uses InteractionService presence namespace; includes multi-device icons when more than one device active.

## Interaction Patterns
1. Folder selections persist cross-device via `session-store` + `chat_threads.folder` metadata.
2. Pinned prompts (AI-generated conversation starters) appear at top of Spark/Active lists and inside composer suggestions.
3. Bulk actions (mark read, archive, move to folder) accessible via `notifications-menu` control group.
4. Guardian mode overlays trust disclaimers and disables translator send if guardian declines.

## Instrumentation & Telemetry
| Event | Payload | Purpose |
|-------|---------|---------|
| `chat.inbox.view` | folder, locale, premiumTier, deviceType | Track folder usage + segmentation. |
| `chat.inbox.folder_change` | fromFolder, toFolder, pinnedCount | Detect friction navigating folders. |
| `chat.inbox.search` | queryLength, unreadOnly, filters[] | Understand search/filter adoption. |
| `chat.inbox.filter_saved` | filters[], isPremium | Measure premium value prop. |
| `chat.inbox.pin_toggled` | threadId, action | Monitor AI prompt engagement. |

All events must flow through `lib/analytics/client.ts` with LaunchDarkly flag metadata for targeted rollouts.

## Validation Checklist
- ✅ Visual QA: dark/light themes, RTL locale, high-contrast mode.
- ✅ Accessibility: folder tabs keyboard-focusable, ARIA live regions for folder count changes, translator chips labeled.
- ✅ Premium gating: translator + verified filters show upsell if non-premium.
- ✅ Trust workflows: Trust Review folder blocks composer, displays escalation CTA, logs audit entry via `activity_logs`.
- ✅ State persistence: refresh/relogin retains last folder + filters; multi-device sync tested (desktop + mobile web).
- ✅ Snapshot coverage: Percy/Playwright snapshots stored under `test-results/messaging-inbox/` per folder state.

## Open Questions / Assumptions
1. Translator availability limited to Premium and Concierge tiers; Free users can view translator chips but cannot toggle send. (Assumption documented until pricing finalized.)
2. Trust Review folder visible only when trust score < threshold; otherwise hidden to reduce noise.
3. Snoozed digest cadence defaults to 24h; override configurable via NotificationService preferences.

---
Document owner: Phase 5 squad (Messaging & Social). Update as UX evolves.

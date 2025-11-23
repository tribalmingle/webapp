# Phase 6 Rollout Plan

## Staging Sequence
1. Internal (feature flags: all on for admin/guardian test accounts).
2. Concierge cohort (enable `community-beta`, `events-hub`).
3. Premium members (add `insights-ai-coach`, `gamification-v1`).
4. General availability (flags removed or default to enabled).

## KPIs & Thresholds
| KPI | Target | Action if Below |
| --- | ------ | --------------- |
| Event RSVPs / day | > 40 | Increase curated events + push campaigns. |
| Community posts / day | > 75 | Spotlight clubs, add AMA schedule promos. |
| Insights weekly adoption | > 35% | Refine coach suggestion relevance. |
| Daily quest completion | > 50% | Adjust XP rewards / clarity of UI. |

## Kill Switches
- Disable entire surface via LaunchDarkly flag.
- Remove specific quest definitions by config without redeploy.
- Pause reminders by suspending `event-reminder-worker` cron.

## Exit Criteria
- KPIs stable above target for 14 consecutive days.
- Moderation queue SLA < 5m average review time.
- No P1 incidents from new surfaces in last 30 days.
- Retrospective logged in `PRODUCT_OWNER_REVIEW.md`.

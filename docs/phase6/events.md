# Phase 6 – Events Reminders & Steward SOP

## Scope
- Hourly digests for members who RSVPed to concierge events.
- Two reminder windows: **24h** ("tomorrow") and **1h** ("doors open soon").
- Channels: push + in-app record via `notifications` collection. Push delivery flows through OneSignal; analytics recorded via `notifications.event_reminder.sent`.

## Data & Services
| Component | Purpose |
| --- | --- |
| `lib/services/notification-service.ts` | Normalizes reminder copy, dedupes, logs delivery state, fans out to OneSignal + analytics. |
| `scripts/event-reminder-worker.ts` | Cron-safe worker that batches RSVPs per user and calls the service for each reminder window. |
| Mongo Collections | `events`, `event_registrations`, `notifications` (for audit + in-app feed). |

Reminders only consider **confirmed** registrations for published events whose `startAt` matches the configured lead time. Waitlisted members are ignored until they are promoted.

## Environment Variables
Add to `.env.local` + deployment secrets:

```
ONESIGNAL_APP_ID=                     # from OneSignal dashboard
ONESIGNAL_REST_API_KEY=               # REST API key (server)
ONESIGNAL_ANDROID_CHANNEL_ID=         # optional channel override
EVENT_REMINDER_WINDOW_MS=3600000      # width of each query window (default: 60m)
EVENT_REMINDER_MAX_EVENTS=3           # max events per user digest
```

`NEXT_PUBLIC_APP_URL` controls the deeplink the notification opens (`/events/[slug]`).

## Worker Runbook
1. Ensure Mongo + env vars are available locally: `cp .env.local.example .env.local` then fill in credentials.
2. Kick off the worker once (use Cron/K8s for automation):
   ```bash
   pnpm event-reminder-worker
   ```
3. Recommended schedule: hourly cron (`0 * * * *`) so both the 24h and 1h windows fire reliably.
4. Logs show `event-reminder` entries for each window; failures surface with stack traces.

## Steward SOP
1. Morning sweep:
   - Run `pnpm event-reminder-worker` manually if no automation yet.
   - Verify new docs in `notifications` collection (filter by today, `type=event_reminder`).
2. For high-touch members, spot-check copy inside OneSignal dashboard (search by `external_id`).
3. If a member updates RSVP within the reminder window, re-run worker; dedupe keys ensure we never double-send the same event set.
4. To force a resend (e.g., copy update), delete the existing `notifications` document for that user + dedupe key, then rerun the worker.

## Monitoring & Alerts
- `notifications.event_reminder.sent` analytics events feed the admin dashboard KPIs (delivery count by window).
- Datadog/Logtail query: `service:event-reminder-worker status:error` for worker failures.
- Add OneSignal delivery alerts for push send rate drops (<95% success in 1h moving window).

## Troubleshooting Cheatsheet
| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| Worker logs "OneSignal not configured" | Missing env keys in runtime | Populate `ONESIGNAL_*` secrets and redeploy. |
| Members report duplicate pushes | Steward manually deleted dedupe documents | Leave dedupe entries intact; rerun worker without manual deletions unless forcing copy change. |
| No reminders created | Event `startAt` outside window or events not `moderationState=published` | Confirm event timestamps/timezone and steward publish workflow. |

Document owner: Phase 6 engineering steward. Update alongside any changes to reminder timing, copy, or delivery providers.

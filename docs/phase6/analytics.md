# Phase 6 Analytics – Events · Community · Insights · Gamification

## Scope
- Event attendance metrics (RSVP counts, waitlist conversions).
- Community engagement (posts/day, comments/post, reaction velocity, AMA attendance).
- Insights adoption (% users visiting insights per week, AI coach suggestion apply rate).
- Gamification KPIs (daily quest completion %, XP distribution, leaderboard churn).

## Collections & Sources
| Source | Purpose |
| ------ | ------- |
| `analytics_events` | Raw events (already implemented). |
| `user_quests` | Gamification progress/claims. |
| `community_posts` / `community_comments` | Engagement metrics. |
| `events` / `event_registrations` | Attendance & conversion. |
| `daily_metrics` | Snapshot rollups for dashboard. |

## Derived Metrics (dbt / future pipeline)
| Metric | Derivation |
| ------ | ---------- |
| `event_rsvp_rate` | RSVPs / published events per day. |
| `waitlist_conversion_rate` | Confirmed / (waitlisted + confirmed). |
| `posts_per_active_user` | Posts / users posting ≥1 in window. |
| `quest_completion_rate` | Completed quests / total eligible users. |
| `insights_visit_rate` | Distinct users hitting `/insights` / active users. |

## Open TODO
- Integrate with data warehouse & dbt models.
- Add Terraform module for metric export to BI layer.
- Replace placeholder counts in `getRealtimeStats` with Redis counters.

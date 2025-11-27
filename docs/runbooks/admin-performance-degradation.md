# Runbook: Admin Performance Degradation
Symptom: P95 latency >800ms on heavy endpoints (analytics, segments).

1. Capture latency metrics (Datadog dashboard snapshot).
2. Identify top slow endpoints (/analytics/metrics, /growth/segments/count).
3. Run MongoDB `explain()` on representative queries.
4. Add missing indexes (see index catalog). Rebuild carefully.
5. Enable Redis caching layer for segment counts (TTL 300s) if not active.
6. Validate improvement post-index with new P95 sample.
7. If still degraded: profile CPU & memory usage of node process.
8. Schedule refactor for any N+1 or large pipeline stages.

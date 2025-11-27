# Runbook: Analytics Ingestion Lag
Symptom: Event ingestion buffer not flushing; metrics stale.

1. Hit `/api/admin/analytics/metrics` with known recent event filter.
2. Check batch buffer size (log line 'batchIngest buffer size').
3. Force flush by sending dummy event if size >=100 not flushing.
4. Verify MongoDB insert throughput (`events` collection write rate).
5. Inspect queue/backpressure on DB (slow operations).
6. If persistent: restart ingestion worker (Phase 9 background worker).
7. Notify Data Analyst for coverage estimation.
8. Post-mortem entry in audit log.

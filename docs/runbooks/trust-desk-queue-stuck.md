# Runbook: Trust Desk Queue Stuck
Symptom: Reports queue not updating for >5 minutes.

1. Validate API health `/api/admin/trust/reports` (HTTP 200?)
2. Check MongoDB connectivity (system health page)
3. Inspect logs for query latency >2s
4. Redis cache purge (if caching added future phase)
5. Manually refresh browser (rule out client state)
6. If DB slow: capture `db.currentOp()` sample
7. Escalate to Infra if locked operations >1
8. Document in audit log via internal note

Rollback: Switch moderation to legacy tooling until resolved.

# Runbook: Feature Flag Emergency Rollback
Symptom: New flag causes widespread errors or user impact.

1. Identify flag key impacting errors.
2. Toggle flag off via Labs dashboard (confirm modal).
3. Purge client caches (CDN invalidation if required).
4. Monitor error rate for 5 minutes.
5. If persists: revert associated code deploy (Git hash rollback).
6. Update audit log with rollback context.
7. Prepare post-mortem: expected vs actual behavior, blast radius.
8. Add additional guardrail checks before future rollout.

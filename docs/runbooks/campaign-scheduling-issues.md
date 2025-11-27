# Runbook: Campaign Scheduling Issues
Symptom: Scheduled campaigns not sending at expected time.

1. Verify campaign status (should be 'scheduled').
2. Check BullMQ job existence (Phase 9: queue introspection tool).
3. Inspect server clock vs scheduledAt drift.
4. Manual trigger: change status to 'sending' if safe.
5. Prevent duplicate sends: log manual override.
6. Root cause: queue worker paused? Restart worker.
7. If systemic, suspend new scheduling until fix deployed.
8. Document affected campaign IDs and notify Growth Lead.

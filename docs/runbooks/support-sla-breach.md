# Runbook: Support SLA Breach Spike
Symptom: Many tickets turn red (breached) simultaneously.

1. Export list of breached ticket IDs.
2. Validate SLA calculation code deployment hash.
3. Compare sample ticket timestamps vs SLA matrix.
4. Check server time drift (NTP sync). Adjust if >2s.
5. Prioritize urgent/high tickets: bulk assign to available agents.
6. Communicate status in #support channel.
7. Create incident ticket if >15% active tickets breached.
8. After resolution: root cause analysis and SLA job unit test addition.

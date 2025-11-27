# Runbook: Health Check Failures
Symptom: One or more services show status=down for >2 minutes.

1. Identify failing service(s) (MongoDB/Redis/Stripe/S3/Twilio/LaunchDarkly).
2. Cross-check external status pages (Stripe, AWS, Twilio).
3. For DB/Redis: attempt direct connection ping.
4. If config regression suspected: diff latest env vars vs baseline.
5. Failing third-party: enable degraded mode (reduce feature usage).
6. Notify #ops-incidents; include timeline & impact.
7. Escalate to vendor if no public outage reported.
8. Record outage window in audit log.

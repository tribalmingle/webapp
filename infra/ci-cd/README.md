# CI/CD Assets

Phase 1 Step 4 requires automated promotion pipelines plus progressive delivery. This folder captures both sides:

- **GitHub Actions** for lint/test/build/publish plus Argo syncs.
- **Argo Rollouts + Applications** so we can ship canaries/blue-green strategies per service.

Use these files as a baseline; each service references the same reusable workflow via `workflow_call` inputs.

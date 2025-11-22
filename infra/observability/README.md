# Observability Stack (Phase 1 Step 6)

Artifacts in this folder wire the telemetry + on-call tooling mandated by the execution blueprint.

## Contents

- `otel-collector.yaml` – OpenTelemetry Collector deployment + ConfigMap to receive OTLP from all services and export to Datadog + Tempo.
- `datadog-agent.yaml` – DaemonSet instrumentation with kube-state-metrics autodiscovery.
- `sentry-relay.yaml` – Relay deployment to buffer browser/mobile events before shipping to Sentry.
- `backstage/` – Catalog entities so Backstage can auto-document every service.
- `pagerduty/` – Escalation policy + schedule definitions (Terraform-friendly YAML) for ops rotations.

Apply with `kubectl apply -f <file>` or wire into Argo Applications for GitOps.

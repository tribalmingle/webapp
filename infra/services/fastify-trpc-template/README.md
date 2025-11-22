# Fastify + tRPC Service Template

This template bootstraps a production-ready Fastify+tRPC workload on Linkerd-injected Kubernetes clusters.

## Features
- Fault-tolerant `Deployment` with probes, resource quotas, and structured logging env vars.
- ConfigMap-driven bootstrap for service metadata, upstream URLs, and feature flags.
- OpenTelemetry + Datadog hooks wired through env vars so spans/metrics export without extra plumbing.
- Prometheus `ServiceMonitor` to scrape `/metrics` (tRPC exporter or Fastify telemetry plugin).
- ServiceAccount scoped to the namespace with future IAM bindings (IRSA/Workload Identity).

## Usage
1. Copy this folder, rename it (e.g., `infra/services/matching-service`).
2. Search and replace `template-fastify-trpc` with your service name.
3. Update the container image/tag plus ConfigMap defaults.
4. Apply locally with `kubectl apply -k infra/services/<service>` or reference the kustomization from Argo.

# Service Templates

This folder houses reusable manifests for standing up new platform services. Each template ships opinionated defaults for Linkerd injection, OpenTelemetry, and GitOps-friendly configuration so product teams can copy the folder, rename the resources, and deploy with `kustomize`.

## Available Templates

### fastify-trpc-template
- Lightweight Fastify + tRPC deployment tuned for API workloads
- Ships a ConfigMap-driven bootstrap for service metadata and upstream URLs
- Exposes standard `/healthz`, `/readyz`, and `/metrics` endpoints
- Includes Prometheus `ServiceMonitor`, Linkerd proxy tuning, OpenTelemetry env vars, and PodDisruptionBudget/HPAs hooks (commented) to opt into as the service scales

> To create a new service, duplicate the template folder, replace `template-fastify-trpc` with your service name, adjust the container image, and commit alongside your service code. Apply with `kubectl apply -k infra/services/<your-service-folder>` or promote through Argo.

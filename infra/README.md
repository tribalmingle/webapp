# Tribal Mingle Infrastructure Scaffold

This directory ships the Phase 1 Step 4 deliverables: Kubernetes/Linkerd manifests, multi-region overlays, reusable service templates, API gateway configs, and CI/CD automation stubs. Everything is intentionally declarative so we can promote the environment via GitOps (Argo Rollouts) once credentials are wired.

## Layout

- `k8s/` – Cluster definitions, base manifests, and production overlays
- `linkerd/` – Linkerd installation values + multi-cluster gateway policy
- `data/` – Terraform for Atlas, Redis Enterprise, Neon/Postgres, Algolia/Elastic, S3/CloudFront, Pinecone
- `services/` – Opinionated Fastify + tRPC service templates with observability hooks
- `gateway/` – GraphQL router + REST API gateway configs
- `ci-cd/` – GitHub Actions pipeline plus Argo Rollout + Application specs

Each subfolder contains README guidance plus sample commands to apply manifests locally (kind) or via `kubectl apply -k` for overlays.

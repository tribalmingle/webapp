# Jobs & Streaming Stack (Phase 1 Step 6)

This package provisions the asynchronous execution layer called for in the blueprint:

- **Temporal** for orchestrated workflows (passkey onboarding, concierge concierge flows, payouts).
- **BullMQ worker pool** for latency-tolerant tasks (notifications, analytics fan-out).
- **Kafka / Amazon MSK** for streaming pipelines feeding analytics + AI models.
- **CronJobs** for recurring maintenance, funnel snapshots, and data hydration.

## Layout

- `workers/` – Kustomize overlays for BullMQ + cron workloads.
- `temporal-values.yaml` – Helm values handed to `helm upgrade --install temporal ...`.
- `terraform/` – AWS MSK cluster, security groups, and topic bootstrap.

## Temporal

```bash
helm repo add temporal https://temporalio.github.io/helm-charts
helm upgrade --install temporal temporal/temporal -f temporal-values.yaml -n jobs
```

## Worker Kustomize

```bash
kubectl apply -k infra/jobs/workers/overlays/production
```

## Kafka/MSK

```bash
cd infra/jobs/terraform
terraform init
terraform apply -var-file=env/dev.tfvars
```

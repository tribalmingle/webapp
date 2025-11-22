# Data & Storage Provisioning (Phase 1 Step 5)

This package automates the managed data layer called for in the execution blueprint. It uses Terraform to provision:

1. MongoDB Atlas Global Cluster with CSFLE + workload-identity integration for the app + analytics workloads.
2. Redis Enterprise Cloud subscription with regional active-active databases.
3. Neon/Postgres replica set for analytical snapshots + Lakehouse exports.
4. Algolia + Elastic search indexes for marketing/member discovery use cases.
5. S3 buckets with CloudFront distributions for media + static marketing assets.
6. Pinecone vector DB namespaces for personalization models.

Each module lives under `infra/data/terraform/modules/*` and can be promoted independently via Terraform Cloud or Atlantis. Secrets (API keys, tokens) are pulled from the CI runner environment, never committed.

## Getting Started

```bash
cd infra/data/terraform
terraform init
terraform plan -var-file=env/dev.tfvars
```

The `env/*.tfvars` files reference shared vars (org IDs, AWS account, CIDRs). Copy `env/dev.sample.tfvars` to your own environment and fill values.

## CSFLE & Key Management

Atlas is configured to use AWS KMS via the `kms` module. The resulting key IDs are exported so Node services can populate `process.env.CSFLE_KEY_ID`. Run `pnpm tsx scripts/setup/ensure-collections.ts` after provisioning to sync schema validators & indexes.

## Outputs

Running `terraform output` prints connection strings, Redis endpoints, Neon roles, Algolia admin keys, S3 bucket names, and Pinecone environment details. Feed these into Vault/1Password for app consumption.

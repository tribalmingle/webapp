# API Gateway Assets

This folder documents the Phase 1 Step 4 gateway deliverables. We ship two complementary entrypoints:

1. **Apollo Router (GraphQL Federation)** for member/admin apps that prefer a typed contract.
2. **Kong Gateway (REST + gRPC)** for third-party or internal service-to-service calls that need rate limiting and auth plug-ins.

The manifests below are referenced by `infra/k8s/base/platform-gateway.yaml` via ConfigMaps/Secrets. Edit the configs, commit, and Argo will roll the deployment.

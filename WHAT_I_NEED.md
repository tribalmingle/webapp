# WHAT I NEED

Central list of environment secrets, API tokens, and third-party setup that must come from you. Please provision the items below and share values securely (e.g., 1Password share, Vault entry, or encrypted email). Until these exist, progress on the respective steps will be blocked.

| # | Provider / System | Why It’s Needed | Required Items | How You Can Provide It |
|---|-------------------|-----------------|----------------|------------------------|
| 1 | **Contentful** | Power the multilingual marketing site (P1.1) with CMS-driven hero, testimonials, events. | Space ID, CDA token, CMA token (if we need migrations), preview token. | Create a Contentful space, add models per blueprint, then share tokens via secure channel + add to `.env.local`. |
| 2 | **LaunchDarkly** | Feature flags/personalization for marketing + app shells. | Client-side SDK key (marketing), server-side SDK key (app/admin), default project + environment names. | Invite me to project or drop keys in Vault; confirm flag naming conventions. |
| 3 | **Branch.io** _(REPLACED BY CUSTOM SOLUTION)_ | ~~Deep-link + referral plumbing~~ Now building custom deep linking system internally. | ~~`NEXT_PUBLIC_BRANCH_KEY`~~ No longer needed for Phase 1-3. Can migrate to Branch.io later when funded. | N/A - Building internal solution with MongoDB-backed short links + attribution tracking. |
| 4 | **Segment (Analytics)** _(REPLACED BY CUSTOM SOLUTION)_ | ~~Capture marketing/app events~~ Now building custom analytics system internally. | ~~Write key for Web source~~ No longer needed for Phase 1-3. Can migrate to Segment later when funded. | N/A - Building internal solution with MongoDB-backed event tracking + admin dashboard for real-time monitoring. |
| 5 | **Twilio Verify / Messaging** | Phase 3 onboarding (phone verification) + SMS flows. | Account SID, Auth Token, Verify Service SID, Messaging Service SID. | Enable Verify v2, add approved templates, send credentials securely. |
| 6 | **WebAuthn / Passkey RP Data** | Needed for passkey registration (origin + RP ID). | Confirm production domains + expected RP ID, along with Apple App ID if using platform authenticators. | Provide list of launch domains + Apple association data. |
| 7 | **Stripe** | Existing subscription/card checkout + fallback for wallets. | Secret key, webhook signing secret, product/price IDs for plans, CLI access (optional). | Create restricted key and share; add webhook endpoint, share signing secret. |
| 8 | **Paystack** | Regional payments + fallback provider. | Secret key, public key, plan identifiers. | Share via secure channel; ensure test mode is enabled. |
| 9 | **Apple Pay (Merchant ID)** | Wallet readiness + subscriptions. | Merchant ID, merchant identity cert, payment processing cert, Apple Pay domain verification file. | Create via Apple Developer account, export certs (.cer + .p12) and share instructions for installation. |
| 10 | **Google Pay** | Wallet readiness + subscriptions. | Merchant ID, gateway merchant ID, environment settings. | Provision via Google Pay Business Console, share IDs. |
| 11 | **Email Provider (SendGrid/Resend/AWS SES)** | Transactional emails (onboarding, receipts). | API key(s), sender domains, template IDs. | Choose provider, verify domain, share API credentials. |
| 12 | **OneSignal / Push Provider** | Web push + app notifications. | App ID, REST API key. | Set up OneSignal app, invite collaborator or share keys. |
| 13 | **AWS S3 + CloudFront** | Media storage + CDN (profiles, marketing assets). | AWS IAM access key/secret scoped to S3/CloudFront, bucket names. | Create IAM user (least privilege), share credentials; provide bucket naming scheme. |
| 14 | **Redis Enterprise / Upstash** | Caching, rate limiting, session stores. | Redis connection string(s), TLS certs if needed. | Provision instance, share URL + credentials. |
| 15 | **MongoDB Atlas** | Atlas cluster credentials + connection strings for Global Cluster (Phase 1.5/2). | Connection string, Atlas API key for automation, encryption keys for CSFLE. | Create project/cluster, add my IP or create db user, share strings securely. |
| 16 | **Neon/Postgres / Analytics Warehouse** | Analytics replicas + cohort metrics. | Connection string, service account credentials. | Provision Neon project, share URL + credentials. |
| 17 | **Algolia & Elastic** | Search indexes for discovery + marketing site. | Algolia app ID + admin key, Elastic endpoint + API key. | Create indices, grant API access. |
| 18 | **Pinecone (Vector DB)** | Matching/AI coach embedding storage. | API key, environment, project name. | Provision project, share key. |
| 19 | **Temporal Cloud / Worker Queue Infra** | Phase 1.6 jobs stack. | Namespace credentials, certificates. | Invite to Temporal Cloud project or provide self-host details. |
| 20 | **Datadog + Sentry + PagerDuty** | Observability + on-call. | API keys + application configs for each. | Add me to orgs or share keys; specify service naming conventions. |
| 21 | **Backstage/Developer Portal Access** | Needed to publish runbooks/docs. | Access credentials or deployment URL. | Provide login + instructions.

> **Action:** Review the list, gather what you already have, and let me know as you deliver credentials so I can proceed without blockers.

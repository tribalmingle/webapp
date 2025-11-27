# Infrastructure Checklist

## Pre-Launch Infrastructure Verification

### Hosting & Deployment Platform
- [ ] **Vercel Production Project**: Configured and connected to master branch
- [ ] **Custom Domain**: tribalmingle.com DNS configured
- [ ] **SSL Certificates**: Auto-provisioned via Vercel
- [ ] **Environment Variables**: All production secrets configured in Vercel dashboard
- [ ] **Build Settings**: Verified build command and output directory
- [ ] **Deployment Protection**: Production deployment requires approval
- [ ] **Preview Deployments**: Enabled for all branches
- [ ] **Git Integration**: Automatic deployments on push to master

### Database (MongoDB Atlas)
- [ ] **Production Cluster**: M10 or higher tier configured
- [ ] **Replication**: Multi-region replica set enabled
- [ ] **Backups**: Automated continuous backups configured
- [ ] **Point-in-Time Recovery**: Enabled with 7-day window
- [ ] **Connection Pooling**: Configured for application tier
- [ ] **Database Users**: Least-privilege users for application access
- [ ] **IP Allowlist**: Vercel IPs whitelisted
- [ ] **Performance Advisor**: Enabled for query optimization
- [ ] **Indexes**: All required indexes created (see db/indexes.md)
- [ ] **Data Encryption**: Encryption at rest enabled

### Caching (Redis/Upstash)
- [ ] **Production Instance**: High-availability Redis cluster
- [ ] **Persistence**: AOF or RDB persistence configured
- [ ] **Connection Limits**: Sufficient for expected load
- [ ] **Eviction Policy**: allkeys-lru or appropriate policy set
- [ ] **Monitoring**: Performance metrics enabled
- [ ] **TLS**: Encryption in transit enabled
- [ ] **Backup**: Regular snapshots configured

### Storage (AWS S3 / Cloudflare R2)
- [ ] **Production Bucket**: Created with appropriate region
- [ ] **Public Access**: Blocked (use signed URLs)
- [ ] **Versioning**: Enabled for critical data
- [ ] **Lifecycle Policies**: Automated archival/deletion configured
- [ ] **CORS**: Configured for application domain
- [ ] **CDN**: CloudFront or Cloudflare CDN enabled
- [ ] **Encryption**: Server-side encryption (AES-256)
- [ ] **Access Logging**: S3 access logs enabled

### CDN (Cloudflare)
- [ ] **DNS**: All records configured and propagated
- [ ] **Proxy Status**: Orange-clouded for main domain
- [ ] **SSL/TLS**: Full (strict) mode enabled
- [ ] **HSTS**: Enabled with 1-year max-age
- [ ] **Auto Minify**: Enabled for JS/CSS/HTML
- [ ] **Brotli Compression**: Enabled
- [ ] **Cache Rules**: Configured for static assets
- [ ] **Page Rules**: Set for performance optimization
- [ ] **Rate Limiting**: Configured for API endpoints
- [ ] **DDoS Protection**: Enabled (automatic)
- [ ] **Web Application Firewall**: Enabled with OWASP ruleset

### Third-Party Services

#### Stripe (Payments)
- [ ] **Live Account**: Activated and verified
- [ ] **API Keys**: Production keys configured
- [ ] **Webhooks**: Configured with proper endpoint
- [ ] **Webhook Signing**: Secret configured
- [ ] **Products/Prices**: All subscription tiers configured
- [ ] **Tax Settings**: Configured for applicable regions
- [ ] **Fraud Prevention**: Radar enabled

#### Twilio (SMS)
- [ ] **Production Account**: Verified and funded
- [ ] **Phone Number**: Purchased and configured
- [ ] **Messaging Service**: Created for TribalMingle
- [ ] **Opt-Out Management**: Configured
- [ ] **Message Templates**: Registered (where required)
- [ ] **Geographic Permissions**: Enabled for target countries

#### LiveKit (Video/Audio)
- [ ] **Production Project**: Created
- [ ] **API Credentials**: Configured in environment
- [ ] **TURN Servers**: Configured for NAT traversal
- [ ] **Recording**: Enabled if needed
- [ ] **Usage Limits**: Appropriate for expected load

#### Braze (Marketing Automation)
- [ ] **Production Workspace**: Created
- [ ] **API Keys**: Configured
- [ ] **SDK Integration**: Tested
- [ ] **User Attributes**: Mapped correctly
- [ ] **Event Tracking**: All events firing
- [ ] **Email Templates**: Approved and tested
- [ ] **Push Notifications**: Certificates configured (iOS/Android)

#### Sentry (Error Tracking)
- [ ] **Production Project**: Created
- [ ] **DSN**: Configured in environment
- [ ] **Source Maps**: Uploaded for client-side
- [ ] **Release Tracking**: Enabled
- [ ] **Alert Rules**: Configured for critical errors
- [ ] **Performance Monitoring**: Enabled
- [ ] **Session Replay**: Enabled (if desired)

#### PostHog (Analytics)
- [ ] **Production Project**: Created
- [ ] **API Key**: Configured
- [ ] **Events**: All critical events tracked
- [ ] **Feature Flags**: Configured
- [ ] **Session Recording**: Enabled (if desired)
- [ ] **Funnels**: Key conversion funnels defined

### Monitoring & Observability

#### Application Performance Monitoring
- [ ] **Vercel Analytics**: Enabled
- [ ] **Sentry Performance**: Transaction tracking configured
- [ ] **Custom Metrics**: Critical business metrics tracked
- [ ] **Error Budget**: SLO targets defined

#### Log Aggregation
- [ ] **Vercel Logs**: Integration configured
- [ ] **Log Retention**: Appropriate retention period set
- [ ] **Log Alerts**: Critical error patterns configured

#### Uptime Monitoring
- [ ] **Uptime Checks**: Configured for critical endpoints
- [ ] **Alert Channels**: PagerDuty, Slack, email configured
- [ ] **Status Page**: Public status page configured
- [ ] **SSL Monitoring**: Certificate expiry alerts

### Security Infrastructure
- [ ] **WAF Rules**: Cloudflare WAF configured
- [ ] **Rate Limiting**: Applied to all public endpoints
- [ ] **Bot Protection**: Challenge for suspicious traffic
- [ ] **IP Reputation**: Block known malicious IPs
- [ ] **Security Headers**: All headers configured (see security checklist)

### Email Infrastructure
- [ ] **Transactional Email**: Resend/SendGrid configured
- [ ] **SPF Record**: Configured for domain
- [ ] **DKIM**: Keys configured and validated
- [ ] **DMARC**: Policy configured (quarantine/reject)
- [ ] **Reply-To**: Configured for all emails
- [ ] **Unsubscribe Links**: Working in all marketing emails

### Backup & Disaster Recovery
- [ ] **Database Backups**: Automated daily backups
- [ ] **Backup Testing**: Restore test completed successfully
- [ ] **S3 Backups**: Versioning and lifecycle policies
- [ ] **Code Repository**: GitHub with branch protection
- [ ] **Configuration Backups**: Environment variables documented
- [ ] **Recovery Runbook**: Documented and tested

### Networking
- [ ] **DNS Propagation**: All records propagated globally
- [ ] **IPv6**: Enabled (if supported)
- [ ] **Load Balancing**: Configured (via Vercel)
- [ ] **Failover**: Multi-region deployment (if applicable)

### Cost Management
- [ ] **Billing Alerts**: Set for all services
- [ ] **Usage Quotas**: Configured to prevent overages
- [ ] **Cost Monitoring**: Dashboard for daily tracking
- [ ] **Reserved Capacity**: Purchased for predictable load (DB, cache)

## Sign-Off

Infrastructure Lead: _________________________ Date: __________

DevOps Lead: _________________________ Date: __________

CTO: _________________________ Date: __________

---

Last Updated: November 24, 2025

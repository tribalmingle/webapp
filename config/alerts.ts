export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface AlertChannel {
  type: 'pagerduty' | 'slack' | 'email'
  target: string
}

export interface AlertDefinition {
  id: string
  description: string
  metric: string
  threshold: number
  windowMinutes: number
  condition: 'above' | 'below'
  severity: AlertSeverity
  channels: AlertChannel[]
  runbook?: string
}

/**
 * Centralized alert catalog for platform reliability
 */
export const ALERT_DEFINITIONS: AlertDefinition[] = [
  {
    id: 'slo-burn-critical',
    description: 'Error budget burn rate > 2x for 1 hour',
    metric: 'slo.burn_rate',
    threshold: 2,
    windowMinutes: 60,
    condition: 'above',
    severity: 'critical',
    channels: [
      { type: 'pagerduty', target: 'Platform-Primary' },
      { type: 'slack', target: '#ops-alerts' },
    ],
    runbook: '/docs/operations/MONITORING.md',
  },
  {
    id: 'slo-burn-warning',
    description: 'Error budget burn rate > 1.2x for 30 minutes',
    metric: 'slo.burn_rate',
    threshold: 1.2,
    windowMinutes: 30,
    condition: 'above',
    severity: 'warning',
    channels: [{ type: 'slack', target: '#ops-alerts' }],
    runbook: '/docs/operations/MONITORING.md',
  },
  {
    id: 'core-web-vitals',
    description: 'Core Web Vitals failing (more than 1 metric in poor)',
    metric: 'performance.vitals.poor_count',
    threshold: 1,
    windowMinutes: 15,
    condition: 'above',
    severity: 'warning',
    channels: [
      { type: 'slack', target: '#ops-alerts' },
      { type: 'email', target: 'perf-alerts@tribalmingle.com' },
    ],
    runbook: '/docs/operations/PERFORMANCE_TRIAGE.md',
  },
  {
    id: 'backend-latency',
    description: 'API latency p95 exceeds 700ms',
    metric: 'backend.latency.p95',
    threshold: 700,
    windowMinutes: 10,
    condition: 'above',
    severity: 'warning',
    channels: [{ type: 'slack', target: '#ops-alerts' }],
    runbook: '/docs/operations/PERFORMANCE_TRIAGE.md',
  },
  {
    id: 'queue-backlog',
    description: 'Background job queue depth exceeds 5k',
    metric: 'jobs.queue.depth',
    threshold: 5000,
    windowMinutes: 5,
    condition: 'above',
    severity: 'critical',
    channels: [
      { type: 'pagerduty', target: 'Platform-Primary' },
      { type: 'slack', target: '#ops-alerts' },
    ],
    runbook: '/docs/runbooks/JOBS_BACKLOG.md',
  },
  {
    id: 'incident-chatter',
    description: 'Concurrent SEV1+ incidents detected',
    metric: 'incidents.active.sev1_plus',
    threshold: 0,
    windowMinutes: 1,
    condition: 'above',
    severity: 'critical',
    channels: [
      { type: 'pagerduty', target: 'Security-Primary' },
      { type: 'slack', target: '#security-incidents' },
    ],
    runbook: '/docs/security/BREACH_RESPONSE.md',
  },
]

export function getCriticalAlerts() {
  return ALERT_DEFINITIONS.filter(alert => alert.severity === 'critical')
}

export function findAlertById(id: string) {
  return ALERT_DEFINITIONS.find(alert => alert.id === id)
}

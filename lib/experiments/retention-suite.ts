export type RetentionExperimentType = 'reactivation_drip' | 'ai_nudge' | 'guardian_outreach'

export type RetentionExperiment = {
  id: string
  type: RetentionExperimentType
  name: string
  hypothesis: string
  targeting: string
  metrics: string[]
  status: 'draft' | 'running' | 'paused' | 'completed'
}

export const retentionExperimentCatalog: RetentionExperiment[] = [
  {
    id: 'exp-reactivation-drip-v1',
    type: 'reactivation_drip',
    name: 'Warm ember emails',
    hypothesis: 'Pair concierge voice notes + guardian quotes increases 30-day reactivation by 12%.',
    targeting: 'Members inactive 14+ days with >=2 guardian interactions logged.',
    metrics: ['reactivations_30d', 'open_rate', 'concierge_followups'],
    status: 'draft',
  },
  {
    id: 'exp-ai-nudge-v1',
    type: 'ai_nudge',
    name: 'AI prompt adoption',
    hypothesis: 'Surfacing AI-crafted “today’s opener” boosts chat replies by 18%.',
    targeting: 'Premium members with <2 daily replies.',
    metrics: ['reply_rate', 'ai_prompt_accept_rate'],
    status: 'running',
  },
  {
    id: 'exp-guardian-outreach-v1',
    type: 'guardian_outreach',
    name: 'Guardian gratitude loop',
    hypothesis: 'Sending thank-you recaps to guardians reduces churn among members who invited family.',
    targeting: 'Members with guardian portal access + <1 interaction last 21 days.',
    metrics: ['guardian_engagement', 'churn_rate'],
    status: 'draft',
  },
]

export function getExperimentsByStatus(status: RetentionExperiment['status']) {
  return retentionExperimentCatalog.filter((experiment) => experiment.status === status)
}

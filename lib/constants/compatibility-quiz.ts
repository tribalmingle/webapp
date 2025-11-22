export type CompatibilityDimensionKey = 'family' | 'faith' | 'ambition' | 'lifestyle' | 'community'

export type CompatibilityQuestion = {
  id: string
  title: string
  helper: string
  dimension: CompatibilityDimensionKey
  leftLabel: string
  rightLabel: string
  weight?: number
}

export type CompatibilityPersona = {
  id: string
  label: string
  summary: string
  weights: Partial<Record<CompatibilityDimensionKey, number>>
}

export const DEFAULT_COMPATIBILITY_VALUE = 3

export const COMPATIBILITY_DIMENSIONS: Array<{
  key: CompatibilityDimensionKey
  label: string
  description: string
}> = [
  {
    key: 'family',
    label: 'Family & Tradition',
    description: 'How you prioritize elders, heritage, and building a grounded household.',
  },
  {
    key: 'faith',
    label: 'Faith & Spirituality',
    description: 'How strongly faith practices or spirituality guide your daily decisions.',
  },
  {
    key: 'ambition',
    label: 'Ambition & Growth',
    description: 'Career drive, financial goals, and appetite for continuous learning.',
  },
  {
    key: 'lifestyle',
    label: 'Lifestyle & Wellness',
    description: 'Day-to-day rhythm, wellness habits, travel cadence, and pace of life.',
  },
  {
    key: 'community',
    label: 'Community & Culture',
    description: 'How you plug into diaspora communities, volunteer work, and cultural events.',
  },
]

export const COMPATIBILITY_QUESTIONS: CompatibilityQuestion[] = [
  {
    id: 'family-traditions',
    title: 'Family traditions anchor my decisions',
    helper: 'Do you prefer to keep elders involved or carve your own path?',
    dimension: 'family',
    leftLabel: 'Independent choices',
    rightLabel: 'Family-guided choices',
  },
  {
    id: 'future-home-base',
    title: 'My future home should be close to extended family',
    helper: 'How important is proximity to loved ones or a diaspora hub?',
    dimension: 'family',
    leftLabel: 'Anywhere feels like home',
    rightLabel: 'Must stay near family',
  },
  {
    id: 'faith-rhythm',
    title: 'Shared faith practices are non-negotiable',
    helper: 'Consider prayer routines, attending services, and spiritual rhythms.',
    dimension: 'faith',
    leftLabel: 'Interfaith is fine',
    rightLabel: 'Need shared faith',
  },
  {
    id: 'purpose-alignment',
    title: 'I want a partner on the same purpose journey',
    helper: 'Think about ministry, philanthropy, or purposeful work.',
    dimension: 'faith',
    leftLabel: 'Separate callings',
    rightLabel: 'Shared calling',
  },
  {
    id: 'career-pace',
    title: 'Career acceleration matters at this stage',
    helper: 'Balance of hustle versus savoring the season.',
    dimension: 'ambition',
    leftLabel: 'Cozy pace',
    rightLabel: 'Hyper-growth pace',
  },
  {
    id: 'wealth-vision',
    title: 'We should map out a wealth plan early',
    helper: 'Budgeting, investments, and legacy planning during engagement.',
    dimension: 'ambition',
    leftLabel: 'Figure it out later',
    rightLabel: 'Plan before "yes"',
  },
  {
    id: 'weekend-energy',
    title: 'Weekends are for discovery and events',
    helper: 'Gauge social battery versus cozy-in energy.',
    dimension: 'lifestyle',
    leftLabel: 'Homebody flow',
    rightLabel: 'Out every weekend',
  },
  {
    id: 'wellness-discipline',
    title: 'Wellness routines keep me grounded',
    helper: 'Think fitness, food discipline, sleep, and mental health practices.',
    dimension: 'lifestyle',
    leftLabel: 'Go with the flow',
    rightLabel: 'Strict wellness cadence',
  },
  {
    id: 'community-service',
    title: 'Serving my community is core to who I am',
    helper: 'Mentoring, volunteering, or diaspora leadership hours.',
    dimension: 'community',
    leftLabel: 'When time allows',
    rightLabel: 'Weekly priority',
  },
  {
    id: 'cultural-curation',
    title: 'I curate cultural experiences for friends',
    helper: 'Hosting salons, planning heritage trips, or leading affinity spaces.',
    dimension: 'community',
    leftLabel: 'Prefer to attend',
    rightLabel: 'I love to host',
  },
]

export const COMPATIBILITY_PERSONAS: CompatibilityPersona[] = [
  {
    id: 'legacy_builder',
    label: 'Legacy Builder',
    summary: 'Rooted in family heritage, planning dynastic wealth and rituals early.',
    weights: { family: 0.4, ambition: 0.3, faith: 0.3 },
  },
  {
    id: 'purpose_partner',
    label: 'Purpose Partner',
    summary: 'Needs alignment on calling, philanthropy, and faith rhythms.',
    weights: { faith: 0.45, community: 0.25, family: 0.3 },
  },
  {
    id: 'jetset_creative',
    label: 'Jetset Creative',
    summary: 'Thrives on movement, events, and expressive shared experiences.',
    weights: { lifestyle: 0.45, community: 0.35, ambition: 0.2 },
  },
  {
    id: 'wellness_anchor',
    label: 'Wellness Anchor',
    summary: 'Optimizes for regulated routines, slow living, and emotional safety.',
    weights: { lifestyle: 0.5, family: 0.25, faith: 0.25 },
  },
  {
    id: 'impact_maker',
    label: 'Impact Maker',
    summary: 'Leads community projects and wants a partner equally plugged in.',
    weights: { community: 0.5, ambition: 0.2, faith: 0.3 },
  },
]

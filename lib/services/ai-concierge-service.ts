import { randomUUID } from 'crypto'

export type ConciergeIntent = 'introduction' | 'date_plan' | 'long_distance_support'

export type ConciergeMemberContext = {
  memberId: string
  name?: string
  homeCity?: string
  homeCountry?: string
  partnerCity?: string
  partnerCountry?: string
  relationshipStage?: 'match' | 'first_date' | 'exclusive' | 'long_distance'
  preferences?: {
    budgetLevel?: 'low' | 'medium' | 'premium'
    vibe?: 'casual' | 'adventurous' | 'luxury' | 'cultural'
    dietaryNotes?: string
    accessibilityNotes?: string
  }
  conciergeNotes?: string
}

export type ConciergePlan = {
  id: string
  intent: ConciergeIntent
  headline: string
  summary: string
  checklist: string[]
  recommendations: Array<{ title: string; description: string; category: 'prep' | 'date' | 'follow_up'; metadata?: Record<string, unknown> }>
  followUpActions: Array<{ label: string; dueBy?: string; assignee: 'member' | 'concierge' }>
  confidence: number
  createdAt: string
}

const dateIdeaBank = [
  {
    title: 'Guardian-approved tasting trail',
    description: 'Reserve a chef-led tasting menu that highlights West African small plates, then surprise them with a handwritten blessing from their guardian/auntie.',
    vibe: 'cultural',
    budget: 'premium',
  },
  {
    title: 'Sunset market hop',
    description: 'Hit the dusk art market, pick matching bracelets, and close the night at a rooftop mocktail lounge with live highlife.',
    vibe: 'adventurous',
    budget: 'medium',
  },
  {
    title: 'Story studio date',
    description: 'Book a cozy studio, record voice notes answering tribal prompt cards, then swap playlists for the commute home.',
    vibe: 'casual',
    budget: 'low',
  },
]

const longDistanceTips = [
  {
    title: 'Visa briefing',
    description: 'Use the Long-Distance Toolkit to check visa wait times and vaccination requirements before booking flights.',
  },
  {
    title: 'Timezone ritual',
    description: 'Set a shared calendar block for mid-week “tea calls” using the timezone coordinator so nobody feels rushed.',
  },
  {
    title: 'Surprise concierge drop',
    description: 'Schedule concierge-delivered care packages sourced from each partner’s hometown market.',
  },
]

export function generateConciergePlan(intent: ConciergeIntent, context: ConciergeMemberContext): ConciergePlan {
  const id = randomUUID()
  const createdAt = new Date().toISOString()
  const vibeHint = context.preferences?.vibe ?? 'cultural'

  const headline = buildHeadline(intent, context)
  const summary = buildSummary(intent, context)
  const checklist = buildChecklist(intent, context)
  const recommendations = buildRecommendations(intent, context, vibeHint)
  const followUpActions = buildFollowUps(intent)

  return {
    id,
    intent,
    headline,
    summary,
    checklist,
    recommendations,
    followUpActions,
    confidence: scoreConfidence(intent, context),
    createdAt,
  }
}

function buildHeadline(intent: ConciergeIntent, context: ConciergeMemberContext) {
  switch (intent) {
    case 'date_plan':
      return `Curated date plan for ${context.homeCity ?? 'your city'}`
    case 'long_distance_support':
      return 'Long-distance support ritual'
    default:
      return 'Concierge introduction game plan'
  }
}

function buildSummary(intent: ConciergeIntent, context: ConciergeMemberContext) {
  const names = context.name ? `${context.name}` : 'This member'
  if (intent === 'date_plan') {
    return `${names} gets a three-beat date lineup tuned for a ${context.preferences?.vibe ?? 'cultural'} vibe.`
  }
  if (intent === 'long_distance_support') {
    return `${names} needs continuity between ${context.homeCity ?? 'City A'} and ${context.partnerCity ?? 'City B'}.` 
  }
  return `${names} wants a confident opener with tribal storytelling baked in.`
}

function buildChecklist(intent: ConciergeIntent, context: ConciergeMemberContext) {
  const base = ['Confirm dietary & accessibility notes', 'Log concierge touchpoint in CRM']
  if (intent === 'date_plan') {
    base.push('Pre-book venue with concierge card', 'Prep guardian-friendly recap template')
  } else if (intent === 'long_distance_support') {
    base.push('Share visa cheat sheet', 'Queue timezone-friendly call invites')
  } else {
    base.push('Draft opener referencing tribe map insight', 'Attach AI-generated icebreaker')
  }
  if (context.conciergeNotes) {
    base.push('Review previous concierge notes before outreach')
  }
  return base
}

function buildRecommendations(intent: ConciergeIntent, context: ConciergeMemberContext, vibeHint: string) {
  if (intent === 'long_distance_support') {
    return longDistanceTips.map((tip) => ({ ...tip, category: 'prep' as const }))
  }

  if (intent === 'date_plan') {
    const curated = dateIdeaBank.filter((idea) => idea.vibe === vibeHint || idea.budget === context.preferences?.budgetLevel)
    const fallbacks = curated.length ? curated : dateIdeaBank
    return fallbacks.map((idea) => ({
      title: idea.title,
      description: idea.description,
      category: 'date' as const,
      metadata: {
        vibe: idea.vibe,
        budget: idea.budget,
        city: context.homeCity,
      },
    }))
  }

  return [
    {
      title: 'Intro riff',
      description: 'Mention their shared tribe map overlap + follow with one concierge-sourced compliment.',
      category: 'prep' as const,
    },
    {
      title: 'Guardian check-in',
      description: 'Offer to loop in a guardian on the second date planning session to build trust early.',
      category: 'follow_up' as const,
    },
  ]
}

function buildFollowUps(intent: ConciergeIntent) {
  if (intent === 'long_distance_support') {
    return [
      { label: 'Send visa + flight brief', dueBy: addDays(2), assignee: 'concierge' as const },
      { label: 'Schedule timezone ritual reminder', dueBy: addDays(5), assignee: 'member' as const },
    ]
  }
  if (intent === 'date_plan') {
    return [
      { label: 'Confirm venue availability', dueBy: addDays(1), assignee: 'concierge' as const },
      { label: 'Send gratitude recap note', dueBy: addDays(3), assignee: 'member' as const },
    ]
  }
  return [
    { label: 'Deliver opener script', dueBy: addDays(1), assignee: 'concierge' as const },
  ]
}

function scoreConfidence(intent: ConciergeIntent, context: ConciergeMemberContext) {
  let base = 0.72
  if (intent === 'date_plan') {
    base += 0.08
  }
  if (context.preferences?.budgetLevel === 'premium') {
    base += 0.04
  }
  if (context.relationshipStage === 'long_distance') {
    base -= 0.05
  }
  return Math.max(0, Math.min(1, base))
}

function addDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

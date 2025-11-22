import {
  COMPATIBILITY_DIMENSIONS,
  COMPATIBILITY_PERSONAS,
  COMPATIBILITY_QUESTIONS,
  type CompatibilityQuestion,
} from '@/lib/constants/compatibility-quiz'
import { upsertCompatibilityDraft } from '@/lib/services/onboarding-profile-service'

type QuizAnswer = {
  promptId: string
  value: number
  note?: string
}

type EvaluateInput = {
  applicantId?: string
  email: string
  answers: QuizAnswer[]
}

type DimensionScore = {
  dimension: string
  label: string
  score: number
}

type PersonaScore = {
  id: string
  label: string
  summary: string
  score: number
}

type EvaluateResult = {
  prospectId: string
  overallScore: number
  dimensionScores: DimensionScore[]
  personas: PersonaScore[]
  insights: string[]
  savedAt: string
}

export class CompatibilityQuizService {
  private questions: CompatibilityQuestion[] = COMPATIBILITY_QUESTIONS

  async evaluate(input: EvaluateInput): Promise<EvaluateResult> {
    if (!input.email) {
      throw new Error('Email is required to save compatibility progress')
    }

    const sanitizedAnswers = this.questions.map((prompt) => {
      const provided = input.answers.find((answer) => answer.promptId === prompt.id)
      return {
        promptId: prompt.id,
        value: this.clampValue(provided?.value ?? 3),
        note: provided?.note,
      }
    })

    const dimensionScores = this.computeDimensionScores(sanitizedAnswers)
    const personas = this.computePersonaScores(dimensionScores)
    const insights = this.buildInsights(dimensionScores, personas)
    const overallScore = this.computeOverallScore(dimensionScores)

    const { prospectId } = await upsertCompatibilityDraft({
      prospectId: input.applicantId,
      email: input.email,
      personas: personas.map((persona) => ({ id: persona.id, score: persona.score / 100 })),
      values: sanitizedAnswers,
      stage: 'quiz_complete',
    })

    return {
      prospectId,
      overallScore,
      dimensionScores,
      personas,
      insights,
      savedAt: new Date().toISOString(),
    }
  }

  private computeDimensionScores(answers: QuizAnswer[]): DimensionScore[] {
    const grouped: Record<string, { total: number; count: number }> = {}

    answers.forEach((answer) => {
      const prompt = this.questions.find((q) => q.id === answer.promptId)
      if (!prompt) return
      if (!grouped[prompt.dimension]) {
        grouped[prompt.dimension] = { total: 0, count: 0 }
      }
      grouped[prompt.dimension].total += answer.value
      grouped[prompt.dimension].count += 1
    })

    return COMPATIBILITY_DIMENSIONS.map((dimension) => {
      const entry = grouped[dimension.key]
      if (!entry) {
        return { dimension: dimension.key, label: dimension.label, score: 50 }
      }
      const avg = entry.total / entry.count
      return {
        dimension: dimension.key,
        label: dimension.label,
        score: Math.round((avg / 5) * 100),
      }
    })
  }

  private computePersonaScores(dimensionScores: DimensionScore[]): PersonaScore[] {
    const lookup = Object.fromEntries(dimensionScores.map((score) => [score.dimension, score.score]))
    return COMPATIBILITY_PERSONAS.map((persona) => {
      const weightSum = Object.values(persona.weights).reduce((sum, weight = 0) => sum + weight, 0) || 1
      const weightedScore = Object.entries(persona.weights).reduce((sum, [dimension, weight = 0]) => {
        const dimensionScore = lookup[dimension] ?? 50
        return sum + dimensionScore * weight
      }, 0)
      return {
        id: persona.id,
        label: persona.label,
        summary: persona.summary,
        score: Math.round(weightedScore / weightSum),
      }
    }).sort((a, b) => b.score - a.score)
  }

  private buildInsights(dimensionScores: DimensionScore[], personas: PersonaScore[]): string[] {
    const insights: string[] = []
    const sortedDimensions = [...dimensionScores].sort((a, b) => b.score - a.score)
    const topPersona = personas[0]

    sortedDimensions.slice(0, 2).forEach((dimension) => {
      const emphasis = dimension.score >= 70 ? 'strong' : 'balanced'
      insights.push(
        `${dimension.label}: ${emphasis === 'strong' ? 'high alignment' : 'steady alignment'} (${dimension.score}%)`,
      )
    })

    const growthOpportunity = sortedDimensions[sortedDimensions.length - 1]
    if (growthOpportunity) {
      insights.push(`Growth area: ${growthOpportunity.label} (${growthOpportunity.score}%)`)
    }

    if (topPersona) {
      insights.unshift(`${topPersona.label}: ${topPersona.summary}`)
    }

    return insights
  }

  private computeOverallScore(dimensionScores: DimensionScore[]): number {
    if (!dimensionScores.length) return 50
    const total = dimensionScores.reduce((sum, dimension) => sum + dimension.score, 0)
    return Math.round(total / dimensionScores.length)
  }

  private clampValue(value: number) {
    if (Number.isNaN(value)) return 3
    return Math.min(5, Math.max(1, Number(value)))
  }
}

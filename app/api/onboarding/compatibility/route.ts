import { NextRequest, NextResponse } from 'next/server'

import {
  COMPATIBILITY_DIMENSIONS,
  COMPATIBILITY_PERSONAS,
  COMPATIBILITY_QUESTIONS,
} from '@/lib/constants/compatibility-quiz'
import { CompatibilityQuizService } from '@/lib/services/compatibility-quiz-service'

const quizService = new CompatibilityQuizService()

export async function GET() {
  return NextResponse.json({
    questions: COMPATIBILITY_QUESTIONS,
    personas: COMPATIBILITY_PERSONAS,
    dimensions: COMPATIBILITY_DIMENSIONS,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { applicantId, email, answers } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'Answers are required' }, { status: 400 })
    }

    const result = await quizService.evaluate({ applicantId, email, answers })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Compatibility quiz submission failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

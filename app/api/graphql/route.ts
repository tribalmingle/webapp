import { NextRequest, NextResponse } from 'next/server'
import { graphql } from 'graphql'

import { getCurrentUser } from '@/lib/auth'
import { schema } from '@/lib/graphql/schema'

export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser()
  if (!authUser) {
    return NextResponse.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ errors: [{ message: 'Invalid body' }] }, { status: 400 })
  }

  const result = await graphql({
    schema,
    source: body.query,
    variableValues: body.variables,
    operationName: body.operationName,
    contextValue: { userId: authUser.userId },
  })

  const status = result.errors?.length ? 400 : 200
  return NextResponse.json(result, { status })
}

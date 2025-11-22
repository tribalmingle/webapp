import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { DiscoveryService } from '@/lib/services/discovery-service'

export async function GET() {
  const authUser = await getCurrentUser()
  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const recipes = await DiscoveryService.listRecipes(authUser.userId)
    return NextResponse.json({ success: true, data: recipes })
  } catch (error) {
    console.error('[discover] recipe fetch failed', error)
    return NextResponse.json({ success: false, error: 'Unable to load recipes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser()
  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let payload: any
  try {
    payload = await request.json()
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!payload?.name || typeof payload.name !== 'string') {
    return NextResponse.json({ success: false, error: 'Recipe name required' }, { status: 400 })
  }

  try {
    const recipe = await DiscoveryService.saveRecipe(authUser.userId, {
      name: payload.name,
      filters: payload.filters ?? {},
      isDefault: payload.isDefault ?? false,
    })
    return NextResponse.json({ success: true, data: recipe })
  } catch (error) {
    console.error('[discover] recipe save failed', error)
    return NextResponse.json({ success: false, error: 'Unable to save recipe' }, { status: 500 })
  }
}

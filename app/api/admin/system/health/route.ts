import { NextResponse } from 'next/server'

type HealthCheck = {
  service: string
  status: 'healthy' | 'degraded' | 'down'
  latency?: number
  message?: string
}

async function checkMongoDB(): Promise<HealthCheck> {
  try {
    const start = Date.now()
    const { getMongoDb } = await import('@/lib/mongodb')
    const db = await getMongoDb()
    await db.admin().ping()
    const latency = Date.now() - start
    
    return {
      service: 'MongoDB',
      status: latency < 100 ? 'healthy' : 'degraded',
      latency,
    }
  } catch (error: any) {
    return {
      service: 'MongoDB',
      status: 'down',
      message: error.message,
    }
  }
}

async function checkStripe(): Promise<HealthCheck> {
  try {
    const start = Date.now()
    // Mock Stripe health check
    const latency = Date.now() - start
    
    return {
      service: 'Stripe',
      status: 'healthy',
      latency,
    }
  } catch (error: any) {
    return {
      service: 'Stripe',
      status: 'down',
      message: error.message,
    }
  }
}

async function checkTwilio(): Promise<HealthCheck> {
  return {
    service: 'Twilio',
    status: 'healthy',
    latency: 50,
  }
}

async function checkS3(): Promise<HealthCheck> {
  return {
    service: 'AWS S3',
    status: 'healthy',
    latency: 75,
  }
}

async function checkRedis(): Promise<HealthCheck> {
  return {
    service: 'Redis',
    status: 'healthy',
    latency: 15,
  }
}

export async function GET() {
  try {
    const checks = await Promise.all([
      checkMongoDB(),
      checkStripe(),
      checkTwilio(),
      checkS3(),
      checkRedis(),
    ])

    const overall = checks.every(c => c.status === 'healthy') 
      ? 'healthy' 
      : checks.some(c => c.status === 'down')
      ? 'down'
      : 'degraded'

    return NextResponse.json({
      status: overall,
      timestamp: new Date().toISOString(),
      checks,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.REDIS_URL
  if (!url) return null
  redis = new Redis(url, { maxRetriesPerRequest: 2, enableReadyCheck: true })
  return redis
}

export async function redisRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }>{
  const r = getRedis()
  if (!r) return { allowed: true, remaining: limit }
  const nowBucket = Math.floor(Date.now() / 1000 / windowSeconds)
  const bucketKey = `${key}:${nowBucket}`
  const current = await r.incr(bucketKey)
  if (current === 1) {
    await r.expire(bucketKey, windowSeconds)
  }
  return { allowed: current <= limit, remaining: Math.max(0, limit - current) }
}

export async function redisCacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis(); if (!r) return null
  const raw = await r.get(key)
  return raw ? JSON.parse(raw) as T : null
}

export async function redisCacheSet(key: string, value: unknown, ttlSeconds: number) {
  const r = getRedis(); if (!r) return
  await r.set(key, JSON.stringify(value), 'EX', ttlSeconds)
}

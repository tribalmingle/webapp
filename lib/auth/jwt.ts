import { createToken, verifyToken, type JWTPayload } from '../auth'

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  return verifyToken(token)
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  return createToken(payload)
}

export type { JWTPayload }

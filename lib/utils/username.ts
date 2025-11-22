import { Db } from 'mongodb'

/**
 * Generates a unique username from a person's name
 * Format: firstname + random 4-digit number
 * Example: John Smith -> john1234
 */
export async function generateUniqueUsername(name: string, db: Db): Promise<string> {
  // Extract first name and convert to lowercase
  const firstName = name.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  
  // Try to generate unique username (max 10 attempts)
  for (let attempt = 0; attempt < 10; attempt++) {
    // Generate random 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const username = `${firstName}${randomNum}`
    
    // Check if username already exists
    const existingUser = await db.collection('users').findOne({ username })
    
    if (!existingUser) {
      return username
    }
  }
  
  // Fallback: use timestamp if all attempts fail
  const timestamp = Date.now().toString().slice(-6)
  return `${firstName}${timestamp}`
}

/**
 * Validates username format
 * Rules:
 * - 3-20 characters
 * - Only lowercase letters, numbers, and underscores
 * - Must start with a letter
 */
export function validateUsername(username: string): { valid: boolean; message?: string } {
  if (!username || username.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters long' }
  }
  
  if (username.length > 20) {
    return { valid: false, message: 'Username must be 20 characters or less' }
  }
  
  if (!/^[a-z]/.test(username)) {
    return { valid: false, message: 'Username must start with a letter' }
  }
  
  if (!/^[a-z0-9_]+$/.test(username)) {
    return { valid: false, message: 'Username can only contain lowercase letters, numbers, and underscores' }
  }
  
  return { valid: true }
}

/**
 * Checks if a username is available
 */
export async function isUsernameAvailable(username: string, db: Db): Promise<boolean> {
  const existingUser = await db.collection('users').findOne({ username })
  return !existingUser
}

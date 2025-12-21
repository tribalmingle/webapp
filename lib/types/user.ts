import { ObjectId } from 'mongodb'

export interface User {
  _id?: ObjectId
  email: string
  password: string
  name: string
  username: string // Unique username - auto-generated if not provided
  age: number
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  phone?: string // Phone number (locked after first use)
  tribe?: string
  bio?: string
  interests?: string[] // Now array of selected interests
  location?: string
  city?: string // City of residence
  cityOfOrigin?: string // City of origin
  country?: string // Country of residence
  countryOfOrigin?: string // Country of origin
  maritalStatus?: string
  profilePhotos?: string[] // Up to 10 photos
  profilePhoto?: string
  selfiePhoto?: string
  verified: boolean
  registrationComplete: boolean // True when user completes all registration steps
  registrationStep?: number // Track which step user is on (1-7)
  registrationReminderSent?: boolean // Track if 10-min reminder was sent
  subscriptionPlan?: 'free' | 'monthly' | '3-months' | '6-months'
  height?: string // Height in feet format
  bodyType?: string
  education?: string // Highest education level
  occupation?: string
  religion?: string
  lookingFor?: string // What they're looking for
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile extends Omit<User, 'password'> {
  _id: ObjectId
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: UserProfile
  token?: string
  redirectTo?: string // Where to redirect after login (dashboard or continue registration)
}

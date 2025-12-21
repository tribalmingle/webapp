import { randomUUID } from 'node:crypto'

import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server'
import type { PublicKeyCredentialCreationOptionsJSON, RegistrationResponseJSON } from '@simplewebauthn/typescript-types'
import { ObjectId } from 'mongodb'

import { getCollection } from '@/lib/db/mongodb'
import { sendVerificationCodeEmail } from '@/lib/vendors/resend-client'

const PASSKEY_RP_ID = process.env.PASSKEY_RP_ID ?? 'localhost'
const PASSKEY_RP_NAME = process.env.PASSKEY_RP_NAME ?? 'Tribal Mingle'
const PASSKEY_ORIGIN = process.env.PASSKEY_ORIGIN ?? 'http://localhost:3000'

const applicantsCollectionName = 'onboarding_applicants'

interface PasskeyChallengeResult {
  options: PublicKeyCredentialCreationOptionsJSON
  prospectId: string
}

export async function startPasskeyRegistration(email: string, prospectId?: string): Promise<PasskeyChallengeResult> {
  const applicants = await getCollection(applicantsCollectionName)
  const applicantId = prospectId ? new ObjectId(prospectId) : new ObjectId()
  const now = new Date()

  await applicants.updateOne(
    { _id: applicantId },
    {
      $set: {
        email,
        updatedAt: now,
        lastStep: 'identity',
      },
      $setOnInsert: {
        createdAt: now,
        status: 'initiated',
      },
    },
    { upsert: true },
  )

  const options = await generateRegistrationOptions({
    rpID: PASSKEY_RP_ID,
    rpName: PASSKEY_RP_NAME,
    timeout: 60000,
    userID: Buffer.from(applicantId.toHexString()),
    userName: email,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  })

  return { options, prospectId: applicantId.toHexString() }
}

export async function finishPasskeyRegistration(email: string, prospectId: string, expectedChallenge: string | undefined, attestation: RegistrationResponseJSON) {
  if (!expectedChallenge) {
    throw new Error('Passkey challenge missing')
  }

  const verification = await verifyRegistrationResponse({
    response: attestation,
    expectedChallenge,
    expectedOrigin: PASSKEY_ORIGIN,
    expectedRPID: PASSKEY_RP_ID,
    requireUserVerification: true,
  })

  if (verification.registrationInfo?.credentialID) {
    const applicants = await getCollection(applicantsCollectionName)
    await applicants.updateOne(
      { _id: new ObjectId(prospectId) },
      {
        $set: {
          email,
          passkey: {
            credentialId: Buffer.from(verification.registrationInfo.credentialID).toString('base64url'),
            publicKey: Buffer.from(verification.registrationInfo.credentialPublicKey).toString('base64'),
            counter: verification.registrationInfo.counter,
            verifiedAt: new Date(),
          },
          updatedAt: new Date(),
          status: 'verified',
        },
      },
    )
  }

  return { verified: verification.verified }
}

export async function sendVerificationCode(email: string, phone: string, prospectId?: string) {
  const applicants = await getCollection(applicantsCollectionName)
  const users = await getCollection('users')
  const applicantId = prospectId ? new ObjectId(prospectId) : new ObjectId()
  const now = new Date()

  // Check if phone number is already in use
  const existingUserWithPhone = await users.findOne({ phone })
  if (existingUserWithPhone) {
    throw new Error('This phone number is already registered. Please log in or use a different number.')
  }

  const existingApplicantWithPhone = await applicants.findOne({ 
    phone,
    _id: { $ne: applicantId } // Allow current applicant to resend code
  })
  if (existingApplicantWithPhone) {
    throw new Error('This phone number is already in use. Please use a different number.')
  }

  await applicants.updateOne(
    { _id: applicantId },
    {
      $set: {
        email,
        phone,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
        status: 'initiated',
      },
    },
    { upsert: true },
  )

  try {
    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    console.log('[onboarding] Sending verification code to:', phone)
    
    // Send via SMS using Termii
    const { sendSMSViaTermii } = await import('@/lib/vendors/termii-client')
    const smsResult = await sendSMSViaTermii({
      to: phone,
      message: `Your Tribal Mingle verification code is: ${verificationCode}. Valid for 10 minutes.`,
    })

    console.log('[onboarding] SMS sent successfully')

    // Store the code and session ID for verification
    await applicants.updateOne(
      { _id: applicantId },
      {
        $set: {
          verificationCode,
          verificationCodeExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          otpSentAt: now,
        },
      },
    )

    // Also send the same code via email
    sendVerificationCodeEmail({
      to: email,
      name: email.split('@')[0],
      code: verificationCode,
    }).catch((error) => {
      console.warn('[onboarding] Failed to send email verification:', error)
      // Don't fail if email send fails - SMS is primary
    })

    return { prospectId: applicantId.toHexString(), sid: smsResult.messageId }
  } catch (error) {
    console.error('[onboarding] Failed to send verification code:', error)
    
    // Provide more specific error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    if (errorMessage.includes('phone number')) {
      throw new Error('Invalid phone number format. Please use international format (e.g., +2348012345678)')
    }
    if (errorMessage.includes('TERMII_API_KEY')) {
      throw new Error('SMS service not configured. Please contact support.')
    }
    
    throw new Error(`Unable to send verification code: ${errorMessage}`)
  }
}

export async function confirmVerificationCode(prospectId: string, phone: string, code: string) {
  try {
    const applicants = await getCollection(applicantsCollectionName)
    const applicant = await applicants.findOne({ _id: new ObjectId(prospectId) })

    if (!applicant) {
      return { verified: false }
    }

    // Check if code matches and hasn't expired
    const now = new Date()
    if (
      applicant.verificationCode === code &&
      applicant.verificationCodeExpiry &&
      new Date(applicant.verificationCodeExpiry) > now
    ) {
      await markPhoneVerified(prospectId)
      return { verified: true }
    }

    return { verified: false }
  } catch (error) {
    console.error('[onboarding] Failed to verify code:', error)
    return { verified: false }
  }
}

async function markPhoneVerified(prospectId: string) {
  const applicants = await getCollection(applicantsCollectionName)
  await applicants.updateOne(
    { _id: new ObjectId(prospectId) },
    {
      $set: {
        phoneVerification: {
          verified: true,
          verifiedAt: new Date(),
        },
        status: 'verified',
        updatedAt: new Date(),
      },
    },
  )
}

export function scoreOnboardingRisk(input: { passkeyVerified: boolean; phoneVerified: boolean; geoMatch?: boolean }) {
  let score = 0.5
  if (input.passkeyVerified) score += 0.25
  if (input.phoneVerified) score += 0.15
  if (input.geoMatch) score += 0.05
  return Math.min(1, score)
}

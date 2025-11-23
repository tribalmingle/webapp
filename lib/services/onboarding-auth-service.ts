import { randomUUID } from 'node:crypto'

import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server'
import type { PublicKeyCredentialCreationOptionsJSON, RegistrationResponseJSON } from '@simplewebauthn/typescript-types'
import { ObjectId } from 'mongodb'
import twilio from 'twilio'

import { getCollection } from '@/lib/db/mongodb'

const PASSKEY_RP_ID = process.env.PASSKEY_RP_ID ?? 'localhost'
const PASSKEY_RP_NAME = process.env.PASSKEY_RP_NAME ?? 'Tribal Mingle'
const PASSKEY_ORIGIN = process.env.PASSKEY_ORIGIN ?? 'http://localhost:3000'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID

const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null
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
  const applicantId = prospectId ? new ObjectId(prospectId) : new ObjectId()
  const now = new Date()

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

  if (!twilioClient || !TWILIO_VERIFY_SERVICE_SID) {
    console.warn('[onboarding] Twilio not configured, returning mock verification SID')
    return { prospectId: applicantId.toHexString(), sid: `mock-${randomUUID()}` }
  }

  const verification = await twilioClient.verify.v2.services(TWILIO_VERIFY_SERVICE_SID).verifications.create({
    to: phone,
    channel: 'sms',
  })

  return { prospectId: applicantId.toHexString(), sid: verification.sid }
}

export async function confirmVerificationCode(prospectId: string, phone: string, code: string) {
  if (!twilioClient || !TWILIO_VERIFY_SERVICE_SID) {
    await markPhoneVerified(prospectId)
    return { verified: true }
  }

  const verification = await twilioClient.verify.v2.services(TWILIO_VERIFY_SERVICE_SID).verificationChecks.create({
    to: phone,
    code,
  })

  if (verification.status === 'approved') {
    await markPhoneVerified(prospectId)
    return { verified: true }
  }

  return { verified: false }
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

import { ObjectId, type FindCursor } from 'mongodb'

import type {
  MatchingSnapshotDocument,
  ProfileDocument,
  CompatibilityQuizDocument,
  BoostSessionDocument,
} from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'
import { withSpan } from '@/lib/observability/tracing'

type CandidateScoreBreakdown = {
  compatibility: number
  culture: number
  intent: number
  boost?: number
}

export type RankedCandidate = {
  candidateId: string
  profile: {
    name: string
    tribe?: ProfileDocument['tribe']
    languages: ProfileDocument['languages']
    location?: ProfileDocument['location']
    verificationStatus?: ProfileDocument['verificationStatus']
    culturalValues: ProfileDocument['culturalValues']
    faithPractice?: ProfileDocument['faithPractice']
    marriageTimeline?: ProfileDocument['marriageTimeline']
    childrenPreference?: ProfileDocument['childrenPreference']
    visibility?: ProfileDocument['visibility']
    age?: number
    trustBadges?: string[]
  }
  matchScore: number
  scoreBreakdown: CandidateScoreBreakdown
  conciergePrompt: string
  aiOpener: string
  boostContext?: {
    placement: BoostSessionDocument['placement']
    endsAt?: string
  }
}

const ALGORITHM_VERSION = 'phase4-v1'
const SNAPSHOT_MAX = 120

export class MatchingService {
  static async getOrBuildSnapshot(userId: string, opts?: { force?: boolean }) {
    return withSpan('matching.snapshot', async () => {
      const db = await getMongoDb()
      const collection = db.collection<MatchingSnapshotDocument>('matching_snapshots')
      const userObjectId = new ObjectId(userId)

      if (!opts?.force) {
        const cached = await collection.findOne({ userId: userObjectId }, { sort: { generatedAt: -1 } })
        if (cached && Date.now() - cached.generatedAt.getTime() < 1000 * 60 * 30) {
          return cached
        }
      }

      const candidates = await this.buildCandidates(userObjectId)
      const snapshot: MatchingSnapshotDocument = {
        userId: userObjectId,
        algorithmVersion: ALGORITHM_VERSION,
        generatedAt: new Date(),
        candidates,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await collection.insertOne(snapshot)
      return snapshot
    }, { userId })
  }

  static async getRankedCandidates(userId: string) {
    const snapshot = await this.getOrBuildSnapshot(userId)
    const candidateIds = snapshot.candidates.map((candidate) => candidate.candidateId)
    const db = await getMongoDb()
    const profiles = (await db
      .collection<ProfileDocument>('profiles')
      .find({ userId: { $in: candidateIds.map((id) => new ObjectId(id)) } })
      .project({
        name: 1,
        tribe: 1,
        culturalValues: 1,
        languages: 1,
        location: 1,
        verificationStatus: 1,
        dob: 1,
        faithPractice: 1,
        marriageTimeline: 1,
        childrenPreference: 1,
        visibility: 1,
      })
      .toArray()) as ProfileDocument[]

    const profileMap = new Map<string, ProfileDocument>()
    profiles.forEach((profile) => profileMap.set(profile.userId.toHexString(), profile))

    return snapshot.candidates.map((candidate) => {
      const profile = profileMap.get(candidate.candidateId.toHexString())
      return this.toRankedCandidate(candidate, profile)
    })
  }

  static pairHash(userA: string, userB: string) {
    return [userA, userB]
      .map((id) => id.toString())
      .sort()
      .join('#')
  }

  private static toRankedCandidate(candidate: MatchingSnapshotDocument['candidates'][number], profile?: ProfileDocument): RankedCandidate {
    const languages = profile?.languages ?? []
    const firstLanguage = languages[0]?.code
    const trustBadges = this.computeTrustBadges(profile)
    const culturalValues = profile?.culturalValues ?? { spirituality: 0, tradition: 0, family: 0, modernity: 0 }

    return {
      candidateId: candidate.candidateId.toHexString(),
      matchScore: Number(candidate.score.toFixed(3)),
      scoreBreakdown: (candidate.scoreBreakdown ?? {}) as CandidateScoreBreakdown,
      profile: {
        name: profile?.name ?? 'Unknown',
        tribe: profile?.tribe,
        languages,
        location: profile?.location,
        verificationStatus: profile?.verificationStatus,
        culturalValues,
        faithPractice: profile?.faithPractice,
        marriageTimeline: profile?.marriageTimeline,
        childrenPreference: profile?.childrenPreference,
        visibility: profile?.visibility,
        age: profile?.dob ? this.calculateAge(profile.dob) : undefined,
        trustBadges,
      },
      conciergePrompt: `Share a ${firstLanguage ?? 'favorite'} ritual or weekly practice with ${profile?.name ?? 'this member'}.`,
      aiOpener: this.buildAiOpener(profile, candidate.scoreBreakdown ?? {}),
      boostContext: candidate.scoreBreakdown?.boost
        ? { placement: 'spotlight', endsAt: candidate.metadata?.boostEndsAt }
        : undefined,
    }
  }

  private static async buildCandidates(userId: ObjectId) {
    const db = await getMongoDb()
    const profileCollection = db.collection<ProfileDocument>('profiles')
    const compatibilityCollection = db.collection<CompatibilityQuizDocument>('compatibility_quizzes')
    const boostCollection = db.collection<BoostSessionDocument>('boost_sessions')

    const profile = await profileCollection.findOne({ userId })
    if (!profile) {
      throw new Error('Profile missing for matching snapshot')
    }

    const compatibility = await compatibilityCollection.findOne({ userId }, { sort: { completedAt: -1 } })
    const baseVector = this.buildEmbedding(profile, compatibility)

    const cursor = profileCollection
      .find({ userId: { $ne: userId }, 'verificationStatus.selfie': true })
      .limit(SNAPSHOT_MAX * 2)
      .project<ProfileDocument>({ name: 1, tribe: 1, culturalValues: 1, languages: 1, userId: 1, location: 1, dob: 1, verificationStatus: 1 }) as FindCursor<ProfileDocument>

    const boostSessions = await boostCollection
      .find({ status: 'active', startedAt: { $lte: new Date() }, endsAt: { $gte: new Date() } })
      .toArray()
    const boostedUserIds = new Map<string, BoostSessionDocument>()
    boostSessions.forEach((session) => boostedUserIds.set(session.userId.toHexString(), session))

    const candidates: MatchingSnapshotDocument['candidates'] = []
    let rank = 1

    while (await cursor.hasNext()) {
      const candidateProfile = await cursor.next()
      if (!candidateProfile) break
      const scoreBreakdown = this.computeScoreBreakdown(profile, candidateProfile, baseVector)
      const boostSession = boostedUserIds.get(candidateProfile.userId.toHexString())
      if (boostSession) {
        scoreBreakdown.boost = scoreBreakdown.boost ? scoreBreakdown.boost + 0.05 : 0.05
      }
      const score = Math.min(1, scoreBreakdown.compatibility * 0.45 + scoreBreakdown.culture * 0.25 + scoreBreakdown.intent * 0.2 + (scoreBreakdown.boost ?? 0) * 0.1)
      candidates.push({
        candidateId: candidateProfile.userId,
        score,
        rank,
        scoreBreakdown,
        metadata: boostSession ? { boostEndsAt: boostSession.endsAt.toISOString() } : undefined,
      })
      rank += 1
      if (candidates.length >= SNAPSHOT_MAX) break
    }

    return candidates
  }

  private static computeScoreBreakdown(baseProfile: ProfileDocument, candidate: ProfileDocument, baseVector: number[]): CandidateScoreBreakdown {
    const compatibility = this.vectorSimilarity(baseVector, this.buildEmbedding(candidate))
    const culture = this.culturalDelta(baseProfile, candidate)
    const intent = this.intentHeuristic(candidate)
    return { compatibility, culture, intent }
  }

  private static buildEmbedding(profile: ProfileDocument, quiz?: CompatibilityQuizDocument | null) {
    const vector: number[] = []
    const values = profile.culturalValues
    vector.push(values.spirituality / 5)
    vector.push(values.family / 5)
    vector.push(values.tradition / 5)
    vector.push(values.modernity / 5)
    if (quiz?.responses) {
      quiz.responses.forEach((response) => {
        vector.push(response.value / 5)
      })
    }
    while (vector.length < 32) {
      vector.push(0.5)
    }
    return vector
  }

  private static vectorSimilarity(a: number[], b: number[]) {
    const length = Math.min(a.length, b.length)
    let dot = 0
    let magA = 0
    let magB = 0
    for (let i = 0; i < length; i += 1) {
      dot += a[i] * b[i]
      magA += a[i] * a[i]
      magB += b[i] * b[i]
    }
    if (!magA || !magB) {
      return 0.5
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB))
  }

  private static culturalDelta(a: ProfileDocument, b: ProfileDocument) {
    const delta =
      Math.abs(a.culturalValues.spirituality - b.culturalValues.spirituality) +
      Math.abs(a.culturalValues.family - b.culturalValues.family) +
      Math.abs(a.culturalValues.tradition - b.culturalValues.tradition) +
      Math.abs(a.culturalValues.modernity - b.culturalValues.modernity)
    const normalized = 1 - Math.min(delta / 20, 1)
    return Number(normalized.toFixed(3))
  }

  private static intentHeuristic(profile: ProfileDocument) {
    const hasGuardianBadge = profile.verificationStatus?.background ?? false
    const languages = profile.languages?.length ?? 0
    const multiplier = hasGuardianBadge ? 1 : 0.85
    const normalized = Math.min(1, 0.6 + languages * 0.05) * multiplier
    return Number(normalized.toFixed(3))
  }

  private static buildAiOpener(profile: ProfileDocument | undefined, breakdown: Record<string, number>) {
    const name = profile?.name ?? 'there'
    const tribe = profile?.tribe ? ` fellow ${profile.tribe}` : ''
    const highlight = breakdown.culture && breakdown.culture > 0.8 ? 'shared cultural rituals' : 'matching life rhythms'
    return `Hi ${name}${tribe}! Your concierge highlighted our ${highlight}—what does a perfect weekend look like for you?`
  }

  private static computeTrustBadges(profile?: ProfileDocument) {
    const badges: string[] = []
    if (!profile) return badges
    if (profile.verificationStatus?.selfie && profile.verificationStatus.id) {
      badges.push('Verified ID & Selfie')
    }
    if (profile.verificationStatus?.background) {
      badges.push('Guardian Approved')
    }
    if (profile.languages?.length && profile.languages.length > 2) {
      badges.push('Polyglot')
    }
    return badges
  }

  private static calculateAge(dob: Date) {
    const diff = Date.now() - dob.getTime()
    const ageDate = new Date(diff)
    return Math.abs(ageDate.getUTCFullYear() - 1970)
  }
}

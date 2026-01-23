type CompletionResult = {
  percent: number
  completedCount: number
  totalCount: number
}

const isNonEmpty = (value?: string | null) => Boolean(value && value.trim().length > 0)

export const computeProfileCompletion = (user: any | null): CompletionResult => {
  if (!user) {
    return { percent: 0, completedCount: 0, totalCount: 12 }
  }

  const checks: Array<boolean> = [
    // Photos
    Array.isArray(user.profilePhotos)
      ? user.profilePhotos.length > 0
      : Boolean(user.profilePhoto || user.photos?.length),
    // Location
    isNonEmpty(user.country) && isNonEmpty(user.city),
    // Tribe / heritage
    isNonEmpty(user.tribe) || isNonEmpty(user.heritage),
    // Education
    isNonEmpty(user.education),
    // Occupation
    isNonEmpty(user.occupation),
    // Faith / religion
    isNonEmpty(user.faith) || isNonEmpty(user.religion),
    // Interests (>=3)
    Array.isArray(user.interests) && user.interests.length >= 3,
    // Love language
    isNonEmpty(user.loveLanguage),
    // Bio
    isNonEmpty(user.bio),
    // Looking for / relationship goals
    isNonEmpty(user.lookingFor) || (Array.isArray(user.relationshipGoals) && user.relationshipGoals.length > 0),
    // ID verification
    isNonEmpty(user.idVerificationUrl) || isNonEmpty(user.verificationIdUrl),
    // Selfie verification
    isNonEmpty(user.selfiePhoto) || isNonEmpty(user.verificationSelfie),
  ]

  const totalCount = checks.length
  const completedCount = checks.filter(Boolean).length
  const percent = Math.round((completedCount / totalCount) * 100)

  return { percent, completedCount, totalCount }
}

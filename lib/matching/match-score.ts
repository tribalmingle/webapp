export type MatchBreakdownItem = {
  key: string;
  label: string;
  score: number;
};

export type MatchResult = {
  matchPercent: number;
  reasons: string[];
  breakdown: MatchBreakdownItem[];
  priority: number;
};

const normalize = (value?: string | null) => (value || '').trim().toLowerCase();

const getSharedInterests = (left?: string[], right?: string[]) => {
  const leftSet = new Set((left || []).map((item) => normalize(item)).filter(Boolean));
  const shared: string[] = [];
  (right || []).forEach((item) => {
    const normalized = normalize(item);
    if (normalized && leftSet.has(normalized)) {
      shared.push(item);
    }
  });
  return shared;
};

export const computeMatchScore = (currentUser: any | null, candidate: any): MatchResult => {
  const currentTribe = normalize(currentUser?.tribe);
  const currentCity = normalize(currentUser?.city);
  const currentCountry = normalize(currentUser?.country);
  const currentOrigin = normalize(currentUser?.heritage || currentUser?.countryOfOrigin);
  const currentFaith = normalize(currentUser?.faith || currentUser?.religion);
  const currentLookingFor = normalize(
    currentUser?.lookingFor || (Array.isArray(currentUser?.relationshipGoals) ? currentUser.relationshipGoals[0] : ''),
  );
  const currentLoveLanguage = normalize(currentUser?.loveLanguage);

  const candidateTribe = normalize(candidate?.tribe);
  const candidateCity = normalize(candidate?.city);
  const candidateCountry = normalize(candidate?.country);
  const candidateOrigin = normalize(candidate?.heritage || candidate?.countryOfOrigin);
  const candidateFaith = normalize(candidate?.faith || candidate?.religion);
  const candidateLookingFor = normalize(
    candidate?.lookingFor || (Array.isArray(candidate?.relationshipGoals) ? candidate.relationshipGoals[0] : ''),
  );
  const candidateLoveLanguage = normalize(candidate?.loveLanguage);

  const sameTribe = currentTribe && candidateTribe && currentTribe === candidateTribe;
  const sameCity = currentCity && candidateCity && currentCity === candidateCity;
  const sameCountry = currentCountry && candidateCountry && currentCountry === candidateCountry;
  const sameOrigin = currentOrigin && candidateOrigin && currentOrigin === candidateOrigin;
  const sameFaith = currentFaith && candidateFaith && currentFaith === candidateFaith;
  const sameLookingFor = currentLookingFor && candidateLookingFor && currentLookingFor === candidateLookingFor;
  const sameLoveLanguage = currentLoveLanguage && candidateLoveLanguage && currentLoveLanguage === candidateLoveLanguage;
  const sharedInterests = getSharedInterests(currentUser?.interests, candidate?.interests);
  const conflictingLookingFor =
    currentLookingFor && candidateLookingFor && currentLookingFor !== candidateLookingFor;
  const conflictingFaith = currentFaith && candidateFaith && currentFaith !== candidateFaith;

  let score = 58;
  const breakdown: MatchBreakdownItem[] = [];

  if (sameTribe) {
    score += 12;
    breakdown.push({ key: 'tribe', label: 'Same tribe', score: 12 });
  }
  if (sameCity) {
    score += 10;
    breakdown.push({ key: 'city', label: 'Same city', score: 10 });
  }
  if (sameCountry) {
    score += 6;
    breakdown.push({ key: 'country', label: 'Same country', score: 6 });
  }
  if (sameOrigin) {
    score += 6;
    breakdown.push({ key: 'origin', label: 'Same origin country', score: 6 });
  }
  if (sameFaith) {
    score += 6;
    breakdown.push({ key: 'faith', label: 'Same faith', score: 6 });
  }
  if (sameLookingFor) {
    score += 5;
    breakdown.push({ key: 'lookingFor', label: 'Aligned intentions', score: 5 });
  }
  if (sameLoveLanguage) {
    score += 5;
    breakdown.push({ key: 'loveLanguage', label: 'Same love language', score: 5 });
  }
  if (sharedInterests.length) {
    const interestScore = Math.min(sharedInterests.length, 4) * 3;
    score += interestScore;
    breakdown.push({ key: 'interests', label: 'Shared interests', score: interestScore });
  }
  if (conflictingLookingFor) {
    score -= 10;
    breakdown.push({ key: 'intent_mismatch', label: 'Different relationship intent', score: -10 });
  }
  if (conflictingFaith) {
    score -= 6;
    breakdown.push({ key: 'faith_mismatch', label: 'Different faith', score: -6 });
  }

  const geoAligned = sameTribe || sameCity || sameCountry || sameOrigin;
  const geoCap = geoAligned ? 99 : 88;

  const cappedScore = Math.max(52, Math.min(geoCap, Math.round(score)));

  const reasons: string[] = [];
  if (sameTribe && sameCity) {
    reasons.push(`Same tribe and city (${candidate?.tribe || 'Tribe'}, ${candidate?.city || 'City'})`);
  } else if (sameTribe) {
    reasons.push(`Same tribe (${candidate?.tribe || 'Tribe'})`);
  }
  if (sameCity && !(sameTribe && sameCity)) {
    reasons.push(`Same city (${candidate?.city || 'City'})`);
  }
  if (sameCountry) {
    reasons.push(`Same country (${candidate?.country || 'Country'})`);
  }
  if (sameOrigin) {
    reasons.push(`Same origin (${candidate?.heritage || candidate?.countryOfOrigin || 'Origin'})`);
  }
  if (sameFaith) {
    reasons.push(`Shared faith (${candidate?.faith || candidate?.religion || 'Faith'})`);
  }
  if (sharedInterests.length) {
    reasons.push(`Shared interests (${sharedInterests.slice(0, 3).join(', ')})`);
  }
  if (sameLookingFor) {
    reasons.push(`Aligned intentions (${candidate?.lookingFor || candidateLookingFor})`);
  }
  if (sameLoveLanguage) {
    reasons.push(`Love language match (${candidate?.loveLanguage || candidateLoveLanguage})`);
  }
  if (conflictingLookingFor) {
    reasons.push('Different relationship goals');
  }

  let priority = 4;
  if (sameTribe && sameCity) {
    priority = 0;
  } else if (sameTribe && (sameCountry || sameOrigin)) {
    priority = 1;
  } else if (sameCountry && sameCity) {
    priority = 2;
  } else if (sameCountry || sameOrigin) {
    priority = 3;
  }

  return {
    matchPercent: cappedScore,
    reasons: reasons.slice(0, 4),
    breakdown,
    priority,
  };
};

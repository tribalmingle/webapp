import { AFRICAN_COUNTRIES_WITH_TRIBES } from '@/lib/constants/profile-options'

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

const inferOriginFromTribe = (tribe?: string | null) => {
  const normalized = normalize(tribe)
  if (!normalized) return ''
  for (const [country, tribes] of Object.entries(AFRICAN_COUNTRIES_WITH_TRIBES)) {
    if (tribes.some((item) => normalize(item) === normalized)) {
      return country
    }
  }
  return ''
}

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
  const currentOrigin = normalize(
    currentUser?.heritage || currentUser?.countryOfOrigin || inferOriginFromTribe(currentUser?.tribe)
  );
  const currentFaith = normalize(currentUser?.faith || currentUser?.religion);
  const currentLookingFor = normalize(
    currentUser?.lookingFor || (Array.isArray(currentUser?.relationshipGoals) ? currentUser.relationshipGoals[0] : ''),
  );
  const currentLoveLanguage = normalize(currentUser?.loveLanguage);

  const candidateTribe = normalize(candidate?.tribe);
  const candidateCity = normalize(candidate?.city);
  const candidateCountry = normalize(candidate?.country);
  const candidateOrigin = normalize(
    candidate?.heritage || candidate?.countryOfOrigin || inferOriginFromTribe(candidate?.tribe)
  );
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

  const factors = {
    origin: Boolean(sameOrigin),
    tribe: Boolean(sameTribe),
    residenceCountry: Boolean(sameCountry),
    religion: Boolean(sameFaith),
    loveLanguage: Boolean(sameLoveLanguage),
    lookingFor: Boolean(sameLookingFor),
    sharedInterests: sharedInterests.length > 0,
  };

  const totalFactors = Object.keys(factors).length;
  const matchedCount = Object.values(factors).filter(Boolean).length;
  const matchPercent = Math.round((matchedCount / totalFactors) * 100);

  const breakdown: MatchBreakdownItem[] = [
    { key: 'origin', label: 'Same origin country', score: factors.origin ? 1 : 0 },
    { key: 'tribe', label: 'Same tribe', score: factors.tribe ? 1 : 0 },
    { key: 'residence_country', label: 'Same country of residence', score: factors.residenceCountry ? 1 : 0 },
    { key: 'religion', label: 'Same religion', score: factors.religion ? 1 : 0 },
    { key: 'love_language', label: 'Same love language', score: factors.loveLanguage ? 1 : 0 },
    { key: 'looking_for', label: 'Same relationship intent', score: factors.lookingFor ? 1 : 0 },
    { key: 'shared_interests', label: 'Shared interests', score: factors.sharedInterests ? 1 : 0 },
  ];

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
    reasons.push(`Same country of residence (${candidate?.country || 'Country'})`);
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
    matchPercent,
    reasons: reasons.slice(0, 4),
    breakdown,
    priority,
  };
};

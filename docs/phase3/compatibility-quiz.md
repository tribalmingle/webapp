# Compatibility Quiz V1

## Overview
- Six-step onboarding flow now dedicates step four to a slider-based compatibility quiz that captures alignment across family, faith, ambition, lifestyle, and community dimensions.
- Questions live in `lib/constants/compatibility-quiz.ts`; each uses a 1-5 scale with descriptive left/right rail labels so UI stays in sync with scoring logic.
- Results are saved to the applicant record (`onboarding_applicants.compatibilityDraft`) and mirrored back to the UI as personas, dimension percentages, and insight bullets.

## API
### `GET /api/onboarding/compatibility`
Returns quiz metadata so external clients can hydrate slider copy without importing front-end constants.

```json
{
  "questions": [{ "id": "family-traditions", "title": "..." }],
  "personas": [{ "id": "legacy_builder", "label": "Legacy Builder" }],
  "dimensions": [{ "key": "family", "label": "Family & Tradition" }]
}
```

### `POST /api/onboarding/compatibility`
Request body:
```json
{
  "applicantId": "optional-prospect-id",
  "email": "prospect@example.com",
  "answers": [{ "promptId": "family-traditions", "value": 4 }]
}
```
Response contains the persisted prospect id plus persona + dimension summaries:
```json
{
  "prospectId": "6564...",
  "overallScore": 82,
  "dimensionScores": [{ "dimension": "family", "label": "Family & Tradition", "score": 90 }],
  "personas": [{ "id": "legacy_builder", "score": 88 }],
  "insights": ["Legacy Builder: ..."]
}
```

## Service Logic
- Implemented in `lib/services/compatibility-quiz-service.ts`.
- Normalizes slider answers, computes per-dimension averages, infers persona tags via weighted blends, and stores the persona/value payload via `upsertCompatibilityDraft`.
- Resulting persona scores (0-100) are converted to 0-1 floats before being persisted so they match the applicant schema expectations.

## Front-End Integration
- `app/sign-up/page.tsx` introduces a compatibility step with slider cards, real-time value chips, and a summary tile once the save action succeeds.
- Prospect ID is preserved in `sessionStorage` (`onboardingProspectId`) so repeated visits keep tying into the same draft record.
- Moving past step four automatically re-saves the latest slider values to guarantee data consistency even if the user skips the explicit save button.

## Next Steps
- Gate the compatibility save action behind feature flags when LaunchDarkly rollout is ready.
- Extend the service to optionally emit analytics events (`trackOnboardingEvent`) once the instrumentation package is wired into the onboarding shell.

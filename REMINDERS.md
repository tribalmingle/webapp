# TribalMingle - Important Reminders

## Upcoming Reviews

### ⏰ February 20, 2026 - Tribe Map Activation Review

**Status:** Map currently disabled on landing page  
**Location:** `app/[locale]/page.tsx` (line ~199)  
**Action Required:** Review if we have enough member data to activate the interactive tribe map

**Context:**
- The tribe map shows geographic distribution of members across African tribes/regions
- Currently commented out until we have sufficient member data for meaningful visualization
- Map provides interactive experience showing where "trusted members on the ground" are located

**Steps to Re-enable:**
1. Uncomment the TribeMapSection component in `app/[locale]/page.tsx`
2. Verify tribe data in `lib/marketing/tribes.ts` is up to date
3. Ensure member distribution data is populated
4. Test map interaction on both desktop and mobile
5. Update analytics tracking if needed

**Code Location:**
```tsx
// Currently on line ~199 in app/[locale]/page.tsx
{/* TODO: REVIEW BY FEBRUARY 20, 2026 - Re-enable tribe map once we have enough members */}
{/* <TribeMapSection locale={locale} copy={dictionary.mapSection} /> */}
```

---

## Development Notes
- Map uses MapLibre GL for interactive visualization
- Automatically falls back to card list on mobile/touch devices
- Analytics track: hover, click, and list interactions
- Colors: Purple/violet fills, cyan hover, orange selection

export const BASE_FREE_LOOKUPS = 3;

// Bonus lookups (the tutorial's +1, the 100-karma milestone's +5) raise
// trial_lookups_limit past its base of 3. They're real for gating purposes,
// but showing them to the person makes "3/3" look like "4/4" or worse and
// makes a free bonus search look like it cost something. Every user-facing
// display of lookup usage should go through this instead of reading
// profile.trial_lookups_used/limit directly.
export function getDisplayLookupUsage(profile) {
  if (!profile) return { used: 0, limit: BASE_FREE_LOOKUPS };
  const bonusAmount = Math.max(0, profile.trial_lookups_limit - BASE_FREE_LOOKUPS);
  const used = Math.max(0, Math.min(BASE_FREE_LOOKUPS, profile.trial_lookups_used - bonusAmount));
  return { used, limit: BASE_FREE_LOOKUPS };
}

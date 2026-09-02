// A build's team slots come back from Supabase with flat foreign-key columns
// (pet_id, hat_id, scarf_id, accessory1_id, accessory2_id) rather than the
// nested shape the earlier mockup used — same logic, adapted to that shape.

export function buildPetIds(build) {
  return build.team.map((slot) => slot.pet_id);
}

export function buildItemCounts(build) {
  const counts = {};
  build.team.forEach((slot) => {
    // Only count item slots that are actually filled — a pet with no
    // scarf/accessory equipped has a null id there, and counting that
    // creates a phantom "null" item requirement nobody can ever own.
    [slot.hat_id, slot.scarf_id, slot.accessory1_id, slot.accessory2_id].forEach((itemId) => {
      if (!itemId) return;
      counts[itemId] = (counts[itemId] || 0) + 1;
    });
  });
  return counts;
}

export function buildFullyMatches(build, ownedPets, ownedItemCounts) {
  if (!build.team || build.team.length === 0) return false; // no structured data yet — can't match
  const petsOk = buildPetIds(build).every((pid) => ownedPets.includes(pid));
  if (!petsOk) return false;
  const counts = buildItemCounts(build);
  return Object.entries(counts).every(([itemId, needed]) => (ownedItemCounts[itemId] || 0) >= needed);
}

export function missingForBuild(build, ownedPets, ownedItemCounts) {
  const missingPets = buildPetIds(build).filter((pid) => !ownedPets.includes(pid));
  const counts = buildItemCounts(build);
  const missingItems = Object.entries(counts)
    .filter(([itemId, needed]) => (ownedItemCounts[itemId] || 0) < needed)
    .map(([itemId, needed]) => ({ itemId, needed, have: ownedItemCounts[itemId] || 0 }));
  return { missingPets, missingItems };
}

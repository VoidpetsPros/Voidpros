import React from "react";
import { Check } from "lucide-react";
import PetAvatar from "./PetAvatar";
import ItemAvatar from "./ItemAvatar";
import { useTheme } from "../hooks/ThemeContext";

const RARITY_ORDER = ["Common", "Rare", "Epic", "Uber", "Legendary"];
const ITEM_TYPE_LABELS = { hat: "Hats", scarf: "Scarves", accessory: "Accessories" };

// Splits a pool into "complete" groups (the requester owns every pet/item
// of that rarity+type that exists in the catalog — so any one of them
// works, no need to list each) and "partial" groups (they only have some,
// so those specific ones need to be shown).
function summarizePool(petIds, itemCounts, allPets, allItems) {
  const completeBadges = [];
  const partialGroups = [];

  RARITY_ORDER.forEach((rarity) => {
    const inCatalog = allPets.filter((p) => p.rarity === rarity);
    if (inCatalog.length === 0) return;
    const owned = petIds.filter((pid) => inCatalog.some((p) => p.id === pid));
    if (owned.length === 0) return;
    if (owned.length === inCatalog.length) {
      completeBadges.push(`All ${rarity} Pets`);
    } else {
      partialGroups.push({
        label: `${rarity} Pets`,
        chips: owned.map((pid) => {
          const p = allPets.find((x) => x.id === pid);
          return { key: pid, kind: "pet", data: p, name: p.name };
        }),
      });
    }
  });

  Object.keys(ITEM_TYPE_LABELS).forEach((type) => {
    RARITY_ORDER.forEach((rarity) => {
      const inCatalog = allItems.filter((i) => i.type === type && i.rarity === rarity);
      if (inCatalog.length === 0) return;
      const ownedIds = Object.keys(itemCounts).filter((iid) => inCatalog.some((i) => i.id === iid));
      if (ownedIds.length === 0) return;
      if (ownedIds.length === inCatalog.length) {
        completeBadges.push(`All ${rarity} ${ITEM_TYPE_LABELS[type]}`);
      } else {
        partialGroups.push({
          label: `${rarity} ${ITEM_TYPE_LABELS[type]}`,
          chips: ownedIds.map((iid) => {
            const it = allItems.find((x) => x.id === iid);
            return { key: iid, kind: "item", data: it, name: it.name, count: itemCounts[iid] };
          }),
        });
      }
    });
  });

  return { completeBadges, partialGroups };
}

export default function PoolSummary({ petIds, itemCounts, pets, items, chipSize = 20 }) {
  const { GOLD, VIOLET, MUTED, LINE } = useTheme();
  const { completeBadges, partialGroups } = summarizePool(petIds, itemCounts || {}, pets, items);

  return (
    <div>
      {partialGroups.map((group) => (
        <div key={group.label} style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6, margin: "0 0 5px" }}>{group.label}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {group.chips.map((chip) => (
              <span
                key={chip.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  padding: "3px 9px 3px 3px",
                  borderRadius: 16,
                  background: chip.kind === "pet" ? "rgba(139,92,246,0.1)" : "rgba(139,92,246,0.08)",
                  color: chip.kind === "pet" ? GOLD : VIOLET,
                  border: `1px solid ${chip.kind === "pet" ? "rgba(139,92,246,0.3)" : "rgba(139,92,246,0.25)"}`,
                }}
              >
                {chip.kind === "pet" ? <PetAvatar pet={chip.data} size={chipSize} /> : <ItemAvatar item={chip.data} size={chipSize} />}
                {chip.name} {chip.count > 1 ? `×${chip.count}` : ""}
              </span>
            ))}
          </div>
        </div>
      ))}

      {completeBadges.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {completeBadges.map((label) => (
            <span
              key={label}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "4px 10px", borderRadius: 16, background: "rgba(127,201,127,0.1)", color: "#7FC97F", border: "1px solid rgba(127,201,127,0.35)" }}
            >
              <Check size={12} /> {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

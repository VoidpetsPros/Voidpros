import React from "react";
import { Sparkles } from "lucide-react";
import PetAvatar from "./PetAvatar";
import ItemAvatar from "./ItemAvatar";
import { useTheme } from "../hooks/ThemeContext";

export default function SuggestedBuildCard({ suggestion, pets, items }) {
  const { PANEL, PANEL_2, CREAM, MUTED, VIOLET, GOLD } = useTheme();
  // items_included reflects what actually happened this call — false
  // either because the free monthly allowance ran out, or (rarely) simply
  // because no owned items matched anything in the data. free_items_remaining
  // is null for subscribers (no cap applies to them).
  const itemsCappedOut = suggestion.free_items_remaining !== null && suggestion.free_items_remaining !== undefined && !suggestion.items_included;

  if (suggestion.sample_size === 0) {
    return (
      <div style={{ background: PANEL, border: `1.5px dashed ${VIOLET}`, borderRadius: 12, padding: 18, marginTop: 10 }}>
        <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
          Nobody's submitted a verified build against this boss yet, so there's nothing to base a suggestion on.
        </p>
      </div>
    );
  }

  if (suggestion.pets.length === 0) {
    return (
      <div style={{ background: PANEL, border: `1.5px dashed ${VIOLET}`, borderRadius: 12, padding: 18, marginTop: 10 }}>
        <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
          Found {suggestion.sample_size} verified clear{suggestion.sample_size > 1 ? "s" : ""} of this boss, but none of
          your owned pets show up in any of them — nothing to suggest from your current collection yet.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: PANEL, border: `1.5px dashed ${VIOLET}`, borderRadius: 12, padding: 18, marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
        <Sparkles size={14} color={VIOLET} />
        <p style={{ fontSize: 13, fontWeight: 700, color: VIOLET, margin: 0 }}>Suggested Build (Beta)</p>
      </div>
      <p style={{ fontSize: 11.5, color: MUTED, margin: "0 0 10px" }}>
        Built from {suggestion.sample_size} verified clear{suggestion.sample_size > 1 ? "s" : ""} of this boss.
      </p>

      {suggestion.free_items_remaining !== null && suggestion.free_items_remaining !== undefined && (
        <p style={{ fontSize: 11.5, color: itemsCappedOut ? GOLD : MUTED, margin: "0 0 14px" }}>
          {suggestion.free_items_remaining}/5 Item Searches Left For Unpaid Users
        </p>
      )}

      {suggestion.pets.map((slot, i) => {
        const pet = pets.find((p) => p.id === slot.pet_id);
        const hat = items.find((it) => it.id === slot.hat_id);
        const scarf = items.find((it) => it.id === slot.scarf_id);
        const accessories = (slot.accessories || []).map((a) => ({ ...a, item: items.find((it) => it.id === a.item_id) }));

        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 108 }}>
              <PetAvatar pet={pet} size={28} />
              <span style={{ fontSize: 12.5, color: CREAM, fontWeight: 500 }}>{pet?.name || "Unknown"}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {hat && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, padding: "2px 8px 2px 2px", borderRadius: 16, background: PANEL_2, color: MUTED }}>
                  <ItemAvatar item={hat} size={18} /> {hat.name}
                </span>
              )}
              {scarf && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, padding: "2px 8px 2px 2px", borderRadius: 16, background: PANEL_2, color: MUTED }}>
                  <ItemAvatar item={scarf} size={18} /> {scarf.name}
                </span>
              )}
              {accessories.map((a, ai) =>
                a.item ? (
                  <span key={ai} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, padding: "2px 8px 2px 2px", borderRadius: 16, background: PANEL_2, color: MUTED }}>
                    <ItemAvatar item={a.item} size={18} /> {a.item.name}
                  </span>
                ) : null
              )}
              {!itemsCappedOut && !hat && !scarf && accessories.every((a) => !a.item) && (
                <span style={{ fontSize: 11.5, color: MUTED }}>No matching owned items found</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

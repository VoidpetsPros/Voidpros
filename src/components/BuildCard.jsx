import React from "react";
import { ShieldCheck, Check, ThumbsUp } from "lucide-react";
import PetAvatar from "./PetAvatar";
import ItemAvatar from "./ItemAvatar";
import CommentsSection from "./CommentsSection";
import { useAuth } from "../hooks/AuthContext";
import { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD, VIOLET, DANGER } from "../lib/theme";
import { missingForBuild } from "../lib/matching";

function Pill({ children, tone = "default" }) {
  const tones = {
    default: { bg: PANEL_2, fg: MUTED, bd: LINE },
    gold: { bg: "rgba(196,121,31,0.1)", fg: GOLD, bd: "rgba(196,121,31,0.3)" },
    violet: { bg: "rgba(108,86,201,0.1)", fg: VIOLET, bd: "rgba(108,86,201,0.3)" },
  };
  const t = tones[tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "4px 10px", borderRadius: 999, background: t.bg, color: t.fg, border: `1px solid ${t.bd}` }}>
      {children}
    </span>
  );
}

function LoadoutRow({ slot, pets, items, ownedPets, ownedItemCounts, usedSoFar }) {
  const pet = pets.find((p) => p.id === slot.pet_id);
  const hat = items.find((i) => i.id === slot.hat_id);
  const scarf = items.find((i) => i.id === slot.scarf_id);
  const accessories = [
    { id: slot.accessory1_id, level: slot.accessory1_level },
    { id: slot.accessory2_id, level: slot.accessory2_level },
  ].map((a) => ({ ...a, item: items.find((i) => i.id === a.id) }));
  const hasPet = pet ? ownedPets.includes(pet.id) : false;

  const chip = (item, itemId, level) => {
    if (!item) return null;
    usedSoFar[itemId] = (usedSoFar[itemId] || 0) + 1;
    const have = (ownedItemCounts[itemId] || 0) >= usedSoFar[itemId];
    return (
      <span
        key={itemId + usedSoFar[itemId]}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11.5,
          padding: "2px 8px 2px 2px",
          borderRadius: 16,
          background: have ? "rgba(196,121,31,0.08)" : PANEL_2,
          color: have ? GOLD : MUTED,
          border: `1px solid ${have ? "rgba(196,121,31,0.3)" : LINE}`,
        }}
      >
        <ItemAvatar item={item} size={18} />
        {item.name} <span style={{ opacity: 0.75 }}>Lv{level}</span>
      </span>
    );
  };

  if (!pet) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: hasPet ? "transparent" : "rgba(179,69,59,0.05)", marginBottom: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 108 }}>
        <PetAvatar pet={pet} size={28} />
        <span style={{ fontSize: 12.5, color: hasPet ? CREAM : DANGER, fontWeight: 500 }}>
          {pet.name} <span style={{ color: MUTED, fontWeight: 400 }}>Lv{slot.pet_level}</span>
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, flex: 1 }}>
        {chip(hat, slot.hat_id, slot.hat_level)}
        {chip(scarf, slot.scarf_id, slot.scarf_level)}
        {accessories.map((a) => chip(a.item, a.id, a.level))}
      </div>
    </div>
  );
}

export default function BuildCard({ build, pets, items, ownedPets, ownedItemCounts, fullMatch = true, onVote }) {
  const { user } = useAuth();
  const isOwnBuild = user && build.author_id === user.id;
  const { missingPets, missingItems } = missingForBuild(build, ownedPets, ownedItemCounts);
  const missingCount = missingPets.length + missingItems.length;
  const usedSoFar = {};
  const isVerified = build.status === "verified";

  return (
    <div
      style={{
        background: PANEL,
        border: `1px solid ${isVerified ? "rgba(196,121,31,0.4)" : LINE}`,
        borderRadius: 12,
        padding: 18,
        marginBottom: 14,
        boxShadow: isVerified ? "0 0 24px -10px rgba(196,121,31,0.35)" : "none",
        opacity: fullMatch ? 1 : 0.9,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {isVerified ? (
            <Pill tone="gold">
              <ShieldCheck size={12} /> Verified
            </Pill>
          ) : (
            <Pill>Unverified</Pill>
          )}
          {fullMatch ? (
            <Pill tone="violet">
              <Check size={12} /> Uses only what you have
            </Pill>
          ) : (
            <Pill>Missing {missingCount} thing{missingCount > 1 ? "s" : ""}</Pill>
          )}
        </div>
        <span style={{ fontSize: 12, color: MUTED }}>
          {build.show_author ? build.author?.username || "a player" : "Anonymous"}
        </span>
      </div>

      <div style={{ marginBottom: 12 }}>
        {build.team.map((slot) => (
          <LoadoutRow
            key={slot.id}
            slot={slot}
            pets={pets}
            items={items}
            ownedPets={ownedPets}
            ownedItemCounts={ownedItemCounts}
            usedSoFar={usedSoFar}
          />
        ))}
      </div>

      {build.note && <p style={{ fontSize: 13.5, color: CREAM, lineHeight: 1.6, margin: "0 0 12px" }}>{build.note}</p>}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {isOwnBuild ? <span style={{ fontSize: 12, color: MUTED }}>Your submission</span> : <span />}

        {isVerified && onVote && !isOwnBuild && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={() => onVote(build.id)}
              aria-label="Upvote this build"
              style={{
                background: build.userVote === "up" ? "rgba(139,92,246,0.12)" : "none",
                border: `1px solid ${build.userVote === "up" ? GOLD : LINE}`,
                color: build.userVote === "up" ? GOLD : MUTED,
                borderRadius: 7,
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ThumbsUp size={13} />
            </button>
            <span style={{ fontSize: 12.5, color: CREAM, minWidth: 20, textAlign: "center" }}>
              {build.upvotes}
            </span>
          </div>
        )}
      </div>

      <CommentsSection buildId={build.id} verified={isVerified} initialCount={build.comment_count || 0} />
    </div>
  );
}

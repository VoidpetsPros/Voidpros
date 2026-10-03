import React, { useState } from "react";
import { Check } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { useCollection } from "../hooks/useCollection";
import PetAvatar from "../components/PetAvatar";
import ItemAvatar from "../components/ItemAvatar";
import { useTheme } from "../hooks/ThemeContext";
import BackButton from "../components/BackButton";
import { RARITY_COLORS } from "../lib/theme";
import useIsMobile from "../hooks/useIsMobile";

const RARITY_ORDER = ["Common", "Rare", "Epic", "Legendary", "Uber"];

export default function Collection({ onRequireAuth }) {
  const { isAuthed, user } = useAuth();
  const { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD } = useTheme();
  const { pets, itemsByType, loading: catalogLoading } = useCatalog();
  const { ownedPets, ownedItems, loading: collectionLoading, togglePet, setItemCount, bulkSetPets, bulkSetItemCounts } = useCollection(user?.id);
  const [tab, setTab] = useState("pets");
  const isMobile = useIsMobile();

  if (catalogLoading || collectionLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Loading your collection…</p>
      </div>
    );
  }

  // Anonymous visitors can browse the whole catalog freely — signing in
  // is only required the moment they actually try to mark something as
  // owned, which is when it actually matters to have an account.
  const handlePetToggle = (petId) => {
    if (!isAuthed) {
      onRequireAuth();
      return;
    }
    togglePet(petId);
  };

  const handleItemToggle = (itemId) => {
    if (!isAuthed) {
      onRequireAuth();
      return;
    }
    setItemCount(itemId, ownedItems[itemId] > 0 ? 0 : 1);
  };

  const ownedCountFor = (id, isPetsTab) => (isPetsTab ? ownedPets.includes(id) : (ownedItems[id] || 0) > 0);

  const TABS = [
    { id: "pets", label: "Pets", list: pets },
    { id: "hat", label: "Hats", list: itemsByType.hat },
    { id: "scarf", label: "Scarves", list: itemsByType.scarf },
    { id: "accessory", label: "Accessories", list: itemsByType.accessory },
  ];

  const currentOptions = tab === "pets" ? pets : itemsByType[tab];
  const ownedCount = currentOptions.filter((o) => ownedCountFor(o.id, tab === "pets")).length;


  // Only show a "select all X" button for rarities that actually exist in
  // this tab's data — pets currently have no Common tier, for example, so
  // no empty/no-op button shows up for it.
  const rarityOptions = RARITY_ORDER.filter((r) => currentOptions.some((o) => o.rarity === r));

  const handleRarityToggle = (rarity) => {
    if (!isAuthed) {
      onRequireAuth();
      return;
    }
    const idsInRarity = currentOptions.filter((o) => o.rarity === rarity).map((o) => o.id);
    if (tab === "pets") {
      const allOwned = idsInRarity.every((id) => ownedPets.includes(id));
      bulkSetPets(idsInRarity, !allOwned);
    } else {
      const allOwned = idsInRarity.every((id) => (ownedItems[id] || 0) > 0);
      bulkSetItemCounts(idsInRarity, !allOwned);
    }
  };

  const isRarityFullyOwned = (rarity) => {
    const idsInRarity = currentOptions.filter((o) => o.rarity === rarity).map((o) => o.id);
    if (idsInRarity.length === 0) return false;
    return tab === "pets"
      ? idsInRarity.every((id) => ownedPets.includes(id))
      : idsInRarity.every((id) => (ownedItems[id] || 0) > 0);
  };

  return (
    <div style={{ padding: "24px 24px 80px", maxWidth: 680, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <BackButton style={{ marginBottom: 0 }} />
        <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 22, color: CREAM, margin: 0 }}>Collection</p>
      </div>

      <div style={{ display: "flex", gap: 4, background: PANEL_2, borderRadius: 10, padding: 4, marginBottom: 18, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              border: "none",
              background: tab === t.id ? PANEL : "transparent",
              color: tab === t.id ? CREAM : MUTED,
              fontSize: 12.5,
              fontWeight: tab === t.id ? 600 : 500,
              padding: "8px 13px",
              borderRadius: 8,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {t.label}
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: tab === t.id ? GOLD : MUTED,
                background: tab === t.id ? "rgba(124,58,237,0.1)" : "transparent",
                borderRadius: 999,
                padding: tab === t.id ? "1px 6px" : 0,
              }}
            >
              {t.list.filter((o) => ownedCountFor(o.id, t.id === "pets")).length}/{t.list.length}
            </span>
          </button>
        ))}
      </div>

      <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <p style={{ fontSize: 12.5, color: MUTED, margin: 0 }}>
            <span style={{ color: CREAM, fontWeight: 600 }}>{ownedCount}</span> of {currentOptions.length} owned
          </p>
          <div style={{ height: 5, width: 100, borderRadius: 999, background: PANEL_2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${currentOptions.length ? (ownedCount / currentOptions.length) * 100 : 0}%`, background: GOLD, borderRadius: 999 }} />
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {rarityOptions.map((rarity) => {
            const fullyOwned = isRarityFullyOwned(rarity);
            return (
              <button
                key={rarity}
                onClick={() => handleRarityToggle(rarity)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: `1px solid ${fullyOwned ? RARITY_COLORS[rarity] : LINE}`,
                  background: fullyOwned ? `${RARITY_COLORS[rarity]}22` : PANEL_2,
                  color: fullyOwned ? RARITY_COLORS[rarity] : MUTED,
                  cursor: "pointer",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: RARITY_COLORS[rarity], flexShrink: 0 }} />
                {fullyOwned ? <Check size={12} /> : null}
                {fullyOwned ? `All ${rarity}` : `Select all ${rarity}`}
              </button>
            );
          })}
        </div>


        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
          {tab === "pets"
            ? currentOptions.map((pet) => (
                <PetTile key={pet.id} pet={pet} owned={ownedPets.includes(pet.id)} onToggle={() => handlePetToggle(pet.id)} compact={isMobile} />
              ))
            : currentOptions.map((item) => (
                <ItemTile
                  key={item.id}
                  item={item}
                  owned={(ownedItems[item.id] || 0) > 0}
                  onToggle={() => handleItemToggle(item.id)}
                  compact={isMobile}
                />
              ))}
        </div>
      </div>
    </div>
  );
}

function PetTile({ pet, owned, onToggle, compact = false }) {
  const { PANEL, LINE, GOLD, CREAM } = useTheme();
  return (
    <button
      onClick={onToggle}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: compact ? 4 : 6,
        padding: compact ? "7px 3px" : "10px 6px",
        borderRadius: 12,
        border: `1.5px solid ${owned ? GOLD : LINE}`,
        background: PANEL,
        cursor: "pointer",
        position: "relative",
        transition: "border-color 0.15s ease",
      }}
    >
      {owned && (
        <div style={{ position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={10} color="#FFFFFF" strokeWidth={3} />
        </div>
      )}
      <PetAvatar pet={pet} size={compact ? 34 : 48} />
      <span style={{ fontSize: compact ? 10 : 11.5, color: CREAM, textAlign: "center", fontWeight: owned ? 600 : 400, lineHeight: 1.25 }}>{pet.name}</span>
    </button>
  );
}

function ItemTile({ item, owned, onToggle, compact = false }) {
  const { PANEL, LINE, GOLD, CREAM } = useTheme();
  return (
    <button
      onClick={onToggle}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: compact ? 4 : 6,
        padding: compact ? "7px 3px" : "10px 6px",
        borderRadius: 12,
        border: `1.5px solid ${owned ? GOLD : LINE}`,
        background: PANEL,
        cursor: "pointer",
        position: "relative",
        transition: "border-color 0.15s ease",
      }}
    >
      {owned && (
        <div style={{ position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={10} color="#FFFFFF" strokeWidth={3} />
        </div>
      )}
      <ItemAvatar item={item} size={compact ? 32 : 44} />
      <span style={{ fontSize: compact ? 10 : 11.5, color: CREAM, textAlign: "center", fontWeight: owned ? 600 : 400, lineHeight: 1.25 }}>{item.name}</span>
    </button>
  );
}

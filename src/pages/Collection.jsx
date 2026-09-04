import React, { useState, useEffect } from "react";
import { Search, Check } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { useCollection } from "../hooks/useCollection";
import PetAvatar from "../components/PetAvatar";
import ItemAvatar from "../components/ItemAvatar";
import { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD } from "../lib/theme";

const RARITY_ORDER = ["Common", "Rare", "Epic", "Legendary", "Uber"];
const RARITY_COLORS = {
  Common: "#7FC97F",
  Rare: "#6FA8DC",
  Epic: "#A98FE0",
  Legendary: "#E8B33D",
  Uber: "#D9534F",
};

export default function Collection({ onRequireAuth }) {
  const { isAuthed, user } = useAuth();
  const { pets, itemsByType, loading: catalogLoading } = useCatalog();
  const { ownedPets, ownedItems, loading: collectionLoading, togglePet, setItemCount, bulkSetPets, bulkSetItemCounts } = useCollection(user?.id);
  const [tab, setTab] = useState("pets");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isAuthed) onRequireAuth();
  }, [isAuthed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthed) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Sign in to manage your collection.</p>
      </div>
    );
  }

  if (catalogLoading || collectionLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Loading your collection…</p>
      </div>
    );
  }

  const ownedCountFor = (id, isPetsTab) => (isPetsTab ? ownedPets.includes(id) : (ownedItems[id] || 0) > 0);

  const TABS = [
    { id: "pets", label: "Pets", list: pets },
    { id: "hat", label: "Hats", list: itemsByType.hat },
    { id: "scarf", label: "Scarves", list: itemsByType.scarf },
    { id: "accessory", label: "Accessories", list: itemsByType.accessory },
  ];

  const currentOptions = tab === "pets" ? pets : itemsByType[tab];
  const filtered = currentOptions.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()));
  const ownedCount = currentOptions.filter((o) => ownedCountFor(o.id, tab === "pets")).length;

  const totalOwned = pets.filter((p) => ownedPets.includes(p.id)).length + Object.values(itemsByType).flat().filter((i) => (ownedItems[i.id] || 0) > 0).length;
  const totalAll = pets.length + Object.values(itemsByType).flat().length;

  // Only show a "select all X" button for rarities that actually exist in
  // this tab's data — pets currently have no Common tier, for example, so
  // no empty/no-op button shows up for it.
  const rarityOptions = RARITY_ORDER.filter((r) => currentOptions.some((o) => o.rarity === r));

  const handleRarityToggle = (rarity) => {
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
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 4, flexWrap: "wrap" }}>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 24, color: CREAM, margin: 0 }}>My collection</p>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: GOLD, margin: 0 }}>
            {totalOwned}
            <span style={{ fontSize: 13, fontWeight: 500, color: MUTED }}> / {totalAll} owned</span>
          </p>
        </div>
      </div>
      <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 20px", lineHeight: 1.6 }}>
        Changes save immediately — this is a real database now, not a browser tab.
        Refresh the page and your picks will still be here.
      </p>

      <div style={{ display: "flex", gap: 4, background: PANEL_2, borderRadius: 10, padding: 4, marginBottom: 18, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setQuery("");
            }}
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

      <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 14, padding: 18 }}>
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

        <div style={{ position: "relative", marginBottom: 16 }}>
          <Search size={15} color={MUTED} style={{ position: "absolute", left: 12, top: 11 }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: PANEL_2,
              border: `1px solid ${LINE}`,
              borderRadius: 9,
              padding: "10px 12px 10px 34px",
              color: CREAM,
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 10 }}>
          {tab === "pets"
            ? filtered.map((pet) => (
                <PetTile key={pet.id} pet={pet} owned={ownedPets.includes(pet.id)} onToggle={() => togglePet(pet.id)} />
              ))
            : filtered.map((item) => (
                <ItemTile
                  key={item.id}
                  item={item}
                  owned={(ownedItems[item.id] || 0) > 0}
                  onToggle={() => setItemCount(item.id, ownedItems[item.id] > 0 ? 0 : 1)}
                />
              ))}
          {filtered.length === 0 && <p style={{ color: MUTED, fontSize: 13 }}>No matches.</p>}
        </div>
      </div>
    </div>
  );
}

function PetTile({ pet, owned, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "10px 6px",
        borderRadius: 12,
        border: `1.5px solid ${owned ? GOLD : LINE}`,
        background: owned ? "rgba(139,92,246,0.08)" : PANEL,
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
      <PetAvatar pet={pet} size={48} />
      <span style={{ fontSize: 11.5, color: owned ? GOLD : CREAM, textAlign: "center", fontWeight: owned ? 600 : 400 }}>{pet.name}</span>
    </button>
  );
}

function ItemTile({ item, owned, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "10px 6px",
        borderRadius: 12,
        border: `1.5px solid ${owned ? GOLD : LINE}`,
        background: owned ? "rgba(139,92,246,0.08)" : PANEL,
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
      <ItemAvatar item={item} size={44} />
      <span style={{ fontSize: 11.5, color: owned ? GOLD : CREAM, textAlign: "center", fontWeight: owned ? 600 : 400 }}>{item.name}</span>
    </button>
  );
}

import React, { useState, useEffect } from "react";
import { Search, Check, Plus, Minus } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { useCollection } from "../hooks/useCollection";
import PetAvatar from "../components/PetAvatar";
import ItemAvatar from "../components/ItemAvatar";
import { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD } from "../lib/theme";

export default function Collection({ onRequireAuth }) {
  const { isAuthed, user } = useAuth();
  const { pets, itemsByType, loading: catalogLoading } = useCatalog();
  const { ownedPets, ownedItems, loading: collectionLoading, togglePet, setItemCount } = useCollection(user?.id);
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

  const TABS = [
    { id: "pets", label: "Pets" },
    { id: "hat", label: "Hats" },
    { id: "scarf", label: "Scarves" },
    { id: "accessory", label: "Accessories" },
  ];

  const currentOptions = tab === "pets" ? pets : itemsByType[tab];
  const filtered = currentOptions.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ padding: "24px 24px 80px", maxWidth: 640, margin: "0 auto" }}>
      <p style={{ fontFamily: "Georgia, serif", fontSize: 24, color: CREAM, margin: "0 0 4px" }}>
        My collection
      </p>
      <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 22px", lineHeight: 1.6 }}>
        Changes save immediately — this is a real database now, not a browser tab.
        Refresh the page and your picks will still be here.
      </p>

      <div style={{ display: "flex", gap: 4, background: PANEL_2, borderRadius: 8, padding: 3, marginBottom: 16, width: "fit-content" }}>
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
              padding: "6px 12px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
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
                count={ownedItems[item.id] || 0}
                onChange={(n) => setItemCount(item.id, n)}
              />
            ))}
        {filtered.length === 0 && <p style={{ color: MUTED, fontSize: 13 }}>No matches.</p>}
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
        border: `1px solid ${owned ? GOLD : LINE}`,
        background: owned ? "rgba(196,121,31,0.08)" : PANEL,
        cursor: "pointer",
        position: "relative",
      }}
    >
      {owned && (
        <div style={{ position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={10} color="#FFFFFF" strokeWidth={3} />
        </div>
      )}
      <PetAvatar pet={pet} size={48} />
      <span style={{ fontSize: 11.5, color: owned ? GOLD : CREAM, textAlign: "center" }}>{pet.name}</span>
    </button>
  );
}

function ItemTile({ item, count, onChange }) {
  const active = count > 0;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "10px 6px",
        borderRadius: 12,
        border: `1px solid ${active ? GOLD : LINE}`,
        background: active ? "rgba(196,121,31,0.08)" : PANEL,
      }}
    >
      <ItemAvatar item={item} size={44} />
      <span style={{ fontSize: 11.5, color: active ? GOLD : CREAM, textAlign: "center" }}>{item.name}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          onClick={() => onChange(Math.max(0, count - 1))}
          disabled={count === 0}
          style={{ width: 20, height: 20, borderRadius: 6, border: `1px solid ${LINE}`, background: PANEL_2, color: count === 0 ? MUTED : CREAM, display: "flex", alignItems: "center", justifyContent: "center", cursor: count === 0 ? "default" : "pointer", padding: 0 }}
        >
          <Minus size={11} />
        </button>
        <span style={{ fontSize: 12.5, color: CREAM, minWidth: 12, textAlign: "center" }}>{count}</span>
        <button
          onClick={() => onChange(count + 1)}
          style={{ width: 20, height: 20, borderRadius: 6, border: `1px solid ${LINE}`, background: PANEL_2, color: CREAM, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
        >
          <Plus size={11} />
        </button>
      </div>
    </div>
  );
}

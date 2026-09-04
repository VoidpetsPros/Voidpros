import React from "react";
import { useNavigate } from "react-router-dom";
import { Swords } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { useRequests } from "../hooks/useRequests";
import PetAvatar from "../components/PetAvatar";
import ItemAvatar from "../components/ItemAvatar";
import { PANEL, LINE, CREAM, MUTED, GOLD } from "../lib/theme";

export default function FulfillRequests() {
  const { user } = useAuth();
  const { pets, items, loading: catalogLoading } = useCatalog();
  const { requests, loading, error } = useRequests();
  const navigate = useNavigate();

  const openForOthers = requests.filter((r) => r.requester_id !== user?.id);

  if (catalogLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 24px 60px", maxWidth: 640, margin: "0 auto" }}>
      <p style={{ fontFamily: "Georgia, serif", fontSize: 24, color: CREAM, margin: "0 0 8px" }}>Challenges</p>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 999, padding: "4px 11px", marginBottom: 14 }}>
        <Swords size={12} color={GOLD} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: GOLD }}>Challenge · +10 karma when verified</span>
      </div>
      <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, margin: "0 0 24px" }}>
        Other players are stuck with a specific set of pets and items — sometimes not
        even enough for a full team. Use only what they have to earn the reward.
      </p>

      {error && (
        <div style={{ background: PANEL, border: "1px solid rgba(248,113,113,0.4)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 12.5, color: MUTED, fontFamily: "monospace", margin: 0 }}>{error}</p>
        </div>
      )}

      {loading ? (
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      ) : openForOthers.length === 0 ? (
        <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 13.5, color: MUTED, margin: 0 }}>No open challenges right now — check back soon.</p>
        </div>
      ) : (
        openForOthers.map((r) => (
          <div key={r.id} style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: 18, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 17, color: CREAM, margin: 0 }}>Floor {r.stage}</p>
              <span style={{ fontSize: 12, color: MUTED }}>
                requested by {r.show_requester ? r.requester?.username || "a player" : "Anonymous"}
              </span>
            </div>
            <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Must use only these
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {r.pets.map((pid) => {
                const p = pets.find((x) => x.id === pid);
                if (!p) return null;
                return (
                  <span key={pid} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, padding: "4px 10px 4px 4px", borderRadius: 20, background: "rgba(139,92,246,0.1)", color: GOLD, border: "1px solid rgba(139,92,246,0.3)" }}>
                    <PetAvatar pet={p} size={22} /> {p.name}
                  </span>
                );
              })}
              {Object.entries(r.items).map(([iid, count]) => {
                const it = items.find((x) => x.id === iid);
                if (!it) return null;
                return (
                  <span key={iid} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, padding: "4px 10px 4px 4px", borderRadius: 20, background: "rgba(139,92,246,0.08)", color: GOLD, border: "1px solid rgba(139,92,246,0.25)" }}>
                    <ItemAvatar item={it} size={22} /> {it.name} {count > 1 ? `×${count}` : ""}
                  </span>
                );
              })}
            </div>
            <button
              onClick={() => navigate(`/fulfill/${r.id}`)}
              style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Attempt this floor
            </button>
          </div>
        ))
      )}
    </div>
  );
}

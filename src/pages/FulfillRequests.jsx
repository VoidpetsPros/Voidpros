import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { useCollection } from "../hooks/useCollection";
import { useRequests } from "../hooks/useRequests";
import { useMyRequests, dismissRequest } from "../hooks/useMyRequests";
import BuildCard from "../components/BuildCard";
import PetAvatar from "../components/PetAvatar";
import ItemAvatar from "../components/ItemAvatar";
import { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD } from "../lib/theme";

const TABS = [
  { id: "fulfill", label: "Fulfill requests" },
  { id: "mine", label: "My requests" },
];

export default function FulfillRequests() {
  const { user } = useAuth();
  const { pets, items, loading: catalogLoading } = useCatalog();
  const { ownedPets, ownedItems } = useCollection(user?.id);
  const { requests, loading, error } = useRequests();
  const { requests: myRequests, loading: myLoading, refresh: refreshMine } = useMyRequests(user?.id);
  const navigate = useNavigate();
  const [tab, setTab] = useState("fulfill");
  const [dismissingId, setDismissingId] = useState(null);

  const openForOthers = requests.filter((r) => r.requester_id !== user?.id);

  const handleDismiss = async (requestId) => {
    setDismissingId(requestId);
    const { error: dismissError } = await dismissRequest(requestId);
    setDismissingId(null);
    if (dismissError) {
      alert(dismissError.message);
      return;
    }
    refreshMine();
  };

  if (catalogLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 24px 60px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 4, background: PANEL_2, borderRadius: 8, padding: 3, marginBottom: 22, width: "fit-content" }}>
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
              padding: "7px 14px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "fulfill" ? (
        <>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 24, color: CREAM, margin: "0 0 8px" }}>Fulfill requests</p>
          <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, margin: "0 0 24px" }}>
            Other players are stuck with a specific set of pets and items — sometimes not
            even enough for a full team. Use only what they have, and if your attempt gets
            verified you'll earn 10 karma.
          </p>

          {error && (
            <div style={{ background: PANEL, border: "1px solid rgba(179,69,59,0.4)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <p style={{ fontSize: 12.5, color: MUTED, fontFamily: "monospace", margin: 0 }}>{error}</p>
            </div>
          )}

          {loading ? (
            <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
          ) : openForOthers.length === 0 ? (
            <div style={{ background: PANEL, border: `1px dashed ${LINE}`, borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 13.5, color: MUTED, margin: 0 }}>No open requests right now — check back soon.</p>
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
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 12, flexWrap: "wrap" }}>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 24, color: CREAM, margin: 0 }}>My requests</p>
            <button
              onClick={() => navigate("/search")}
              style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Submit a request
            </button>
          </div>
          <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, margin: "0 0 24px" }}>
            Requests you've posted for other players to attempt. Once one's fulfilled,
            the build it produced still shows up in floor search either way — dismissing
            it here just clears it from this list.
          </p>

          {myLoading ? (
            <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
          ) : myRequests.length === 0 ? (
            <div style={{ background: PANEL, border: `1px dashed ${LINE}`, borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 13.5, color: MUTED, margin: 0 }}>You haven't submitted any requests yet.</p>
            </div>
          ) : (
            myRequests.map((r) =>
              r.fulfilled && r.resultingBuild ? (
                <div key={r.id} style={{ position: "relative", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <p style={{ fontSize: 12.5, color: MUTED, margin: 0 }}>Floor {r.stage} · fulfilled</p>
                    <button
                      onClick={() => handleDismiss(r.id)}
                      disabled={dismissingId === r.id}
                      aria-label="Dismiss this request"
                      title="Dismiss"
                      style={{ background: "none", border: `1px solid ${LINE}`, color: MUTED, borderRadius: 7, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: dismissingId === r.id ? "default" : "pointer" }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <BuildCard build={r.resultingBuild} pets={pets} items={items} ownedPets={ownedPets} ownedItemCounts={ownedItems} fullMatch={true} />
                </div>
              ) : (
                <div key={r.id} style={{ background: PANEL, border: `1px dashed ${LINE}`, borderRadius: 12, padding: "18px 20px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontFamily: "Georgia, serif", fontSize: 16, color: CREAM, margin: "0 0 4px" }}>Floor {r.stage}</p>
                    <p style={{ fontSize: 12.5, color: MUTED, margin: 0 }}>Waiting for someone to attempt this</p>
                  </div>
                </div>
              )
            )
          )}
        </>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Swords, Search, ChevronDown } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { useRequests } from "../hooks/useRequests";
import PoolSummary from "../components/PoolSummary";
import { useTheme } from "../hooks/ThemeContext";
import BackButton from "../components/BackButton";

export default function FulfillRequests() {
  const { user, markChallengesSeen } = useAuth();
  const { PANEL, LINE, CREAM, MUTED, GOLD } = useTheme();
  const { pets, items, loading: catalogLoading } = useCatalog();
  const { requests, loading, error } = useRequests();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState({});

  useEffect(() => {
    markChallengesSeen();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleExpanded = (id) => setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));

  const openForOthers = requests.filter((r) => r.requester_id !== user?.id);
  const filtered = query.trim()
    ? openForOthers.filter((r) => String(r.stage).includes(query.trim()))
    : openForOthers;

  if (catalogLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 24px 60px", maxWidth: 640, margin: "0 auto" }}>
      <BackButton />
      <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 24, color: CREAM, margin: "0 0 8px" }}>Challenges</p>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 999, padding: "4px 11px", marginBottom: 14 }}>
        <Swords size={12} color={GOLD} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: GOLD }}>Challenge · counts toward Leaderboards</span>
      </div>
      <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, margin: "0 0 18px" }}>
        Other players are stuck with a specific set of pets and items — sometimes not
        even enough for a full team. Use only what they have to earn the reward.
      </p>

      <div style={{ position: "relative", marginBottom: 22 }}>
        <Search size={15} color={MUTED} style={{ position: "absolute", left: 12, top: 12 }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="text"
          inputMode="numeric"
          placeholder="Search by floor number"
          style={{ width: "100%", boxSizing: "border-box", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 10, padding: "10px 12px 10px 36px", color: CREAM, fontSize: 14, outline: "none" }}
        />
      </div>

      {error && (
        <div style={{ background: PANEL, border: "1px solid rgba(248,113,113,0.4)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 12.5, color: MUTED, fontFamily: "monospace", margin: 0 }}>{error}</p>
        </div>
      )}

      {loading ? (
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      ) : openForOthers.length === 0 ? (
        <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 16, padding: "32px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 13.5, color: MUTED, margin: 0 }}>No open challenges right now — check back soon.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 16, padding: "32px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 13.5, color: MUTED, margin: 0 }}>No open challenges match floor "{query}".</p>
        </div>
      ) : (
        filtered.map((r) => {
          const expanded = !!expandedIds[r.id];
          return (
            <div key={r.id} style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <button
                  onClick={() => toggleExpanded(r.id)}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, flex: 1, minWidth: 0, textAlign: "left" }}
                >
                  <ChevronDown size={16} color={MUTED} style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
                  <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 16, color: CREAM, margin: 0 }}>Floor {r.stage}</p>
                </button>
                <button
                  onClick={() => navigate(`/fulfill/${r.id}`)}
                  style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}
                >
                  Attempt this floor
                </button>
              </div>

              {expanded && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${LINE}` }}>
                  <p style={{ fontSize: 12, color: MUTED, margin: "0 0 12px" }}>
                    requested by {r.show_requester ? r.requester?.username || "a player" : "Anonymous"}
                  </p>
                  <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                    Must use only these
                  </p>
                  <PoolSummary petIds={r.pets} itemCounts={r.items} pets={pets} items={items} chipSize={22} />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

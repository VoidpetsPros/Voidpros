import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, Award } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { useCollection } from "../hooks/useCollection";
import { useMyRequests, dismissRequest } from "../hooks/useMyRequests";
import BuildCard from "../components/BuildCard";
import { PANEL, LINE, CREAM, MUTED, GOLD } from "../lib/theme";

export default function MyRequests({ onRequireAuth }) {
  const { isAuthed, user, profile, loading: authLoading } = useAuth();
  const { pets, items, loading: catalogLoading } = useCatalog();
  const { ownedPets, ownedItems } = useCollection(user?.id);
  const { requests: myRequests, loading: myLoading, refresh: refreshMine } = useMyRequests(user?.id);
  const navigate = useNavigate();
  const [dismissingId, setDismissingId] = useState(null);

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

  if (!isAuthed) {
    onRequireAuth();
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Sign in to view your requests.</p>
      </div>
    );
  }

  if (authLoading || catalogLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  if (!profile?.is_subscribed) {
    return (
      <div style={{ padding: "40px 24px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: "32px 24px" }}>
          <Award size={22} color={GOLD} style={{ marginBottom: 10 }} />
          <p style={{ fontFamily: "Georgia, serif", fontSize: 19, color: CREAM, margin: "0 0 8px" }}>Subscriber feature</p>
          <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 18px", lineHeight: 1.6 }}>
            Posting a request for other players to solve — and tracking it here — is part
            of the paid tier.
          </p>
          <Link
            to="/search"
            style={{ display: "inline-block", background: GOLD, color: "#FFFFFF", borderRadius: 9, padding: "10px 20px", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}
          >
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 24px 60px", maxWidth: 640, margin: "0 auto" }}>
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
        <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
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
            <div key={r.id} style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 12, padding: "18px 20px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontFamily: "Georgia, serif", fontSize: 16, color: CREAM, margin: "0 0 4px" }}>Floor {r.stage}</p>
                <p style={{ fontSize: 12.5, color: MUTED, margin: 0 }}>Waiting for someone to attempt this</p>
              </div>
            </div>
          )
        )
      )}
    </div>
  );
}

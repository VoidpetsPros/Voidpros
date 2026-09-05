import React, { useState } from "react";
import { Link } from "react-router-dom";
import { X, Award, Send, Clock } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { useCollection } from "../hooks/useCollection";
import { useMyRequests, dismissRequest } from "../hooks/useMyRequests";
import { supabase } from "../lib/supabaseClient";
import BuildCard from "../components/BuildCard";
import { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD, DANGER } from "../lib/theme";

export default function MyRequests({ onRequireAuth }) {
  const { isAuthed, user, profile, loading: authLoading } = useAuth();
  const { pets, items, loading: catalogLoading } = useCatalog();
  const { ownedPets, ownedItems } = useCollection(user?.id);
  const { requests: myRequests, loading: myLoading, refresh: refreshMine } = useMyRequests(user?.id);
  const [dismissingId, setDismissingId] = useState(null);

  const [stageInput, setStageInput] = useState("");
  const [showRequester, setShowRequester] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

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

  const handleCreateRequest = async () => {
    setFormError("");
    const stage = parseInt(stageInput, 10);
    if (!stage || stage < 1) {
      setFormError("Enter a valid floor number.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("create_request", { p_stage: stage, p_show_requester: showRequester });
    setSubmitting(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    setStageInput("");
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
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, padding: "32px 24px" }}>
          <Award size={22} color={GOLD} style={{ marginBottom: 10 }} />
          <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 19, color: CREAM, margin: "0 0 8px" }}>Subscriber feature</p>
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
      <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 24, color: CREAM, margin: "0 0 8px" }}>My requests</p>
      <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, margin: "0 0 20px" }}>
        Post the floor you're stuck on — other players attempt it using only your pets
        and items. Once fulfilled, the build still shows up in floor search either
        way; dismissing it here just clears it from this list.
      </p>

      <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 14, padding: 18, marginBottom: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
          <Send size={13} color={GOLD} />
          <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>New request</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={stageInput}
            onChange={(e) => {
              setStageInput(e.target.value);
              if (formError) setFormError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleCreateRequest()}
            placeholder="Floor number"
            style={{ flex: "1 1 160px", background: PANEL_2, border: `1px solid ${LINE}`, borderRadius: 9, padding: "10px 12px", color: CREAM, fontSize: 14, outline: "none" }}
          />
          <button
            onClick={handleCreateRequest}
            disabled={submitting}
            style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 9, padding: "10px 20px", fontSize: 13.5, fontWeight: 600, cursor: submitting ? "default" : "pointer" }}
          >
            {submitting ? "Posting…" : "Request"}
          </button>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={showRequester} onChange={(e) => setShowRequester(e.target.checked)} style={{ width: 14, height: 14 }} />
          <span style={{ fontSize: 12, color: MUTED }}>Show my username {showRequester ? "" : "(posting anonymously)"}</span>
        </label>
        {formError && <p style={{ fontSize: 12.5, color: DANGER, margin: "10px 0 0" }}>{formError}</p>}
      </div>

      {myLoading ? (
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      ) : myRequests.length === 0 ? (
        <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 16, padding: "32px 24px", textAlign: "center" }}>
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
            <div key={r.id} style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 16, padding: "18px 20px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 16, color: CREAM, margin: "0 0 4px" }}>Floor {r.stage}</p>
                <p style={{ fontSize: 12.5, color: MUTED, margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
                  <Clock size={12} /> Waiting for someone to attempt this
                </p>
              </div>
            </div>
          )
        )
      )}
    </div>
  );
}

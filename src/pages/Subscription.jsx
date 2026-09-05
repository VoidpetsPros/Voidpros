import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { startCheckout, startTrialCheckout } from "../lib/billing";
import { getDisplayLookupUsage } from "../lib/lookups";
import { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD, DANGER } from "../lib/theme";

const FREE_PERKS = ["3 free floor searches", "Submit Completions & Challenges for karma"];
const UNLIMITED_PERKS = [
  "Unlimited floor searches — no daily cap",
  "Post a custom build request for other players to solve using your exact pool",
  "Full activity history — everything you've submitted, plus votes and comments on it",
  "Everything in Free",
];

export default function Subscription({ onRequireAuth }) {
  const { isAuthed, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const eligible = !profile?.trial_used;
  const { used, limit } = getDisplayLookupUsage(profile);

  const handleUpgrade = async () => {
    if (!isAuthed) {
      onRequireAuth();
      return;
    }
    setError("");
    setLoading(true);
    try {
      await (eligible ? startTrialCheckout() : startCheckout());
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px 24px 80px", maxWidth: 720, margin: "0 auto" }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: "none", border: "none", color: MUTED, fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: 0, marginBottom: 20 }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <h1 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 26, color: CREAM, textAlign: "center", margin: "0 0 8px" }}>
        Choose your plan
      </h1>
      <p style={{ fontSize: 13.5, color: MUTED, textAlign: "center", margin: "0 0 32px" }}>
        {profile?.is_subscribed ? "You're currently on Unlimited." : "See what you get now, and what Unlimited adds."}
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "stretch" }}>
        {/* Free */}
        <div style={{ flex: "1 1 280px", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 13, color: MUTED, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", margin: "0 0 8px" }}>Free</p>
          <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 28, color: CREAM, margin: "0 0 4px" }}>$0</p>
          <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 20px" }}>
            {profile ? `${limit - used} of ${limit} searches left` : "per month"}
          </p>

          <button
            disabled
            style={{ width: "100%", background: PANEL_2, color: MUTED, border: `1px solid ${LINE}`, borderRadius: 9, padding: "11px 0", fontSize: 13.5, fontWeight: 600, marginBottom: 22, cursor: "default" }}
          >
            {profile?.is_subscribed ? "Included" : "Current plan"}
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FREE_PERKS.map((perk) => (
              <div key={perk} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                <Check size={15} color={MUTED} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: CREAM, lineHeight: 1.5 }}>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Unlimited */}
        <div style={{ flex: "1 1 280px", background: "rgba(124,58,237,0.08)", border: `1.5px solid ${GOLD}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 13, color: GOLD, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", margin: "0 0 8px" }}>Unlimited</p>
          <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 28, color: CREAM, margin: "0 0 4px" }}>
            {eligible ? "7 days free" : "$4.99"}
            {!eligible && <span style={{ fontSize: 15, fontWeight: 500, color: MUTED }}> /mo</span>}
          </p>
          <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 20px" }}>
            {eligible ? "then $4.99/month. Cancel anytime." : "Cancel anytime."}
          </p>

          {profile?.is_subscribed ? (
            <button
              disabled
              style={{ width: "100%", background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 9, padding: "11px 0", fontSize: 13.5, fontWeight: 600, marginBottom: 22, cursor: "default" }}
            >
              Current plan
            </button>
          ) : (
            <>
              <button
                onClick={handleUpgrade}
                disabled={loading}
                style={{ width: "100%", background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 9, padding: "11px 0", fontSize: 13.5, fontWeight: 600, cursor: loading ? "default" : "pointer" }}
              >
                {loading ? "Redirecting…" : eligible ? "Start Free Trial" : "Subscribe"}
              </button>
              <p style={{ fontSize: 11, color: MUTED, margin: "8px 0 20px", textAlign: "center" }}>
                {eligible ? "Card required. Cancel before day 7 and you won't be charged." : "Billed monthly."}
              </p>
              {error && <p style={{ fontSize: 12, color: DANGER, margin: "0 0 12px", textAlign: "center" }}>{error}</p>}
            </>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {UNLIMITED_PERKS.map((perk) => (
              <div key={perk} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                <Check size={15} color={GOLD} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: CREAM, lineHeight: 1.5 }}>{perk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { startCheckout, startTrialCheckout } from "../lib/billing";
import { useTheme } from "../hooks/ThemeContext";
import BackButton from "../components/BackButton";
import useIsMobile from "../hooks/useIsMobile";

const FREE_PERKS = [
  "See which pets a build uses",
  "Submit Completions & Challenges, ranked on the Leaderboards",
  "Community — see everything you've submitted or commented on",
];
const UNLIMITED_PERKS = [
  "See every item and level a build uses, not just the pets",
  "See exactly what you're missing on every build — not just an incomplete pets-only guess",
  "Alternative builds sorted by closest match, so the easiest one to finish shows first",
  "Unlimited Suggested Builds with item recommendations",
  "Post a custom build request for other players to solve using your exact pool",
  "Priority review — your Completions and Challenges get reviewed first",
  "Everything in Free",
];

export default function Subscription({ onRequireAuth }) {
  const { isAuthed, profile } = useAuth();
  const { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD, DANGER } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isMobile = useIsMobile();
  const [billingPeriod, setBillingPeriod] = useState("yearly");

  const eligible = !profile?.trial_used;

  const handleUpgrade = async () => {
    if (!isAuthed) {
      onRequireAuth();
      return;
    }
    setError("");
    setLoading(true);
    try {
      await (eligible ? startTrialCheckout(billingPeriod) : startCheckout(billingPeriod));
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px 24px 80px", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <BackButton style={{ marginBottom: 0 }} />
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 22, color: CREAM, margin: 0 }}>
          Choose your plan
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, alignItems: "stretch" }}>
        {/* Free — shown second on mobile, so Unlimited leads */}
        <div style={{ order: isMobile ? 2 : 1, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 13, color: MUTED, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", margin: "0 0 8px" }}>Free</p>
          <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 28, color: CREAM, margin: "0 0 4px" }}>$0</p>
          <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 20px" }}>
            Pets only — items stay hidden
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

        {/* Unlimited — shown first on mobile */}
        <div style={{ order: isMobile ? 1 : 2, background: "rgba(124,58,237,0.08)", border: `1.5px solid ${GOLD}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
            <p style={{ fontSize: 13, color: GOLD, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", margin: 0 }}>Unlimited</p>
            <div style={{ display: "flex", background: PANEL_2, borderRadius: 999, padding: 3 }}>
              {[
                { id: "yearly", label: "Yearly" },
                { id: "monthly", label: "Monthly" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setBillingPeriod(p.id)}
                  style={{
                    border: "none",
                    background: billingPeriod === p.id ? GOLD : "transparent",
                    color: billingPeriod === p.id ? "#FFFFFF" : MUTED,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "5px 11px",
                    borderRadius: 999,
                    cursor: "pointer",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {billingPeriod === "yearly" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 12, color: MUTED, textDecoration: "line-through" }}>$72</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,0.12)", borderRadius: 999, padding: "2px 8px" }}>
                32% off
              </span>
            </div>
          )}
          <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 28, color: CREAM, margin: "0 0 4px" }}>
            {eligible ? "7 days free" : billingPeriod === "yearly" ? "$49.00" : "$6.00"}
            {!eligible && <span style={{ fontSize: 15, fontWeight: 500, color: MUTED }}> {billingPeriod === "yearly" ? "/yr" : "/mo"}</span>}
          </p>
          <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 20px" }}>
            {eligible
              ? billingPeriod === "yearly"
                ? "then $49.00/year, billed annually. Cancel anytime."
                : "then $6.00/month. Cancel anytime."
              : billingPeriod === "yearly"
              ? "Billed annually. Cancel anytime."
              : "Cancel anytime."}
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
                {eligible ? "Card required. Cancel before day 7 and you won't be charged." : billingPeriod === "yearly" ? "Billed annually." : "Billed monthly."}
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

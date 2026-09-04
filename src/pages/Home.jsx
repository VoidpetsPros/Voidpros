import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { startCheckout } from "../lib/billing";
import { GOLD, MUTED, CREAM, PANEL, LINE } from "../lib/theme";

const UNLIMITED_PERKS = [
  "Unlimited floor searches — no daily cap",
  "Post a custom build request for other players to solve using your exact pool",
  "Full activity history — everything you've submitted, plus votes and comments on it",
];

export default function Home({ onRequireAuth }) {
  const { isAuthed, profile } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleStart = () => {
    if (!isAuthed) {
      onRequireAuth();
      return;
    }
    navigate("/search");
  };

  const handleSubscribe = async () => {
    setCheckoutLoading(true);
    try {
      await startCheckout();
    } catch (err) {
      alert(err.message || "Something went wrong starting checkout.");
      setCheckoutLoading(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <div style={{ padding: "56px 28px 48px", maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 32, lineHeight: 1.25, letterSpacing: -0.4, color: CREAM, margin: "0 0 14px" }}>
          Find a build for your floor
        </h1>
        <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.6, margin: "0 0 28px" }}>
          Search a floor and see which builds only use pets and items you actually own.
        </p>

        {!isAuthed && (
          <p style={{ color: MUTED, fontSize: 13, margin: "0 0 22px" }}>
            Sign in to start — pets and items you own, saved for real this time.
          </p>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={() => (isAuthed ? navigate("/collection") : onRequireAuth())}
            style={{
              background: PANEL,
              color: CREAM,
              border: `1px solid ${LINE}`,
              borderRadius: 10,
              padding: "13px 26px",
              fontSize: 14.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Collection
          </button>
          <button
            onClick={handleStart}
            style={{
              background: GOLD,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              padding: "13px 26px",
              fontSize: 14.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Builds
          </button>
        </div>
      </div>

      {/* What's included with Unlimited */}
      {!profile?.is_subscribed && (
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 28px 64px" }}>
          <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 12, padding: "26px 24px" }}>
            <p style={{ fontSize: 11, color: GOLD, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", margin: "0 0 8px" }}>
              Unlimited
            </p>
            <h2 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 19, color: CREAM, margin: "0 0 4px" }}>
              $4.99 / month
            </h2>
            <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 18px" }}>Cancel anytime.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {UNLIMITED_PERKS.map((perk) => (
                <div key={perk} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                  <CheckCircle2 size={15} color={GOLD} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: CREAM, lineHeight: 1.5 }}>{perk}</span>
                </div>
              ))}
            </div>

            {isAuthed ? (
              <button
                onClick={handleSubscribe}
                disabled={checkoutLoading}
                style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 9, padding: "11px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer", width: "100%" }}
              >
                {checkoutLoading ? "Redirecting…" : "Subscribe"}
              </button>
            ) : (
              <p style={{ fontSize: 12.5, color: MUTED, margin: 0 }}>Sign in to subscribe.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

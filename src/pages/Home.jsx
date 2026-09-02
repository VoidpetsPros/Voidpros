import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Sparkles, Award, Search, Users, CheckCircle2 } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { startCheckout } from "../lib/billing";
import { GOLD, GOLD_DIM, MUTED, CREAM, VIOLET, PANEL, PANEL_2, LINE } from "../lib/theme";

const STEPS = [
  { icon: Users, title: "Add what you own", body: "Mark the pets and items in your collection — just a couple taps, no typing." },
  { icon: Search, title: "Search a floor", body: "Tell us which floor is giving you trouble." },
  { icon: CheckCircle2, title: "Get a real answer", body: "See builds the community has verified, filtered to what you can actually make." },
];

const UNLIMITED_PERKS = [
  "Unlimited floor searches — no daily cap",
  "Post a custom build request for other players to solve using your exact pool",
  "Full My Activity history — everything you've submitted, plus votes and comments on it",
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
      <div style={{ padding: "56px 28px 44px", maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: GOLD, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>
          stuck in the void?
        </p>
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 36, lineHeight: 1.2, letterSpacing: -0.5, color: CREAM, margin: "0 0 16px" }}>
          Tell us your team. We'll find what beats the floor.
        </h1>
        <p style={{ color: MUTED, fontSize: 15.5, lineHeight: 1.6, margin: "0 0 28px" }}>
          Search a floor and see which builds only use pets and items you actually own.
        </p>

        {!isAuthed && (
          <p style={{ color: MUTED, fontSize: 13, marginBottom: 20 }}>
            Sign in to start building your collection — pets and items you own,
            saved for real this time.
          </p>
        )}
        {isAuthed && (
          <p style={{ color: MUTED, fontSize: 13, marginBottom: 20 }}>
            Signed in as {profile?.username || "player"}. Try adding a few pets and items to your collection.
          </p>
        )}

        {isAuthed && !profile?.is_subscribed && (
          <button
            onClick={handleSubscribe}
            disabled={checkoutLoading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(139,92,246,0.12)",
              border: `1px solid ${GOLD}`,
              borderRadius: 999,
              padding: "8px 16px",
              fontSize: 13,
              color: VIOLET,
              cursor: "pointer",
              marginBottom: 20,
            }}
          >
            <Award size={13} /> {checkoutLoading ? "Redirecting…" : "Get unlimited — $4.99/month"}
          </button>
        )}

        <div>
          <button
            onClick={handleStart}
            style={{
              background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              padding: "14px 28px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Sparkles size={15} /> Find my solution <ChevronRight size={16} />
          </button>
        </div>

        {isAuthed && (
          <p style={{ marginTop: 16 }}>
            <button
              onClick={() => navigate("/collection")}
              style={{ background: "none", border: "none", color: MUTED, fontSize: 12.5, cursor: "pointer", textDecoration: "underline", padding: 0 }}
            >
              Or manage your collection first
            </button>
          </p>
        )}
      </div>

      {/* How it works */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "8px 28px 56px" }}>
        <h2 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: MUTED, textAlign: "center", margin: "0 0 24px" }}>
          How it works
        </h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                style={{
                  flex: "1 1 220px",
                  maxWidth: 260,
                  background: PANEL,
                  border: `1px solid ${LINE}`,
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: PANEL_2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Icon size={16} color={GOLD} />
                </div>
                <p style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: 0.5, margin: "0 0 4px" }}>
                  STEP {i + 1}
                </p>
                <p style={{ fontSize: 14.5, fontWeight: 600, color: CREAM, margin: "0 0 6px" }}>{step.title}</p>
                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, margin: 0 }}>{step.body}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* What's included with Unlimited */}
      {!profile?.is_subscribed && (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 28px 64px" }}>
          <div
            style={{
              background: PANEL,
              border: `1px solid ${GOLD}`,
              borderRadius: 16,
              padding: "28px 26px",
              textAlign: "center",
            }}
          >
            <Award size={22} color={GOLD} style={{ marginBottom: 10 }} />
            <h2 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 20, color: CREAM, margin: "0 0 4px" }}>
              Voidpros Unlimited
            </h2>
            <p style={{ fontSize: 13, color: MUTED, margin: "0 0 20px" }}>$4.99 / month · cancel anytime</p>

            <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
              {UNLIMITED_PERKS.map((perk) => (
                <div key={perk} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <CheckCircle2 size={16} color={GOLD} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13.5, color: CREAM, lineHeight: 1.5 }}>{perk}</span>
                </div>
              ))}
            </div>

            {isAuthed ? (
              <button
                onClick={handleSubscribe}
                disabled={checkoutLoading}
                style={{
                  background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 24px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                {checkoutLoading ? "Redirecting…" : "Get Unlimited"}
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

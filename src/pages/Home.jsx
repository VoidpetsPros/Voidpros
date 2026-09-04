import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Layers, Search, ArrowRight, Trophy, Swords } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { startCheckout } from "../lib/billing";
import { GOLD, MUTED, CREAM, PANEL, LINE } from "../lib/theme";

const UNLIMITED_PERKS = [
  "Unlimited floor searches — no daily cap",
  "Post a custom build request for other players to solve using your exact pool",
  "Full activity history — everything you've submitted, plus votes and comments on it",
];

const KARMA_WAYS = [
  {
    icon: Trophy,
    title: "Completions",
    body: "Submit the team you used to beat any floor.",
    reward: "+5 karma",
    to: "/submit",
  },
  {
    icon: Swords,
    title: "Challenges",
    body: "Beat a floor using a limited pet & item pool.",
    reward: "+10 karma",
    to: "/fulfill",
  },
];

export default function Home({ onRequireAuth }) {
  const { isAuthed, profile } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const goCollection = () => (isAuthed ? navigate("/collection") : onRequireAuth());
  const goSearch = () => (isAuthed ? navigate("/search") : onRequireAuth());

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
      <div style={{ padding: "48px 28px 8px", maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 32, lineHeight: 1.25, letterSpacing: -0.4, color: CREAM, margin: "0 0 14px" }}>
          Find a build for your floor
        </h1>
        <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.6, margin: "0 0 8px" }}>
          Search a floor and see which builds only use pets and items you actually own.
        </p>
        {!isAuthed && (
          <p style={{ color: MUTED, fontSize: 13, margin: "0 0 8px" }}>
            Sign in to start — pets and items you own, saved for real this time.
          </p>
        )}
      </div>

      {/* Two-step guide: this is the actual point of the page — get your
          collection set up, then search. The buttons live right inside the
          steps that explain them. */}
      <div style={{ maxWidth: 720, margin: "32px auto 0", padding: "0 24px", display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 14, padding: 22, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: 999, background: GOLD, color: "#FFFFFF", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              1
            </div>
            <Layers size={17} color={GOLD} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: CREAM, margin: "0 0 6px" }}>Build your collection</p>
          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, margin: "0 0 18px" }}>
            Mark every pet and item you actually own. This is what makes search results
            real instead of a wishlist.
          </p>
          <button
            onClick={goCollection}
            style={{ width: "100%", background: PANEL, color: CREAM, border: `1.5px solid ${GOLD}`, borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Go to Collection
          </button>
        </div>

        <div style={{ flex: "1 1 260px", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 14, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: 999, background: GOLD, color: "#FFFFFF", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              2
            </div>
            <Search size={17} color={GOLD} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: CREAM, margin: "0 0 6px" }}>Search a floor</p>
          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, margin: "0 0 18px" }}>
            Tell us which floor is giving you trouble — we'll only show builds you can
            actually make with what you own.
          </p>
          <button
            onClick={goSearch}
            style={{ width: "100%", background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Go to Floor Search
          </button>
        </div>
      </div>

      {/* Ways to earn karma — ties directly into the new Submissions menu */}
      {isAuthed && (
        <div style={{ maxWidth: 720, margin: "36px auto 0", padding: "0 24px" }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: MUTED, textAlign: "center", margin: "0 0 14px" }}>
            Earn karma
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {KARMA_WAYS.map((k) => {
              const Icon = k.icon;
              return (
                <Link
                  key={k.title}
                  to={k.to}
                  style={{
                    flex: "1 1 220px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "rgba(124,58,237,0.06)",
                    border: "1px solid rgba(124,58,237,0.25)",
                    borderRadius: 12,
                    padding: 16,
                    textDecoration: "none",
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(124,58,237,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={17} color={GOLD} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: CREAM, margin: "0 0 2px" }}>{k.title}</p>
                    <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.4 }}>{k.body}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: GOLD, whiteSpace: "nowrap" }}>{k.reward}</span>
                    <ArrowRight size={13} color={GOLD} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* What's included with Unlimited */}
      {!profile?.is_subscribed && (
        <div style={{ maxWidth: 520, margin: "36px auto 0", padding: "0 24px 64px" }}>
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
      {profile?.is_subscribed && <div style={{ paddingBottom: 48 }} />}
    </div>
  );
}

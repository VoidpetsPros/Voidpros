import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { useTheme } from "../hooks/ThemeContext";
import { supabase } from "../lib/supabaseClient";
import { startCreditCheckout } from "../lib/billing";
import BackButton from "../components/BackButton";

const BUNDLES = [
  { id: "item_search", label: "25 Item Search Credits", price: "$5" },
  { id: "request", label: "25 Request Credits", price: "$5" },
  { id: "suggested_build", label: "25 Suggested Build Credits", price: "$5" },
  { id: "all", label: "25 of Every Credit Type", price: "$10" },
];

export default function Credits({ onRequireAuth }) {
  const { isAuthed, profile } = useAuth();
  const { PANEL, LINE, CREAM, MUTED, GOLD } = useTheme();
  const [myCredits, setMyCredits] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [processingPurchase, setProcessingPurchase] = useState(false);
  const [buyingBundle, setBuyingBundle] = useState(null);
  const [buyError, setBuyError] = useState("");

  const fetchCredits = () => supabase.rpc("get_my_credits").then(({ data, error }) => (!error ? setMyCredits(data) : null));

  useEffect(() => {
    if (!isAuthed) return;
    fetchCredits();
  }, [isAuthed]);

  // Just back from a successful credit-bundle purchase — the webhook that
  // actually credits the balance runs asynchronously, so poll briefly
  // rather than assume it's already reflected.
  useEffect(() => {
    if (!isAuthed || searchParams.get("purchased") !== "1") return;
    setProcessingPurchase(true);
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      await fetchCredits();
      if (attempts >= 6) {
        clearInterval(interval);
        setProcessingPurchase(false);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("purchased");
          return next;
        });
      }
    }, 1500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  if (!isAuthed) {
    onRequireAuth();
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Sign in to view your credits.</p>
      </div>
    );
  }

  const handleBuy = async (bundleId) => {
    setBuyingBundle(bundleId);
    setBuyError("");
    try {
      await startCreditCheckout(bundleId);
    } catch (err) {
      setBuyError(err.message || "Couldn't start checkout");
      setBuyingBundle(null);
    }
  };

  const rows = [
    { label: "Item Search Credits", value: myCredits?.item_search_credits },
    { label: "Request Credits", value: myCredits?.request_credits },
    { label: "Suggested Build Credits", value: myCredits?.suggested_build_credits },
  ];

  return (
    <div style={{ padding: "24px 24px 60px", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <BackButton style={{ marginBottom: 0 }} />
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 22, color: CREAM, margin: 0 }}>
          Credits
        </h1>
      </div>

      {processingPurchase && (
        <p style={{ fontSize: 12.5, color: GOLD, margin: "0 0 14px" }}>Finishing up your purchase…</p>
      )}

      <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: "4px 18px", marginBottom: 24 }}>
        {rows.map((r, i) => (
          <div
            key={r.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "16px 0",
              borderBottom: i < rows.length - 1 ? `1px solid ${LINE}` : "none",
            }}
          >
            <span style={{ fontSize: 14, color: CREAM, fontWeight: 600 }}>{r.label}</span>
            <span style={{ fontSize: 15, color: profile?.is_subscribed ? GOLD : CREAM, fontWeight: 700 }}>
              {profile?.is_subscribed ? "Unlimited" : r.value ?? 0}
            </span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: MUTED, margin: "0 0 10px" }}>
        Buy more credits
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {BUNDLES.map((b) => (
          <div
            key={b.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              background: PANEL,
              border: `1px solid ${LINE}`,
              borderRadius: 10,
              padding: "12px 16px",
            }}
          >
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: CREAM, margin: "0 0 2px" }}>{b.label}</p>
              <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{b.price}</p>
            </div>
            <button
              onClick={() => handleBuy(b.id)}
              disabled={buyingBundle === b.id}
              style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 12.5, fontWeight: 600, cursor: buyingBundle === b.id ? "default" : "pointer", flexShrink: 0 }}
            >
              {buyingBundle === b.id ? "Redirecting…" : "Buy"}
            </button>
          </div>
        ))}
      </div>
      {buyError && <p style={{ fontSize: 12, color: "#F87171", margin: "10px 0 0" }}>{buyError}</p>}
    </div>
  );
}

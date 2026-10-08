import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Check } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useTheme } from "../hooks/ThemeContext";
import { supabase } from "../lib/supabaseClient";
import { startCreditCheckout } from "../lib/billing";
import BackButton from "../components/BackButton";
import useIsMobile from "../hooks/useIsMobile";

const PACKAGES = [
  {
    id: "all",
    name: "Pro",
    price: "$9.99",
    includes: ["25 Item Search Credits", "25 Request Credits", "25 Suggested Build Credits"],
  },
  {
    id: "item_search",
    name: "Explorer",
    price: "$4.99",
    includes: ["25 Item Search Credits"],
  },
  {
    id: "suggested_build",
    name: "Wizard",
    price: "$4.99",
    includes: ["25 Suggested Build Credits"],
  },
  {
    id: "request",
    name: "Support",
    price: "$4.99",
    includes: ["25 Request Credits"],
  },
];

export default function Credits({ onRequireAuth }) {
  const { isAuthed, profile } = useAuth();
  const { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD } = useTheme();
  const isMobile = useIsMobile();
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

  const handleClaim = async (bundleId) => {
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
    <div style={{ padding: "24px 24px 80px", maxWidth: 820, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <BackButton style={{ marginBottom: 0 }} />
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 22, color: CREAM, margin: 0 }}>
          Credits
        </h1>
      </div>

      {processingPurchase && (
        <p style={{ fontSize: 12.5, color: GOLD, margin: "0 0 14px" }}>Finishing up your purchase…</p>
      )}

      <div style={{ marginBottom: 10 }}>
        {rows.map((r) => (
          <div
            key={r.label}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              padding: "6px 0",
            }}
          >
            <span style={{ fontSize: 14, color: CREAM, fontWeight: 600 }}>{r.label}:</span>
            <span style={{ fontSize: 15, color: profile?.is_subscribed ? GOLD : CREAM, fontWeight: 700 }}>
              {profile?.is_subscribed ? "Unlimited" : r.value ?? 0}
            </span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: MUTED, margin: "0 0 28px" }}>
        Each credit type is topped up to at least 3 every month — nothing above 3 is ever reduced.
      </p>

      <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: MUTED, margin: "0 0 12px" }}>
        Credit Packages
      </p>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              background: pkg.id === "all" ? "rgba(124,58,237,0.08)" : PANEL,
              border: `1.5px solid ${pkg.id === "all" ? GOLD : LINE}`,
              borderRadius: 14,
              padding: 16,
              marginTop: pkg.id === "all" ? 12 : 0,
            }}
          >
            {pkg.id === "all" && (
              <span
                style={{
                  position: "absolute",
                  top: -12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: GOLD,
                  color: "#FFFFFF",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                }}
              >
                Most Popular
              </span>
            )}
            <p style={{ fontSize: 12.5, color: pkg.id === "all" ? GOLD : MUTED, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", margin: "0 0 6px" }}>
              {pkg.name}
            </p>
            <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 22, color: CREAM, margin: "0 0 12px" }}>
              {pkg.price}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14, flex: 1 }}>
              {pkg.includes.map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <Check size={13} color={pkg.id === "all" ? GOLD : MUTED} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 11.5, color: CREAM, lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleClaim(pkg.id)}
              disabled={buyingBundle === pkg.id}
              style={{
                width: "100%",
                background: pkg.id === "all" ? GOLD : PANEL_2,
                color: pkg.id === "all" ? "#FFFFFF" : CREAM,
                border: pkg.id === "all" ? "none" : `1px solid ${LINE}`,
                borderRadius: 8,
                padding: "9px 0",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: buyingBundle === pkg.id ? "default" : "pointer",
              }}
            >
              {buyingBundle === pkg.id ? "…" : "Claim"}
            </button>
          </div>
        ))}
      </div>
      {buyError && <p style={{ fontSize: 12, color: "#F87171", margin: "12px 0 0" }}>{buyError}</p>}
    </div>
  );
}

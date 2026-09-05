import React, { useState } from "react";
import { useAuth } from "../hooks/AuthContext";
import { startCheckout, startTrialCheckout } from "../lib/billing";
import { GOLD, MUTED, DANGER } from "../lib/theme";

export default function TrialCTA({ style, fullWidth = false }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const eligible = !profile?.trial_used;

  const handleClick = async () => {
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
    <div style={{ width: fullWidth ? "100%" : "auto" }}>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          display: "inline-block",
          background: GOLD,
          color: "#FFFFFF",
          border: "none",
          borderRadius: 9,
          padding: "10px 20px",
          fontSize: 13.5,
          fontWeight: 600,
          cursor: loading ? "default" : "pointer",
          width: fullWidth ? "100%" : "auto",
          ...style,
        }}
      >
        {loading ? "Redirecting…" : eligible ? "Start 7-day free trial" : "Subscribe — $4.99/mo"}
      </button>
      {eligible && (
        <p style={{ fontSize: 11, color: MUTED, margin: "8px 0 0", textAlign: "center" }}>
          Card required. Cancel before day 7 and you won't be charged.
        </p>
      )}
      {error && <p style={{ fontSize: 12, color: DANGER, margin: "8px 0 0", textAlign: "center" }}>{error}</p>}
    </div>
  );
}

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { GOLD, MUTED } from "../lib/theme";

// This button never talks to Stripe directly — it just sends the person to
// the Subscription page, which is the one place that actually starts
// checkout. Keeps every upgrade prompt in the app pointed at one funnel.
export default function TrialCTA({ style, fullWidth = false }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const eligible = !profile?.trial_used;

  return (
    <div style={{ width: fullWidth ? "100%" : "auto" }}>
      <button
        onClick={() => navigate("/subscribe")}
        style={{
          display: "inline-block",
          background: GOLD,
          color: "#FFFFFF",
          border: "none",
          borderRadius: 9,
          padding: "10px 20px",
          fontSize: 13.5,
          fontWeight: 600,
          cursor: "pointer",
          width: fullWidth ? "100%" : "auto",
          ...style,
        }}
      >
        {eligible ? "Start 7-day free trial" : "Subscribe — $4.99/mo"}
      </button>
      {eligible && (
        <p style={{ fontSize: 11, color: MUTED, margin: "8px 0 0", textAlign: "center" }}>
          Card required. Cancel before day 7 and you won't be charged.
        </p>
      )}
    </div>
  );
}

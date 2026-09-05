import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../hooks/ThemeContext";

export default function BillingCancelled() {
  const { PANEL, LINE, CREAM, MUTED, GOLD } = useTheme();
  return (
    <div style={{ padding: "60px 24px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: "32px 24px" }}>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 20, color: CREAM, margin: "0 0 8px" }}>No charge made</p>
        <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 20px", lineHeight: 1.6 }}>
          Checkout was cancelled — nothing was charged.
        </p>
        <Link to="/" style={{ display: "inline-block", background: GOLD, color: "#FFFFFF", borderRadius: 9, padding: "10px 20px", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}>
          Back to voidpros
        </Link>
      </div>
    </div>
  );
}

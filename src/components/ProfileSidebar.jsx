import React from "react";
import { useNavigate } from "react-router-dom";
import { X, Users, CreditCard, LogOut } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { openBillingPortal } from "../lib/billing";
import { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD } from "../lib/theme";

export default function ProfileSidebar({ onClose }) {
  const { profile, signOut, hasNewActivity, markActivitySeen } = useAuth();
  const navigate = useNavigate();
  const [portalLoading, setPortalLoading] = React.useState(false);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      await openBillingPortal();
    } catch (err) {
      alert(err.message || "Couldn't open billing portal");
      setPortalLoading(false);
    }
  };

  const goToCommunity = () => {
    markActivitySeen();
    navigate("/my-activity");
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    navigate("/");
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60, display: "flex", justifyContent: "flex-end" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 300,
          maxWidth: "85vw",
          height: "100%",
          background: PANEL,
          borderLeft: `1px solid ${LINE}`,
          padding: 22,
          boxShadow: "-8px 0 30px -10px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", color: MUTED, margin: 0 }}>Profile</p>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 20, color: CREAM, margin: "0 0 8px" }}>
          {profile?.username || "player"}
        </p>
        <span
          style={{
            display: "inline-block",
            fontSize: 11.5,
            fontWeight: 600,
            color: profile?.is_subscribed ? GOLD : MUTED,
            background: profile?.is_subscribed ? "rgba(124,58,237,0.1)" : PANEL_2,
            border: `1px solid ${profile?.is_subscribed ? "rgba(124,58,237,0.3)" : LINE}`,
            borderRadius: 999,
            padding: "4px 10px",
            marginBottom: 24,
          }}
        >
          {profile?.is_subscribed ? "Unlimited" : "Free"}
        </span>

        <button
          onClick={goToCommunity}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: PANEL_2,
            border: `1px solid ${LINE}`,
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 13.5,
            fontWeight: 600,
            color: CREAM,
            cursor: "pointer",
            marginBottom: 10,
            textAlign: "left",
          }}
        >
          <Users size={16} color={GOLD} />
          Community
          {hasNewActivity && (
            <span
              style={{
                position: "absolute",
                top: 8,
                right: 10,
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: "#dc2626",
                border: `2px solid ${PANEL_2}`,
              }}
            />
          )}
        </button>

        {profile?.is_subscribed && (
          <button
            onClick={handleManageBilling}
            disabled={portalLoading}
            style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", fontSize: 13.5, color: CREAM, cursor: "pointer", marginBottom: 10, textAlign: "left" }}
          >
            <CreditCard size={16} color={MUTED} />
            {portalLoading ? "Opening…" : "Manage billing"}
          </button>
        )}

        <button
          onClick={handleSignOut}
          style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", fontSize: 13.5, color: CREAM, cursor: "pointer", marginTop: "auto", textAlign: "left" }}
        >
          <LogOut size={16} color={MUTED} />
          Sign out
        </button>
      </div>
    </div>
  );
}

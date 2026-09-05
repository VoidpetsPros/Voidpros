import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Users, CreditCard, LogOut, ShieldCheck, Search } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { openBillingPortal } from "../lib/billing";
import { getDisplayLookupUsage } from "../lib/lookups";
import { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD, DANGER } from "../lib/theme";

export default function ProfileSidebar({ onClose }) {
  const { profile, signOut, hasNewActivity, markActivitySeen } = useAuth();
  const navigate = useNavigate();
  const [portalLoading, setPortalLoading] = React.useState(false);

  // Lock the page underneath while this panel is open — otherwise the
  // background page is still scrollable behind the fixed overlay, so
  // scroll/click input can land on the wrong layer.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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

  const goToAdmin = () => {
    navigate("/admin");
    onClose();
  };

  const goToSubscribe = () => {
    navigate("/subscribe");
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
          height: "100vh",
          background: PANEL,
          borderLeft: `1px solid ${LINE}`,
          boxShadow: "-8px 0 30px -10px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        {/* Scrollable content — everything except Sign out, which stays
            pinned below regardless of how tall this section gets. minHeight:0
            is required here or this flex child won't scroll at all. */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", color: MUTED, margin: 0 }}>Profile</p>
            <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          {!profile?.is_subscribed && (
            <div style={{ background: PANEL_2, border: `1px solid ${LINE}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Search size={15} color={MUTED} />
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: CREAM }}>Free Searches</span>
                </div>
                <button
                  onClick={goToSubscribe}
                  style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  Upgrade
                </button>
              </div>
              {(() => {
                const { used, limit } = getDisplayLookupUsage(profile);
                return (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                      <span style={{ fontSize: 12.5, color: MUTED }}>Total</span>
                      <span style={{ fontSize: 12.5, color: CREAM, fontWeight: 600 }}>{limit} searches</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                      <span style={{ fontSize: 12.5, color: MUTED }}>Remaining</span>
                      <span style={{ fontSize: 12.5, color: CREAM, fontWeight: 600 }}>{limit - used}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <div style={{ background: PANEL_2, border: `1px solid ${LINE}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 18, color: CREAM, margin: "0 0 3px" }}>
              {profile?.username || "player"}
            </p>
            <p style={{ fontSize: 12.5, color: profile?.is_subscribed ? GOLD : MUTED, fontWeight: 600, margin: 0 }}>
              {profile?.is_subscribed ? "Unlimited plan" : "Free plan"}
            </p>
          </div>

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
              width: "100%",
              boxSizing: "border-box",
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
              style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", fontSize: 13.5, color: CREAM, cursor: "pointer", textAlign: "left", width: "100%", boxSizing: "border-box", marginBottom: profile?.is_admin ? 10 : 0 }}
            >
              <CreditCard size={16} color={MUTED} />
              {portalLoading ? "Opening…" : "Manage billing"}
            </button>
          )}

          {profile?.is_admin && (
            <button
              onClick={goToAdmin}
              style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: `1px solid ${DANGER}`, borderRadius: 10, padding: "12px 14px", fontSize: 13.5, color: DANGER, cursor: "pointer", textAlign: "left", width: "100%", boxSizing: "border-box" }}
            >
              <ShieldCheck size={16} color={DANGER} />
              Admin tools
            </button>
          )}
        </div>

        {/* Fixed footer — always visible at the bottom of the panel,
            never part of the scrolling area above. */}
        <div style={{ borderTop: `1px solid ${LINE}`, padding: 22 }}>
          <button
            onClick={handleSignOut}
            style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", fontSize: 13.5, color: CREAM, cursor: "pointer", width: "100%", boxSizing: "border-box", textAlign: "left" }}
          >
            <LogOut size={16} color={MUTED} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

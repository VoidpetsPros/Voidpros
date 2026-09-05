import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Users, LogOut, ShieldCheck, Search, Settings as SettingsIcon, CreditCard, FileText, Shield, Sun, Moon, Check } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useTheme } from "../hooks/ThemeContext";
import { getDisplayLookupUsage } from "../lib/lookups";

function ThemePopup({ onClose }) {
  const { mode, setMode, PANEL, LINE, CREAM, MUTED, GOLD } = useTheme();

  const options = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
  ];

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, padding: 22, width: 280, maxWidth: "100%", boxShadow: "0 20px 50px -12px rgba(0,0,0,0.4)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: CREAM, margin: 0 }}>Theme</p>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 4 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {options.map((opt) => {
            const Icon = opt.icon;
            const active = mode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setMode(opt.id);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: active ? "rgba(124,58,237,0.08)" : "none",
                  border: `1.5px solid ${active ? GOLD : LINE}`,
                  borderRadius: 10,
                  padding: "11px 14px",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: CREAM,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <Icon size={16} color={active ? GOLD : MUTED} />
                {opt.label}
                {active && <Check size={14} color={GOLD} style={{ marginLeft: "auto" }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ProfileSidebar({ onClose }) {
  const { profile, signOut, hasNewActivity, markActivitySeen } = useAuth();
  const { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD, DANGER } = useTheme();
  const navigate = useNavigate();
  const [showTheme, setShowTheme] = useState(false);

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

  const goToSettings = () => {
    navigate("/settings");
    onClose();
  };

  const goToPrivacy = () => {
    navigate("/privacy");
    onClose();
  };

  const goToTerms = () => {
    navigate("/terms");
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    navigate("/");
  };

  const navButtonStyle = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "none",
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
  };

  return (
    <>
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

            <button onClick={goToCommunity} style={navButtonStyle}>
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

            <button onClick={goToSubscribe} style={navButtonStyle}>
              <CreditCard size={16} color={GOLD} />
              Subscription
            </button>

            <button onClick={goToSettings} style={navButtonStyle}>
              <SettingsIcon size={16} color={MUTED} />
              Settings
            </button>

            <button onClick={() => setShowTheme(true)} style={navButtonStyle}>
              <Sun size={16} color={MUTED} />
              Theme
            </button>

            <button onClick={goToPrivacy} style={navButtonStyle}>
              <Shield size={16} color={MUTED} />
              Privacy Policy
            </button>

            <button onClick={goToTerms} style={navButtonStyle}>
              <FileText size={16} color={MUTED} />
              Terms of Service
            </button>

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
      {showTheme && <ThemePopup onClose={() => setShowTheme(false)} />}
    </>
  );
}

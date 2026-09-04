import React, { useState } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import logoMark from "./assets/logo.svg";
import { useAuth } from "./hooks/AuthContext";
import AuthModal from "./components/AuthModal";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import Search from "./pages/Search";
import Results from "./pages/Results";
import Submit from "./pages/Submit";
import Admin from "./pages/Admin";
import FulfillRequests from "./pages/FulfillRequests";
import FulfillAttempt from "./pages/FulfillAttempt";
import MyActivity from "./pages/MyActivity";
import BillingSuccess from "./pages/BillingSuccess";
import BillingCancelled from "./pages/BillingCancelled";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import { openBillingPortal } from "./lib/billing";
import { INK, PANEL, LINE, CREAM, MUTED, GOLD, DANGER } from "./lib/theme";

const NAV_LINKS = [
  { to: "/search", label: "Find a build" },
  { to: "/submit", label: "Submit a build" },
  { to: "/fulfill", label: "Fulfill requests" },
  { to: "/my-activity", label: "My activity" },
];

// Plain, calm background — no glow orbs, no grid overlay. A dark theme
// should read as a clean tool, not a Web3 landing page.
const VOID_BACKGROUND = {
  backgroundColor: INK,
};

export default function App() {
  const { isAuthed, profile, signOut, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      await openBillingPortal();
    } catch (err) {
      alert(err.message || "Couldn't open billing portal");
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ ...VOID_BACKGROUND, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ ...VOID_BACKGROUND, minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          padding: "14px 24px",
          background: GOLD,
          boxShadow: "0 1px 0 rgba(0,0,0,0.08)",
          flexWrap: "wrap",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
          <img src={logoMark} alt="Voidpros" style={{ width: 32, height: 32, borderRadius: 8, display: "block" }} />
          <span style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: -0.3, color: "#FFFFFF" }}>
            voidpros
          </span>
        </Link>

        {isAuthed && (
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.22)",
              borderRadius: 10,
              padding: 4,
              flexWrap: "wrap",
            }}
          >
            {NAV_LINKS.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    fontSize: 12.5,
                    fontWeight: active ? 600 : 500,
                    color: active ? GOLD : "rgba(255,255,255,0.85)",
                    background: active ? "#FFFFFF" : "transparent",
                    textDecoration: "none",
                    padding: "7px 12px",
                    borderRadius: 7,
                    whiteSpace: "nowrap",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
            {profile?.is_admin && (
              <Link
                to="/admin"
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: location.pathname === "/admin" ? DANGER : "rgba(255,255,255,0.85)",
                  background: location.pathname === "/admin" ? "#FFFFFF" : "transparent",
                  textDecoration: "none",
                  padding: "7px 12px",
                  borderRadius: 7,
                  whiteSpace: "nowrap",
                }}
              >
                Admin
              </Link>
            )}
          </nav>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
          {isAuthed ? (
            <>
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.85)",
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  borderRadius: 999,
                  padding: "6px 12px",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: "#FFFFFF", fontWeight: 600 }}>{profile?.username || "player"}</span>
                {" · "}
                {profile?.karma ?? 0} karma
                {" · "}
                {profile?.is_subscribed ? (
                  <span style={{ color: "#FFFFFF", fontWeight: 600 }}>unlimited lookups</span>
                ) : (
                  `${profile ? profile.trial_lookups_limit - profile.trial_lookups_used : 0} lookups left`
                )}
              </span>
              {profile?.is_subscribed && (
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  style={{ background: "none", border: "1px solid rgba(255,255,255,0.35)", color: "#FFFFFF", fontSize: 12.5, padding: "7px 12px", borderRadius: 8, cursor: "pointer" }}
                >
                  {portalLoading ? "Opening…" : "Manage billing"}
                </button>
              )}
              <button
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
                style={{ background: "none", border: "1px solid rgba(255,255,255,0.35)", color: "#FFFFFF", fontSize: 12.5, padding: "7px 12px", borderRadius: 8, cursor: "pointer" }}
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              style={{ background: "#FFFFFF", border: "none", color: GOLD, fontWeight: 600, fontSize: 12.5, padding: "9px 16px", borderRadius: 8, cursor: "pointer" }}
            >
              Sign in / create account
            </button>
          )}
        </div>
      </header>

      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/collection" element={<Collection onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/search" element={<Search />} />
          <Route path="/results/:stage" element={<Results onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/submit" element={<Submit onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/fulfill" element={<FulfillRequests />} />
          <Route path="/fulfill/:requestId" element={<FulfillAttempt onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/my-activity" element={<MyActivity onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/billing/success" element={<BillingSuccess />} />
          <Route path="/billing/cancelled" element={<BillingCancelled />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
        </Routes>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <footer style={{ borderTop: `1px solid ${LINE}`, background: PANEL, padding: "20px 24px", textAlign: "center" }}>
        <Link to="/privacy" style={{ fontSize: 12, color: MUTED, textDecoration: "none", marginRight: 16 }}>
          Privacy Policy
        </Link>
        <Link to="/terms" style={{ fontSize: 12, color: MUTED, textDecoration: "none" }}>
          Terms of Service
        </Link>
      </footer>
    </div>
  );
}

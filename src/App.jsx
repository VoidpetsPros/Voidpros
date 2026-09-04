import React, { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { User, ChevronDown } from "lucide-react";
import logoMark from "./assets/logo.svg";
import { useAuth } from "./hooks/AuthContext";
import AuthModal from "./components/AuthModal";
import ProfileSidebar from "./components/ProfileSidebar";
import OnboardingTutorial from "./components/OnboardingTutorial";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import Search from "./pages/Search";
import Results from "./pages/Results";
import Submit from "./pages/Submit";
import Admin from "./pages/Admin";
import FulfillRequests from "./pages/FulfillRequests";
import FulfillAttempt from "./pages/FulfillAttempt";
import MyActivity from "./pages/MyActivity";
import MyRequests from "./pages/MyRequests";
import BillingSuccess from "./pages/BillingSuccess";
import BillingCancelled from "./pages/BillingCancelled";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import { INK, PANEL, LINE, CREAM, MUTED, GOLD, GOLD_DIM, DANGER } from "./lib/theme";

const SUBMISSION_OPTIONS = [
  { to: "/submit", label: "Completions", subtext: "Submit the team you used to beat any floor and earn 5 karma." },
  { to: "/fulfill", label: "Challenges", subtext: "Beat a floor with a limited pet & item pool for 10 karma." },
];

// Plain, calm background — no glow orbs, no grid overlay. A dark theme
// should read as a clean tool, not a Web3 landing page.
const VOID_BACKGROUND = {
  backgroundColor: INK,
};

export default function App() {
  const { isAuthed, profile, hasNewActivity, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const location = useLocation();

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
          background: GOLD_DIM,
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
              position: "relative",
            }}
          >
            {(() => {
              const submissionsActive = location.pathname === "/submit" || location.pathname.startsWith("/fulfill");
              return (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowSubmissions((v) => !v)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12.5,
                      fontWeight: submissionsActive ? 600 : 500,
                      color: submissionsActive ? GOLD_DIM : "rgba(255,255,255,0.85)",
                      background: submissionsActive ? "#FFFFFF" : "transparent",
                      padding: "7px 12px",
                      borderRadius: 7,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Submissions <ChevronDown size={13} />
                  </button>
                  {showSubmissions && (
                    <>
                      <div onClick={() => setShowSubmissions(false)} style={{ position: "fixed", inset: 0, zIndex: 69 }} />
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 8px)",
                          left: 0,
                          width: 270,
                          background: PANEL,
                          border: `1px solid ${LINE}`,
                          borderRadius: 12,
                          boxShadow: "0 12px 28px -10px rgba(0,0,0,0.35)",
                          zIndex: 70,
                          overflow: "hidden",
                        }}
                      >
                        {SUBMISSION_OPTIONS.map((opt, i) => (
                          <Link
                            key={opt.to}
                            to={opt.to}
                            onClick={() => setShowSubmissions(false)}
                            style={{
                              display: "block",
                              padding: "13px 15px",
                              textDecoration: "none",
                              borderBottom: i < SUBMISSION_OPTIONS.length - 1 ? `1px solid ${LINE}` : "none",
                            }}
                          >
                            <p style={{ margin: "0 0 3px", fontSize: 13.5, fontWeight: 600, color: CREAM }}>{opt.label}</p>
                            <p style={{ margin: 0, fontSize: 11.5, color: MUTED, lineHeight: 1.45 }}>{opt.subtext}</p>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            <Link
              to="/my-requests"
              style={{
                fontSize: 12.5,
                fontWeight: location.pathname === "/my-requests" ? 600 : 500,
                color: location.pathname === "/my-requests" ? GOLD_DIM : "rgba(255,255,255,0.85)",
                background: location.pathname === "/my-requests" ? "#FFFFFF" : "transparent",
                textDecoration: "none",
                padding: "7px 12px",
                borderRadius: 7,
                whiteSpace: "nowrap",
              }}
            >
              My Requests
            </Link>

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
              <div style={{ width: 130 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.75)", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>
                    Karma
                  </span>
                  <span style={{ fontSize: 9.5, color: "#FFFFFF", fontWeight: 600 }}>{profile?.karma ?? 0} / 100</span>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.25)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, Math.max(0, profile?.karma ?? 0))}%`,
                      background: "#FFFFFF",
                      borderRadius: 999,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => setShowProfile(true)}
                aria-label="Profile"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  borderRadius: 999,
                  width: 36,
                  height: 36,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <User size={16} color="#FFFFFF" />
                {hasNewActivity && (
                  <span
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      width: 11,
                      height: 11,
                      borderRadius: "50%",
                      background: "#dc2626",
                      border: `2px solid ${GOLD_DIM}`,
                    }}
                  />
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              style={{ background: "#FFFFFF", border: "none", color: GOLD_DIM, fontWeight: 600, fontSize: 12.5, padding: "9px 16px", borderRadius: 8, cursor: "pointer" }}
            >
              Sign in / create account
            </button>
          )}
        </div>
      </header>

      {showProfile && <ProfileSidebar onClose={() => setShowProfile(false)} />}
      {isAuthed && profile && !profile.tutorial_completed && <OnboardingTutorial />}

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
          <Route path="/my-requests" element={<MyRequests onRequireAuth={() => setShowAuth(true)} />} />
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

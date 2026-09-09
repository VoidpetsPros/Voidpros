import React, { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { User, ChevronDown, Menu, X } from "lucide-react";
import logoMark from "./assets/logo.svg";
import { useAuth } from "./hooks/AuthContext";
import useIsMobile from "./hooks/useIsMobile";
import AuthModal from "./components/AuthModal";
import ProfileSidebar from "./components/ProfileSidebar";
import OnboardingTutorial from "./components/OnboardingTutorial";
import Home from "./pages/Home";
import Subscription from "./pages/Subscription";
import Settings from "./pages/Settings";
import Collection from "./pages/Collection";
import Search from "./pages/Search";
import Results from "./pages/Results";
import Submit from "./pages/Submit";
import Admin from "./pages/Admin";
import FulfillRequests from "./pages/FulfillRequests";
import FulfillAttempt from "./pages/FulfillAttempt";
import MyActivity from "./pages/MyActivity";
import MyRequests from "./pages/MyRequests";
import Leaderboards from "./pages/Leaderboards";
import BillingSuccess from "./pages/BillingSuccess";
import BillingCancelled from "./pages/BillingCancelled";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import { useTheme } from "./hooks/ThemeContext";

const SUBMISSION_OPTIONS = [
  { to: "/submit", label: "Completions", subtext: "Submit the team you used to beat any floor." },
  { to: "/fulfill", label: "Challenges", subtext: "Beat a floor with a limited pet & item pool." },
];

export default function App() {
  const { isAuthed, profile, hasNewActivity, hasNewChallenges, loading } = useAuth();
  const { INK, PANEL, LINE, CREAM, MUTED, GOLD, GOLD_DIM } = useTheme();
  // Plain, calm background — no glow orbs, no grid overlay. A dark theme
  // should read as a clean tool, not a Web3 landing page.
  const VOID_BACKGROUND = { backgroundColor: INK };
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useIsMobile();
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

        {isAuthed && !isMobile && (
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
                      position: "relative",
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
                    {hasNewChallenges && (
                      <span
                        style={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#dc2626",
                          border: `1.5px solid ${submissionsActive ? "#FFFFFF" : GOLD_DIM}`,
                        }}
                      />
                    )}
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
                              position: "relative",
                              display: "block",
                              padding: "13px 15px",
                              textDecoration: "none",
                              borderBottom: i < SUBMISSION_OPTIONS.length - 1 ? `1px solid ${LINE}` : "none",
                            }}
                          >
                            <p style={{ margin: "0 0 3px", fontSize: 13.5, fontWeight: 600, color: CREAM }}>{opt.label}</p>
                            <p style={{ margin: 0, fontSize: 11.5, color: MUTED, lineHeight: 1.45 }}>{opt.subtext}</p>
                            {opt.to === "/fulfill" && hasNewChallenges && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: 14,
                                  right: 14,
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: "#dc2626",
                                }}
                              />
                            )}
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
          </nav>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
          {isAuthed ? (
            <>
              {!isMobile && (
                <Link
                  to="/leaderboards"
                  style={{
                    fontSize: 12.5,
                    fontWeight: location.pathname === "/leaderboards" ? 600 : 500,
                    color: location.pathname === "/leaderboards" ? GOLD_DIM : "rgba(255,255,255,0.85)",
                    background: location.pathname === "/leaderboards" ? "#FFFFFF" : "transparent",
                    textDecoration: "none",
                    padding: "7px 12px",
                    borderRadius: 7,
                    whiteSpace: "nowrap",
                  }}
                >
                  Leaderboards
                </Link>
              )}
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
              {isMobile && (
                <button
                  onClick={() => setShowMobileMenu((v) => !v)}
                  aria-label="Menu"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.14)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    borderRadius: 8,
                    width: 36,
                    height: 36,
                    cursor: "pointer",
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  {showMobileMenu ? <X size={17} color="#FFFFFF" /> : <Menu size={17} color="#FFFFFF" />}
                  {hasNewChallenges && !showMobileMenu && (
                    <span
                      style={{
                        position: "absolute",
                        top: -2,
                        right: -2,
                        width: 9,
                        height: 9,
                        borderRadius: "50%",
                        background: "#dc2626",
                        border: `1.5px solid ${GOLD_DIM}`,
                      }}
                    />
                  )}
                </button>
              )}
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

      {isMobile && showMobileMenu && (
        <>
          <div onClick={() => setShowMobileMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 69 }} />
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 70,
              background: PANEL,
              borderBottom: `1px solid ${LINE}`,
              boxShadow: "0 12px 28px -10px rgba(0,0,0,0.35)",
            }}
          >
            {SUBMISSION_OPTIONS.map((opt) => (
              <Link
                key={opt.to}
                to={opt.to}
                onClick={() => setShowMobileMenu(false)}
                style={{
                  position: "relative",
                  display: "block",
                  padding: "13px 20px",
                  textDecoration: "none",
                  borderBottom: `1px solid ${LINE}`,
                }}
              >
                <p style={{ margin: "0 0 3px", fontSize: 13.5, fontWeight: 600, color: CREAM }}>{opt.label}</p>
                <p style={{ margin: 0, fontSize: 11.5, color: MUTED, lineHeight: 1.45 }}>{opt.subtext}</p>
                {opt.to === "/fulfill" && hasNewChallenges && (
                  <span
                    style={{
                      position: "absolute",
                      top: 14,
                      right: 20,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#dc2626",
                    }}
                  />
                )}
              </Link>
            ))}
            <Link
              to="/my-requests"
              onClick={() => setShowMobileMenu(false)}
              style={{
                display: "block",
                padding: "13px 20px",
                fontSize: 13.5,
                fontWeight: location.pathname === "/my-requests" ? 600 : 500,
                color: location.pathname === "/my-requests" ? GOLD : CREAM,
                textDecoration: "none",
              }}
            >
              My Requests
            </Link>
            <Link
              to="/leaderboards"
              onClick={() => setShowMobileMenu(false)}
              style={{
                display: "block",
                padding: "13px 20px",
                fontSize: 13.5,
                fontWeight: location.pathname === "/leaderboards" ? 600 : 500,
                color: location.pathname === "/leaderboards" ? GOLD : CREAM,
                textDecoration: "none",
              }}
            >
              Leaderboards
            </Link>
          </div>
        </>
      )}

      {showProfile && <ProfileSidebar onClose={() => setShowProfile(false)} />}
      {isAuthed && profile && !profile.tutorial_completed && <OnboardingTutorial />}

      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/subscribe" element={<Subscription onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/settings" element={<Settings onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/collection" element={<Collection onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/search" element={<Search />} />
          <Route path="/results/:stage" element={<Results onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/submit" element={<Submit onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/fulfill" element={<FulfillRequests />} />
          <Route path="/fulfill/:requestId" element={<FulfillAttempt onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/my-activity" element={<MyActivity onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/my-requests" element={<MyRequests onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/leaderboards" element={<Leaderboards />} />
          <Route path="/billing/success" element={<BillingSuccess />} />
          <Route path="/billing/cancelled" element={<BillingCancelled />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
        </Routes>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}

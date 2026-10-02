import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { User, ChevronDown } from "lucide-react";
import logoMark from "./assets/logo.svg";
import { supabase } from "./lib/supabaseClient";
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
import Achievements from "./pages/Achievements";
import Affiliate from "./pages/Affiliate";
import Feedback from "./pages/Feedback";
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
  const isMobile = useIsMobile();
  // Separate, wider breakpoint than isMobile: below this width the nav
  // pills + counter no longer comfortably fit on one header row, so the
  // counter moves to its own line below the header instead of squeezing in.
  const isNarrowHeader = useIsMobile(900);
  const location = useLocation();

  // Capture a referral link (?ref=CODE) the moment it's seen, from any
  // page — someone could land on a floor's results page, not just the
  // homepage. Stored until there's an active session (see
  // useAuth.js/fetchProfile, which calls attach_referral_code), then
  // cleared either way so it's not reused by a later, unrelated signup.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      window.localStorage.setItem("pending_referral_code", ref);
      params.delete("ref");
      const cleanSearch = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (cleanSearch ? `?${cleanSearch}` : ""));
    }
  }, []);
  const [verifiedCount, setVerifiedCount] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchVerifiedCount() {
      const { count, error } = await supabase
        .from("builds")
        .select("*", { count: "exact", head: true })
        .eq("status", "verified");

      if (!error && isMounted) {
        setVerifiedCount(count);
      }
    }

    fetchVerifiedCount();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ ...VOID_BACKGROUND, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div
      style={{
        ...VOID_BACKGROUND,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <header
        style={{
          background: GOLD_DIM,
          paddingTop: "calc(14px + env(safe-area-inset-top, 0px))",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, auto) minmax(0, 1fr)",
            alignItems: "center",
            gap: 20,
            padding: "0 24px 14px",
          }}
        >
        <div style={{ display: "flex", alignItems: "center", gap: 20, minWidth: 0 }}>
        {!isMobile && (
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <img src={logoMark} alt="Voidpros" style={{ width: 32, height: 32, borderRadius: 8, display: "block" }} />
            <span style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: -0.3, color: "#FFFFFF" }}>
              voidpros
            </span>
          </Link>
        )}

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
        </div>

        {isMobile ? (
          <Link
            to="/"
            style={{
              justifySelf: "center",
              textDecoration: "none",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: -0.3,
              color: "#FFFFFF",
              whiteSpace: "nowrap",
            }}
          >
            voidpros
          </Link>
        ) : (
          <span
            style={{
              fontWeight: 800,
              fontSize: 13.5,
              color: "#FFFFFF",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "block",
              maxWidth: "100%",
              justifySelf: "center",
              textAlign: "center",
            }}
          >
            {verifiedCount !== null && !isNarrowHeader ? `Community Has Submitted ${verifiedCount.toLocaleString()} Builds` : ""}
          </span>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10, justifySelf: "end", minWidth: 0 }}>
          {isAuthed ? (
            <>
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
                {profile?.equipped_achievement?.image_url ? (
                  <img
                    src={profile.equipped_achievement.image_url}
                    alt=""
                    style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <User size={16} color="#FFFFFF" />
                )}
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
        </div>

        {isMobile && isAuthed && (
          <div style={{ padding: "0 24px 14px", position: "relative" }}>
            <button
              onClick={() => setShowSubmissions((v) => !v)}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.22)",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "#FFFFFF",
                padding: "8px 14px",
                whiteSpace: "nowrap",
              }}
            >
              Submit a Build <ChevronDown size={13} />
              {hasNewChallenges && (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#dc2626",
                    border: `1.5px solid ${GOLD_DIM}`,
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
                    left: 24,
                    width: 270,
                    maxWidth: "calc(100vw - 48px)",
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
        )}
      </header>

      {verifiedCount !== null && isNarrowHeader && (
        <div style={{ padding: "10px 24px", textAlign: "center" }}>
          <span style={{ fontWeight: 800, fontSize: 13.5, color: "#000000" }}>
            Community Has Submitted {verifiedCount.toLocaleString()} Builds
          </span>
        </div>
      )}

      {showProfile && <ProfileSidebar onClose={() => setShowProfile(false)} />}
      {isAuthed && profile && !profile.tutorial_completed && <OnboardingTutorial />}

      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/subscribe" element={<Subscription onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/settings" element={<Settings onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/achievements" element={<Achievements onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/affiliate" element={<Affiliate onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/collection" element={<Collection onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/search" element={<Search onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/results/:stage" element={<Results onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/submit" element={<Submit onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/fulfill" element={<FulfillRequests />} />
          <Route path="/fulfill/:requestId" element={<FulfillAttempt onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/my-activity" element={<MyActivity onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/my-requests" element={<MyRequests onRequireAuth={() => setShowAuth(true)} />} />
          <Route path="/leaderboards" element={<Leaderboards />} />
          <Route path="/feedback" element={<Feedback onRequireAuth={() => setShowAuth(true)} />} />
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

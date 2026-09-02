import React, { useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
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
import { INK, PANEL_2, LINE, CREAM, MUTED, GOLD, GOLD_DIM, DANGER, VIOLET } from "./lib/theme";

export default function App() {
  const { isAuthed, profile, signOut, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const navigate = useNavigate();

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
      <div style={{ background: INK, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ background: INK, minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 24px",
          borderBottom: `1px solid ${LINE}`,
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: `linear-gradient(160deg, ${GOLD}, ${GOLD_DIM})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={14} color="#FFFFFF" />
          </div>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 19, color: CREAM }}>voidpros</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isAuthed ? (
            <>
              <Link to="/search" style={{ fontSize: 12.5, color: GOLD, textDecoration: "none", fontWeight: 600 }}>
                Find a build
              </Link>
              <Link to="/submit" style={{ fontSize: 12.5, color: MUTED, textDecoration: "none" }}>
                Submit a build
              </Link>
              <Link to="/collection" style={{ fontSize: 12.5, color: MUTED, textDecoration: "none" }}>
                My collection
              </Link>
              <Link to="/fulfill" style={{ fontSize: 12.5, color: VIOLET, textDecoration: "none" }}>
                Fulfill requests
              </Link>
              <Link to="/my-activity" style={{ fontSize: 12.5, color: MUTED, textDecoration: "none" }}>
                My activity
              </Link>
              {profile?.is_admin && (
                <Link to="/admin" style={{ fontSize: 12.5, color: DANGER, textDecoration: "none", fontWeight: 600 }}>
                  Admin
                </Link>
              )}
              <span style={{ fontSize: 12.5, color: MUTED }}>
                {profile?.username || "player"} · {profile?.karma ?? 0} karma ·{" "}
                {profile?.is_subscribed ? "unlimited lookups" : `${profile ? profile.trial_lookups_limit - profile.trial_lookups_used : 0} lookups left`}
              </span>
              {profile?.is_subscribed && (
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  style={{ background: "none", border: `1px solid ${LINE}`, color: MUTED, fontSize: 12.5, padding: "6px 12px", borderRadius: 8, cursor: "pointer" }}
                >
                  {portalLoading ? "Opening…" : "Manage billing"}
                </button>
              )}
              <button
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
                style={{ background: "none", border: `1px solid ${LINE}`, color: CREAM, fontSize: 12.5, padding: "6px 12px", borderRadius: 8, cursor: "pointer" }}
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              style={{ background: "none", border: `1px solid ${LINE}`, color: CREAM, fontSize: 12.5, padding: "7px 12px", borderRadius: 8, cursor: "pointer" }}
            >
              Sign in / create account
            </button>
          )}
        </div>
      </header>

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

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <footer style={{ borderTop: `1px solid ${LINE}`, padding: "20px 24px", textAlign: "center" }}>
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

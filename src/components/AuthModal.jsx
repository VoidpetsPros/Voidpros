import React, { useState } from "react";
import { X, Mail, Lock, User, Sparkles } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD, GOLD_DIM, VIOLET, DANGER } from "../lib/theme";

export default function AuthModal({ onClose, headline, subhead }) {
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [confirmSent, setConfirmSent] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Enter an email and password.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    const { data, error: authError } =
      mode === "signup" ? await signUp(email, password, username.trim() || null) : await signIn(email, password);
    setBusy(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    if (mode === "signup" && !data?.session) {
      // Email confirmation is required — the account exists but there's no
      // active session yet. Tell the person instead of silently closing.
      setConfirmSent(true);
      return;
    }
    onClose();
  };

  const handleGoogle = async () => {
    setBusy(true);
    const { error: authError } = await signInWithGoogle();
    setBusy(false);
    if (authError) setError(authError.message);
    // OAuth redirects the page — no need to call onClose here.
  };

  return (
    <div
      style={{
        minHeight: 400,
        background: "rgba(43,38,32,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        position: "fixed",
        inset: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: PANEL,
          border: `1px solid ${LINE}`,
          borderRadius: 16,
          padding: 28,
          maxWidth: 380,
          width: "100%",
          boxShadow: "0 20px 50px -12px rgba(43,38,32,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: `linear-gradient(160deg, ${GOLD}, ${GOLD_DIM})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={16} color="#FFFFFF" />
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer" }} aria-label="Close">
              <X size={18} />
            </button>
          )}
        </div>

        {confirmSent ? (
          <>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 21, color: CREAM, margin: "12px 0 4px" }}>
              Check your email
            </p>
            <p style={{ fontSize: 13, color: MUTED, margin: "0 0 20px", lineHeight: 1.55 }}>
              We sent a confirmation link to <strong>{email}</strong>. Click it, then come
              back and sign in — your account exists but isn't active until it's confirmed.
            </p>
            <button
              onClick={onClose}
              style={{ width: "100%", background: PANEL, color: CREAM, border: `1px solid ${LINE}`, borderRadius: 9, padding: "10px 0", fontSize: 13.5, cursor: "pointer" }}
            >
              Got it
            </button>
          </>
        ) : (
        <>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 21, color: CREAM, margin: "12px 0 4px" }}>
          {headline || (mode === "signup" ? "Save your team, get 3 free lookups" : "Welcome back")}
        </p>
        <p style={{ fontSize: 13, color: MUTED, margin: "0 0 20px", lineHeight: 1.55 }}>
          {subhead ||
            (mode === "signup"
              ? "An account keeps your pets and items saved so you never re-enter them."
              : "Sign in to pick up your saved collection.")}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {mode === "signup" && (
            <div style={{ position: "relative" }}>
              <User size={15} color={MUTED} style={{ position: "absolute", left: 12, top: 11 }} />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username (optional)"
                style={inputStyle}
              />
            </div>
          )}
          <div style={{ position: "relative" }}>
            <Mail size={15} color={MUTED} style={{ position: "absolute", left: 12, top: 11 }} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={inputStyle} />
          </div>
          <div style={{ position: "relative" }}>
            <Lock size={15} color={MUTED} style={{ position: "absolute", left: 12, top: 11 }} />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              style={inputStyle}
            />
          </div>
        </div>

        {error && <p style={{ fontSize: 12.5, color: DANGER, margin: "0 0 12px" }}>{error}</p>}

        <button onClick={handleSubmit} disabled={busy} style={primaryButtonStyle}>
          {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>

        <button onClick={handleGoogle} disabled={busy} style={secondaryButtonStyle}>
          Continue with Google
        </button>

        <p style={{ fontSize: 12.5, color: MUTED, textAlign: "center", margin: "0 0 4px" }}>
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <span style={{ color: VIOLET, cursor: "pointer" }} onClick={() => setMode("signin")}>
                Sign in
              </span>
            </>
          ) : (
            <>
              New here?{" "}
              <span style={{ color: VIOLET, cursor: "pointer" }} onClick={() => setMode("signup")}>
                Create an account
              </span>
            </>
          )}
        </p>
        </>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: PANEL_2,
  border: `1px solid ${LINE}`,
  borderRadius: 9,
  padding: "10px 12px 10px 34px",
  color: CREAM,
  fontSize: 14,
  outline: "none",
};

const primaryButtonStyle = {
  width: "100%",
  background: GOLD,
  color: "#FFFFFF",
  border: "none",
  borderRadius: 9,
  padding: "11px 0",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  marginBottom: 10,
};

const secondaryButtonStyle = {
  width: "100%",
  background: PANEL,
  color: CREAM,
  border: `1px solid ${LINE}`,
  borderRadius: 9,
  padding: "10px 0",
  fontSize: 13.5,
  cursor: "pointer",
  marginBottom: 16,
};

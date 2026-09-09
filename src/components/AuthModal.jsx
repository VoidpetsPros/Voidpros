import React, { useState } from "react";
import { X, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { supabase } from "../lib/supabaseClient";
import logoMark from "../assets/logo.svg";
import { useTheme } from "../hooks/ThemeContext";

export default function AuthModal({ onClose, headline, subhead }) {
  const { signUp, signIn, resendConfirmation, signInWithGoogle } = useAuth();
  const { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD, VIOLET, DANGER } = useTheme();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [confirmSent, setConfirmSent] = useState(false);
  // True when a sign-in attempt failed specifically because the account's
  // email hasn't been confirmed yet — lets us swap the generic error for a
  // clear message plus a resend option, instead of a raw Supabase string.
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resendState, setResendState] = useState("idle"); // idle | busy | sent

  // These need to live inside the component (not at module scope) since
  // they depend on useTheme(), which only works inside a component.
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

  const handleSubmit = async () => {
    setError("");
    setUnconfirmed(false);
    setResendState("idle");
    if (!email.trim() || !password.trim()) {
      setError("Enter an email and password.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    const trimmedUsername = username.trim();
    if (mode === "signup" && trimmedUsername) {
      setBusy(true);
      // Check availability up front — usernames are unique in the
      // database (case-insensitively) regardless, but without this a
      // collision would only surface as a generic "database error" from
      // Supabase Auth, since the failure happens inside a trigger it
      // wraps for security.
      const { data: available, error: checkError } = await supabase.rpc("username_available", {
        p_username: trimmedUsername,
      });
      if (checkError) {
        setBusy(false);
        setError(checkError.message);
        return;
      }
      if (!available) {
        setBusy(false);
        setError("That username is taken.");
        return;
      }
    }
    setBusy(true);
    const { data, error: authError } =
      mode === "signup" ? await signUp(email, password, trimmedUsername || null) : await signIn(email, password);
    setBusy(false);
    if (authError) {
      // Supabase's unconfirmed-account error — code is the reliable check,
      // but older supabase-js versions only set the message, so fall back
      // to matching on that.
      const isUnconfirmed =
        authError.code === "email_not_confirmed" ||
        /email.*not.*confirm/i.test(authError.message || "");
      if (mode === "signin" && isUnconfirmed) {
        setUnconfirmed(true);
      } else {
        setError(authError.message);
      }
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

  const handleResend = async () => {
    setResendState("busy");
    const { error: resendError } = await resendConfirmation(email);
    if (resendError) {
      setResendState("idle");
      setError(resendError.message);
    } else {
      setResendState("sent");
    }
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
        background: "rgba(0,0,0,0.6)",
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
          boxShadow: "0 20px 50px -12px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <img src={logoMark} alt="" style={{ width: 34, height: 34, borderRadius: 9, display: "block" }} />
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

        {unconfirmed && (
          <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 9, padding: "10px 12px", marginBottom: 12 }}>
            <p style={{ fontSize: 12.5, color: CREAM, margin: "0 0 6px", lineHeight: 1.5 }}>
              This account's email hasn't been confirmed yet. Check your inbox for the
              link, or we can send a new one.
            </p>
            {resendState === "sent" ? (
              <p style={{ fontSize: 12.5, color: MUTED, margin: 0 }}>Confirmation email sent to {email}.</p>
            ) : (
              <span
                onClick={resendState === "busy" ? undefined : handleResend}
                style={{ fontSize: 12.5, color: VIOLET, cursor: resendState === "busy" ? "default" : "pointer", fontWeight: 600 }}
              >
                {resendState === "busy" ? "Sending…" : "Resend confirmation email"}
              </span>
            )}
          </div>
        )}

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
              <span
                style={{ color: VIOLET, cursor: "pointer" }}
                onClick={() => {
                  setMode("signin");
                  setError("");
                  setUnconfirmed(false);
                }}
              >
                Sign in
              </span>
            </>
          ) : (
            <>
              New here?{" "}
              <span
                style={{ color: VIOLET, cursor: "pointer" }}
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setUnconfirmed(false);
                }}
              >
                Create an account
              </span>
            </>
          )}
        </p>

        {mode === "signup" && (
          <p style={{ fontSize: 11, color: MUTED, textAlign: "center", margin: "10px 0 0", lineHeight: 1.5 }}>
            By creating an account, you agree to our{" "}
            <a href="/terms" style={{ color: VIOLET }}>Terms of Service</a> and{" "}
            <a href="/privacy" style={{ color: VIOLET }}>Privacy Policy</a>.
          </p>
        )}
        </>
        )}
      </div>
    </div>
  );
}

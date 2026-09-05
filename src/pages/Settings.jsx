import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useTheme } from "../hooks/ThemeContext";
import { supabase } from "../lib/supabaseClient";
import { openBillingPortal } from "../lib/billing";

function Row({ label, value, action, children }) {
  const { LINE, CREAM, MUTED } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "20px 0", borderBottom: `1px solid ${LINE}`, flexWrap: "wrap" }}>
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: CREAM, margin: "0 0 3px" }}>{label}</p>
        {value && <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>{value}</p>}
        {children}
      </div>
      {action}
    </div>
  );
}

export default function Settings({ onRequireAuth }) {
  const { isAuthed, user, profile, signOut, refreshProfile } = useAuth();
  const { PANEL_2, LINE, CREAM, MUTED, GOLD, DANGER } = useTheme();
  const navigate = useNavigate();

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(profile?.username || "");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);

  if (!isAuthed) {
    onRequireAuth();
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Sign in to view your settings.</p>
      </div>
    );
  }

  const handleSaveUsername = async () => {
    const trimmed = usernameInput.trim();
    if (!trimmed) {
      setUsernameError("Username can't be empty.");
      return;
    }
    setUsernameError("");
    setUsernameSaving(true);
    const { error } = await supabase.from("profiles").update({ username: trimmed }).eq("id", user.id);
    setUsernameSaving(false);
    if (error) {
      setUsernameError(error.code === "23505" ? "That username is taken." : error.message);
      return;
    }
    await refreshProfile();
    setEditingUsername(false);
  };

  const handleManageSubscription = async () => {
    if (!profile?.is_subscribed) {
      navigate("/subscribe");
      return;
    }
    setPortalLoading(true);
    try {
      await openBillingPortal();
    } catch (err) {
      alert(err.message || "Couldn't open billing portal");
      setPortalLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div style={{ padding: "24px 24px 80px", maxWidth: 560, margin: "0 auto" }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: "none", border: "none", color: MUTED, fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: 0, marginBottom: 20 }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <h1 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 24, color: CREAM, margin: "0 0 20px" }}>
        Settings
      </h1>

      <Row label="E-Mail Address" value={user?.email} />

      <Row
        label="Username"
        value={editingUsername ? null : profile?.username}
        action={
          !editingUsername && (
            <button
              onClick={() => {
                setUsernameInput(profile?.username || "");
                setUsernameError("");
                setEditingUsername(true);
              }}
              style={{ background: "none", border: `1px solid ${LINE}`, color: CREAM, borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Update Username
            </button>
          )
        }
      >
        {editingUsername && (
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveUsername()}
              style={{ flex: "1 1 160px", boxSizing: "border-box", background: PANEL_2, border: `1px solid ${LINE}`, borderRadius: 9, padding: "9px 12px", color: CREAM, fontSize: 14, outline: "none" }}
            />
            <button
              onClick={handleSaveUsername}
              disabled={usernameSaving}
              style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: usernameSaving ? "default" : "pointer" }}
            >
              {usernameSaving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditingUsername(false)}
              style={{ background: "none", border: `1px solid ${LINE}`, color: MUTED, borderRadius: 9, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            {usernameError && <p style={{ width: "100%", fontSize: 12, color: DANGER, margin: "4px 0 0" }}>{usernameError}</p>}
          </div>
        )}
      </Row>

      <Row
        label="Current Plan"
        value={profile?.is_subscribed ? "Unlimited" : "Free"}
        action={
          <button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            style={{ background: "none", border: `1px solid ${LINE}`, color: CREAM, borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: portalLoading ? "default" : "pointer", whiteSpace: "nowrap" }}
          >
            {portalLoading ? "Opening…" : profile?.is_subscribed ? "Manage Subscription" : "Upgrade"}
          </button>
        }
      />

      <Row
        label="Sign out"
        action={
          <button
            onClick={handleSignOut}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: `1px solid ${LINE}`, color: CREAM, borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <LogOut size={14} /> Sign out
          </button>
        }
      />
    </div>
  );
}

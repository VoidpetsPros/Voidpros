import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useTheme } from "../hooks/ThemeContext";
import { supabase } from "../lib/supabaseClient";
import { openBillingPortal, cancelSubscription, resumeSubscription } from "../lib/billing";
import BackButton from "../components/BackButton";

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
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [levelsPrefSaving, setLevelsPrefSaving] = useState(false);
  const [myCredits, setMyCredits] = useState(null);

  useEffect(() => {
    if (!isAuthed) return;
    supabase.rpc("get_my_credits").then(({ data, error }) => {
      if (!error) setMyCredits(data);
    });
  }, [isAuthed]);

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

  const handleCancelSubscription = async () => {
    if (!window.confirm("Cancel your subscription? If you're still in your free trial this ends access right away — if you're already a paying subscriber, you'll keep access until your current billing period ends.")) return;
    setCancelError("");
    setCancelLoading(true);
    try {
      await cancelSubscription();
      await refreshProfile();
    } catch (err) {
      setCancelError(err.message || "Couldn't cancel subscription");
    }
    setCancelLoading(false);
  };

  const handleResumeSubscription = async () => {
    setCancelError("");
    setCancelLoading(true);
    try {
      await resumeSubscription();
      await refreshProfile();
    } catch (err) {
      setCancelError(err.message || "Couldn't resume subscription");
    }
    setCancelLoading(false);
  };

  const handleToggleLevelsPref = async () => {
    setLevelsPrefSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ show_levels_and_items: !profile?.show_levels_and_items })
      .eq("id", user.id);
    setLevelsPrefSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    await refreshProfile();
  };

  return (
    <div style={{ padding: "24px 24px 80px", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <BackButton style={{ marginBottom: 0 }} />
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 22, color: CREAM, margin: 0 }}>
          Settings
        </h1>
      </div>

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
        value={
          profile?.is_subscribed && profile?.subscription_cancel_at_period_end
            ? `Unlimited — cancels ${profile?.subscription_current_period_end ? new Date(profile.subscription_current_period_end).toLocaleDateString() : "at end of billing period"}`
            : profile?.is_subscribed
            ? "Unlimited"
            : "Free"
        }
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              style={{ background: "none", border: `1px solid ${LINE}`, color: CREAM, borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: portalLoading ? "default" : "pointer", whiteSpace: "nowrap" }}
            >
              {portalLoading ? "Opening…" : profile?.is_subscribed ? "Payment & Invoices" : "Upgrade"}
            </button>
            {profile?.is_subscribed && profile?.subscription_cancel_at_period_end && (
              <button
                onClick={handleResumeSubscription}
                disabled={cancelLoading}
                style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: cancelLoading ? "default" : "pointer", whiteSpace: "nowrap" }}
              >
                {cancelLoading ? "…" : "Resume"}
              </button>
            )}
            {profile?.is_subscribed && !profile?.subscription_cancel_at_period_end && (
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                style={{ background: "none", border: `1px solid ${DANGER}`, color: DANGER, borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: cancelLoading ? "default" : "pointer", whiteSpace: "nowrap" }}
              >
                {cancelLoading ? "…" : "Cancel"}
              </button>
            )}
          </div>
        }
      >
        {cancelError && <p style={{ fontSize: 12, color: DANGER, margin: "6px 0 0" }}>{cancelError}</p>}
      </Row>

      <Row label="Credits">
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          {[
            { label: "Item Search Credits", value: myCredits?.item_search_credits },
            { label: "Request Credits", value: myCredits?.request_credits },
            { label: "Suggested Build Credits", value: myCredits?.suggested_build_credits },
          ].map((c) => (
            <div key={c.label} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
              <span style={{ color: MUTED }}>{c.label}</span>
              <span style={{ color: profile?.is_subscribed ? GOLD : CREAM, fontWeight: 600 }}>
                {profile?.is_subscribed ? "Unlimited" : c.value ?? 0}
              </span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
            <span style={{ color: MUTED }}>Free Suggested Builds This Month</span>
            <span style={{ color: profile?.is_subscribed ? GOLD : CREAM, fontWeight: 600 }}>
              {profile?.is_subscribed ? "Unlimited" : `${myCredits?.free_suggestions_remaining ?? 5}/5`}
            </span>
          </div>
        </div>
      </Row>

      <Row
        label="Show Levels"
        action={
          <button
            onClick={handleToggleLevelsPref}
            disabled={levelsPrefSaving}
            role="switch"
            aria-checked={!!profile?.show_levels_and_items}
            style={{
              position: "relative",
              width: 44,
              height: 26,
              borderRadius: 999,
              border: "none",
              background: profile?.show_levels_and_items ? GOLD : LINE,
              cursor: levelsPrefSaving ? "default" : "pointer",
              flexShrink: 0,
              opacity: levelsPrefSaving ? 0.6 : 1,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: profile?.show_levels_and_items ? 21 : 3,
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#FFFFFF",
                transition: "left 0.15s ease",
              }}
            />
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

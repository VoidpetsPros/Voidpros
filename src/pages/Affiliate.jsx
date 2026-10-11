import React, { useState, useEffect } from "react";
import { Copy, Check, Landmark } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useTheme } from "../hooks/ThemeContext";
import { supabase } from "../lib/supabaseClient";
import { startAffiliateConnectOnboarding } from "../lib/billing";
import BackButton from "../components/BackButton";

function formatCents(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Affiliate({ onRequireAuth }) {
  const { isAuthed } = useAuth();
  const { CREAM, MUTED, LINE, PANEL, PANEL_2, GOLD } = useTheme();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);

  const load = async () => {
    const { data, error: fetchError } = await supabase.rpc("get_my_affiliate_stats");
    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setStats(data);
  };

  useEffect(() => {
    if (isAuthed) load();
  }, [isAuthed]);

  if (!isAuthed) {
    onRequireAuth();
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Sign in to view the affiliate program.</p>
      </div>
    );
  }

  const handleJoin = async () => {
    setJoining(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("become_affiliate");
    setJoining(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    await load();
  };

  const referralLink = stats?.code ? `${window.location.origin}/?ref=${stats.code}` : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectBank = async () => {
    setConnectLoading(true);
    setError("");
    try {
      await startAffiliateConnectOnboarding();
      // startAffiliateConnectOnboarding redirects via window.location on
      // success, so execution past this point only happens on failure.
    } catch (err) {
      if (err.action_url) {
        // A one-time Stripe account setup step, not something fixable per
        // affiliate — send straight there instead of showing raw error text.
        window.location.href = err.action_url;
        return;
      }
      setError(err.message || "Couldn't start bank account setup");
      setConnectLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px 24px 60px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
        <BackButton style={{ marginBottom: 0 }} />
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 22, color: CREAM, margin: 0 }}>
          Affiliate Program
        </h1>
      </div>
      <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 22px" }}>
        Get 20% Of Subscription Price Every Month Someone Is Subscribed. Yearly & Credits Are 20%
      </p>

      {error && <p style={{ fontSize: 12.5, color: "#F87171", marginBottom: 16 }}>{error}</p>}
      {!error && stats === null && <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>}

      {stats && !stats.is_affiliate && (
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 14, padding: 24, textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: CREAM, margin: "0 0 8px" }}>Become an affiliate</p>
          <p style={{ fontSize: 13, color: MUTED, margin: "0 0 18px" }}>
            Get your own referral link — no application, just sign up and start sharing.
          </p>
          <button
            onClick={handleJoin}
            disabled={joining}
            style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 9, padding: "11px 22px", fontSize: 13.5, fontWeight: 600, cursor: joining ? "default" : "pointer" }}
          >
            {joining ? "Setting up…" : "Get my referral link"}
          </button>
        </div>
      )}

      {stats && stats.is_affiliate && (
        <>
          <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 8px" }}>
              Your referral link
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                readOnly
                value={referralLink}
                onClick={(e) => e.target.select()}
                style={{ flex: 1, minWidth: 0, boxSizing: "border-box", background: PANEL_2, border: `1px solid ${LINE}`, borderRadius: 8, padding: "9px 12px", color: CREAM, fontSize: 13, outline: "none" }}
              />
              <button
                onClick={handleCopy}
                style={{ display: "flex", alignItems: "center", gap: 6, background: copied ? GOLD : "none", color: copied ? "#FFFFFF" : GOLD, border: `1px solid ${GOLD}`, borderRadius: 8, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div style={{ background: PANEL, border: `1px solid ${stats.connect_onboarded ? "rgba(34,197,94,0.4)" : LINE}`, borderRadius: 14, padding: 20, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Landmark size={18} color={stats.connect_onboarded ? "#22C55E" : MUTED} />
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: CREAM, margin: "0 0 2px" }}>
                  {stats.connect_onboarded ? "Bank account connected" : "Bank account not connected"}
                </p>
                <p style={{ fontSize: 11.5, color: MUTED, margin: 0 }}>
                  {stats.connect_onboarded
                    ? "Payouts go straight to your bank via Stripe."
                    : "Connect your bank so payouts can be sent automatically."}
                </p>
              </div>
            </div>
            {!stats.connect_onboarded && (
              <button
                onClick={handleConnectBank}
                disabled={connectLoading}
                style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: connectLoading ? "default" : "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                {connectLoading ? "Opening…" : stats.has_connect_account ? "Finish Setup" : "Connect Bank Account"}
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 140px", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 4px" }}>Referred</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: CREAM, margin: 0 }}>{stats.total_referred}</p>
            </div>
            <div style={{ flex: "1 1 140px", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 4px" }}>Total earned</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: CREAM, margin: 0 }}>{formatCents(stats.total_earned_cents)}</p>
            </div>
            <div style={{ flex: "1 1 140px", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 4px" }}>Pending payout</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: GOLD, margin: 0 }}>{formatCents(stats.pending_cents)}</p>
            </div>
          </div>

          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: MUTED, margin: "0 0 10px" }}>
            Your referrals
          </p>
          {stats.referrals.length === 0 ? (
            <p style={{ fontSize: 13.5, color: MUTED }}>Nobody's signed up through your link yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.referrals.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 10, padding: "10px 14px" }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: CREAM, margin: "0 0 2px" }}>{r.username}</p>
                    <p style={{ fontSize: 11.5, color: MUTED, margin: 0 }}>
                      {r.is_subscribed ? "Subscribed" : "Not subscribed"} · {r.months_commissioned}/3 payments commissioned
                    </p>
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: GOLD }}>{formatCents(r.earned_cents)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

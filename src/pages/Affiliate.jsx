import React, { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useTheme } from "../hooks/ThemeContext";
import { supabase } from "../lib/supabaseClient";
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

  return (
    <div style={{ padding: "24px 24px 60px", maxWidth: 640, margin: "0 auto" }}>
      <BackButton />

      <h1 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 24, color: CREAM, margin: "0 0 6px" }}>
        Affiliate Program
      </h1>
      <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 22px" }}>
        Earn 20% of the subscription price for every month someone you refer stays subscribed to Unlimited, up to 3
        months per person.
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
                      {r.is_subscribed ? "Subscribed" : "Not subscribed"} · {r.months_commissioned}/3 months commissioned
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

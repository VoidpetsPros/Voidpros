import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { PANEL, LINE, CREAM, MUTED, GOLD } from "../lib/theme";

export default function BillingSuccess() {
  const { profile, refreshProfile } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // The webhook usually lands within a second or two, but isn't
    // guaranteed to beat this redirect — poll briefly so the page reflects
    // reality instead of telling someone "you're subscribed" too early.
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      await refreshProfile();
      if (attempts >= 6) {
        clearInterval(interval);
        setChecking(false);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (profile?.is_subscribed) setChecking(false);
  }, [profile?.is_subscribed]);

  return (
    <div style={{ padding: "60px 24px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: "32px 24px" }}>
        <Sparkles size={22} color={GOLD} style={{ marginBottom: 10 }} />
        {profile?.is_subscribed ? (
          <>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 20, color: CREAM, margin: "0 0 8px" }}>You're subscribed!</p>
            <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 20px", lineHeight: 1.6 }}>
              Unlimited lookups and requests are unlocked now.
            </p>
          </>
        ) : checking ? (
          <>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 20, color: CREAM, margin: "0 0 8px" }}>Confirming your payment…</p>
            <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 20px", lineHeight: 1.6 }}>
              This usually takes just a moment.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 20, color: CREAM, margin: "0 0 8px" }}>Almost there</p>
            <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 20px", lineHeight: 1.6 }}>
              Payment received — if this doesn't update in a minute, refresh the page.
            </p>
          </>
        )}
        <Link to="/" style={{ display: "inline-block", background: GOLD, color: "#FFFFFF", borderRadius: 9, padding: "10px 20px", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}>
          Back to voidpros
        </Link>
      </div>
    </div>
  );
}

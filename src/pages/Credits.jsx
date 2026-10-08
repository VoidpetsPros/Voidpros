import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/AuthContext";
import { useTheme } from "../hooks/ThemeContext";
import { supabase } from "../lib/supabaseClient";
import BackButton from "../components/BackButton";

export default function Credits({ onRequireAuth }) {
  const { isAuthed, profile } = useAuth();
  const { PANEL, LINE, CREAM, MUTED, GOLD } = useTheme();
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
        <p style={{ color: MUTED, fontSize: 14 }}>Sign in to view your credits.</p>
      </div>
    );
  }

  const rows = [
    { label: "Item Search Credits", value: myCredits?.item_search_credits },
    { label: "Request Credits", value: myCredits?.request_credits },
    { label: "Suggested Build Credits", value: myCredits?.suggested_build_credits },
  ];

  return (
    <div style={{ padding: "24px 24px 60px", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <BackButton style={{ marginBottom: 0 }} />
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 22, color: CREAM, margin: 0 }}>
          Credits
        </h1>
      </div>

      <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: "4px 18px" }}>
        {rows.map((r, i) => (
          <div
            key={r.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "16px 0",
              borderBottom: i < rows.length - 1 ? `1px solid ${LINE}` : "none",
            }}
          >
            <span style={{ fontSize: 14, color: CREAM, fontWeight: 600 }}>{r.label}</span>
            <span style={{ fontSize: 15, color: profile?.is_subscribed ? GOLD : CREAM, fontWeight: 700 }}>
              {profile?.is_subscribed ? "Unlimited" : r.value ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

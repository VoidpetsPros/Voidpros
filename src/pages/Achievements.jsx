import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Trophy, Check } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useTheme } from "../hooks/ThemeContext";
import { supabase } from "../lib/supabaseClient";
import BackButton from "../components/BackButton";
import CosmeticAvatar from "../components/CosmeticAvatar";

const CATEGORY_LABELS = {
  completions: "Completions",
  challenges: "Challenges",
  searches: "Searches",
};

const CATEGORY_CREDIT_LABELS = {
  completions: "an Item Search Credit",
  challenges: "a Request Credit",
  searches: "a Suggested Build Credit",
};

function ProgressRow({ achievement }) {
  const { PANEL, PANEL_2, LINE, CREAM, MUTED } = useTheme();
  // achievement is null only if every tier in this category is unlocked —
  // there's nothing further to work toward.
  const pct = achievement ? Math.min(100, Math.round((achievement.current_progress / achievement.threshold) * 100)) : 100;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: PANEL_2,
          border: `1px solid ${LINE}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {achievement?.image_url ? (
          <img src={achievement.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Trophy size={18} color={MUTED} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: CREAM, margin: "0 0 5px" }}>
          {achievement ? achievement.name : "All tiers unlocked"}
        </p>
        <div style={{ height: 6, borderRadius: 999, background: PANEL_2, overflow: "hidden", marginBottom: 4 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#8B5CF6", borderRadius: 999 }} />
        </div>
        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
          {achievement ? `${Math.min(achievement.current_progress, achievement.threshold)} / ${achievement.threshold}` : "Max tier reached"}
        </p>
      </div>
    </div>
  );
}

function CosmeticOption({ achievement, isEquipped, onEquip, busy }) {
  const { PANEL, PANEL_2, LINE, CREAM, GOLD } = useTheme();
  return (
    <button
      onClick={() => onEquip(isEquipped ? null : achievement.id)}
      disabled={busy}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        background: isEquipped ? "rgba(139,92,246,0.08)" : PANEL,
        border: `1.5px solid ${isEquipped ? GOLD : LINE}`,
        borderRadius: 12,
        padding: "14px 10px",
        cursor: busy ? "default" : "pointer",
      }}
    >
      <div style={{ position: "relative" }}>
        <img src={achievement.image_url} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", background: PANEL_2 }} />
        {isEquipped && (
          <span style={{ position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${PANEL}` }}>
            <Check size={10} color="#FFFFFF" />
          </span>
        )}
      </div>
      <span style={{ fontSize: 11.5, color: CREAM, textAlign: "center", lineHeight: 1.3 }}>{achievement.name}</span>
    </button>
  );
}

export default function Achievements({ onRequireAuth }) {
  const { isAuthed, profile, refreshProfile } = useAuth();
  const { CREAM, MUTED, LINE, PANEL, PANEL_2, GOLD } = useTheme();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState(searchParams.get("tab") === "cosmetics" ? "cosmetics" : "progress");
  const [achievements, setAchievements] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    const { data, error: fetchError } = await supabase.rpc("get_my_achievements");
    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setAchievements(data || []);
  };

  useEffect(() => {
    if (isAuthed) load();
  }, [isAuthed]);

  if (!isAuthed) {
    onRequireAuth();
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Sign in to view your achievements.</p>
      </div>
    );
  }

  const handleEquip = async (achievementId) => {
    setBusyId(achievementId || "none");
    const { error: rpcError } = await supabase.rpc("equip_achievement_cosmetic", { p_achievement_id: achievementId });
    setBusyId(null);
    if (rpcError) {
      alert(rpcError.message);
      return;
    }
    await refreshProfile();
  };

  // The one achievement to show per category: the lowest-threshold tier
  // not yet unlocked. If every tier in a category is unlocked, there's
  // nothing left to show progress toward.
  const currentTargets =
    achievements &&
    ["completions", "challenges", "searches"].map((category) => {
      const rows = achievements.filter((a) => a.category === category).sort((a, b) => a.threshold - b.threshold);
      return { category, achievement: rows.find((a) => !a.unlocked) || null };
    });

  const unlockedCosmetics = achievements ? achievements.filter((a) => a.unlocked && a.image_url) : [];

  return (
    <div style={{ padding: "24px 24px 60px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <BackButton style={{ marginBottom: 0 }} />
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 22, color: CREAM, margin: 0 }}>
          Achievements
        </h1>
        <CosmeticAvatar url={profile?.equipped_achievement?.image_url} size={28} />
      </div>

      <div style={{ display: "flex", gap: 4, background: PANEL_2, borderRadius: 10, padding: 4, marginBottom: 22, width: "fit-content" }}>
        {[
          { id: "progress", label: "Progress" },
          { id: "cosmetics", label: "Cosmetics" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            style={{
              border: "none",
              background: view === t.id ? PANEL : "transparent",
              color: view === t.id ? CREAM : MUTED,
              fontSize: 12.5,
              fontWeight: view === t.id ? 600 : 500,
              padding: "8px 14px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p style={{ fontSize: 12.5, color: "#F87171", marginBottom: 16 }}>{error}</p>}
      {!error && achievements === null && <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>}

      {achievements && view === "progress" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {currentTargets.map(({ category, achievement }) => (
            <div key={category}>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: MUTED, margin: "0 0 4px" }}>
                {CATEGORY_LABELS[category]}
              </p>
              <p style={{ fontSize: 11.5, color: MUTED, margin: "0 0 8px" }}>
                Each tier unlocked earns you {CATEGORY_CREDIT_LABELS[category]}.
              </p>
              <ProgressRow achievement={achievement} />
            </div>
          ))}
        </div>
      )}

      {achievements && view === "cosmetics" && (
        <>
          {unlockedCosmetics.length === 0 ? (
            <p style={{ fontSize: 13.5, color: MUTED }}>
              No cosmetics unlocked yet — earn your first achievement to get one.
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 10 }}>
              {unlockedCosmetics.map((a) => (
                <CosmeticOption
                  key={a.id}
                  achievement={a}
                  isEquipped={profile?.equipped_achievement_id === a.id}
                  onEquip={handleEquip}
                  busy={busyId === a.id || busyId === "none"}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

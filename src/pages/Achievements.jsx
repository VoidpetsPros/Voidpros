import React, { useState, useEffect } from "react";
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

function AchievementCard({ achievement, equipped, onEquip, busy }) {
  const { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD } = useTheme();
  const isEquipped = equipped === achievement.id;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: achievement.unlocked ? PANEL : PANEL_2,
        border: `1px solid ${isEquipped ? GOLD : LINE}`,
        borderRadius: 12,
        padding: 14,
        opacity: achievement.unlocked ? 1 : 0.55,
      }}
    >
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
        {achievement.image_url ? (
          <img src={achievement.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Trophy size={18} color={MUTED} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: CREAM, margin: "0 0 3px" }}>{achievement.name}</p>
        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
          {achievement.unlocked
            ? "Unlocked"
            : `${Math.min(achievement.current_progress, achievement.threshold)} / ${achievement.threshold}`}
        </p>
      </div>

      {achievement.unlocked && achievement.image_url && (
        <button
          onClick={() => onEquip(isEquipped ? null : achievement.id)}
          disabled={busy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: isEquipped ? GOLD : "none",
            border: `1px solid ${GOLD}`,
            color: isEquipped ? "#FFFFFF" : GOLD,
            borderRadius: 8,
            padding: "7px 12px",
            fontSize: 12,
            fontWeight: 600,
            cursor: busy ? "default" : "pointer",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {isEquipped && <Check size={12} />}
          {isEquipped ? "Equipped" : "Equip"}
        </button>
      )}
    </div>
  );
}

export default function Achievements({ onRequireAuth }) {
  const { isAuthed, profile, refreshProfile } = useAuth();
  const { CREAM, MUTED, LINE } = useTheme();
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

  return (
    <div style={{ padding: "24px 24px 60px", maxWidth: 640, margin: "0 auto" }}>
      <BackButton />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 24, color: CREAM, margin: 0 }}>
          Achievements
        </h1>
        <CosmeticAvatar url={profile?.equipped_achievement?.image_url} size={28} />
      </div>
      <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 22px" }}>
        Earn cosmetics by submitting Completions and Challenges, and by searching floors. Equip one to show it next to
        your name on builds and comments.
      </p>

      {error && <p style={{ fontSize: 12.5, color: "#F87171", marginBottom: 16 }}>{error}</p>}
      {!error && achievements === null && <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>}

      {achievements &&
        ["completions", "challenges", "searches"].map((category) => {
          const rows = achievements.filter((a) => a.category === category);
          if (rows.length === 0) return null;
          return (
            <div key={category} style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: MUTED, margin: "0 0 10px", paddingBottom: 8, borderBottom: `1px solid ${LINE}` }}>
                {CATEGORY_LABELS[category]}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {rows.map((a) => (
                  <AchievementCard
                    key={a.id}
                    achievement={a}
                    equipped={profile?.equipped_achievement_id}
                    onEquip={handleEquip}
                    busy={busyId === a.id || busyId === "none"}
                  />
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}

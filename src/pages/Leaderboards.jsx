import React, { useState, useEffect } from "react";
import { Trophy, Swords, User } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { useTheme } from "../hooks/ThemeContext";
import BackButton from "../components/BackButton";

const CATEGORIES = [
  { id: "completions", label: "Completions", icon: Trophy },
  { id: "challenges", label: "Challenges", icon: Swords },
];

const RANGES = [
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "This Month" },
  { id: "all", label: "All Time" },
];

function Avatar({ url, size = 28 }) {
  const { PANEL_2, MUTED } = useTheme();
  if (url) {
    return <img src={url} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: PANEL_2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <User size={size * 0.55} color={MUTED} />
    </div>
  );
}

export default function Leaderboards() {
  const { isAuthed, profile } = useAuth();
  const { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD, DANGER } = useTheme();
  const [category, setCategory] = useState("completions");
  const [range, setRange] = useState("30d");
  const [top, setTop] = useState([]);
  const [myRank, setMyRank] = useState(null); // { rnk, submission_count } | null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const load = async () => {
      const { data: topData, error: topError } = await supabase.rpc("get_leaderboard_top", {
        p_category: category,
        p_range: range,
        p_limit: 10,
      });
      if (cancelled) return;
      if (topError) {
        setError(topError.message);
        setLoading(false);
        return;
      }
      setTop(topData || []);

      if (isAuthed) {
        const { data: rankData, error: rankError } = await supabase.rpc("get_my_leaderboard_rank", {
          p_category: category,
          p_range: range,
        });
        if (cancelled) return;
        if (!rankError && rankData && rankData.length > 0) {
          setMyRank(rankData[0]);
        } else {
          setMyRank(null);
        }
      } else {
        setMyRank(null);
      }
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [category, range, isAuthed]);

  // Skip the separate "your rank" row if the viewer is already visible
  // in the top 10 above — no need to repeat it.
  const showMyRankRow = isAuthed && (!myRank || myRank.rnk > top.length || myRank.rnk > 10);

  return (
    <div style={{ padding: "24px 24px 60px", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <BackButton style={{ marginBottom: 0 }} />
        <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 22, color: CREAM, margin: 0 }}>
          Leaderboards
        </p>
      </div>

      <div style={{ display: "flex", gap: 4, background: PANEL_2, borderRadius: 10, padding: 4, marginBottom: 20, width: "fit-content" }}>
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: "none",
                cursor: "pointer",
                fontSize: 12.5,
                fontWeight: category === c.id ? 600 : 500,
                color: category === c.id ? "#FFFFFF" : MUTED,
                background: category === c.id ? GOLD : "transparent",
                padding: "8px 14px",
                borderRadius: 7,
              }}
            >
              <Icon size={13} />
              {c.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p style={{ color: MUTED, fontSize: 13.5 }}>Loading…</p>
      ) : error ? (
        <p style={{ color: DANGER, fontSize: 13.5 }}>{error}</p>
      ) : (
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden" }}>
          {top.length === 0 && (
            <p style={{ color: MUTED, fontSize: 13.5, padding: "20px 16px", margin: 0 }}>
              Nobody's posted a verified {category === "completions" ? "completion" : "challenge"} in this range yet.
            </p>
          )}
          {top.map((row, i) => (
            <LeaderboardRow
              key={row.user_id}
              avatarUrl={row.cosmetic_url}
              name={row.username || "Unknown"}
              count={row.submission_count}
              isLast={i === top.length - 1 && !showMyRankRow}
              theme={{ LINE, CREAM, MUTED }}
            />
          ))}

          {showMyRankRow && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: PANEL_2,
                borderTop: top.length > 0 ? `1px solid ${LINE}` : "none",
              }}
            >
              <Avatar url={profile?.equipped_achievement?.image_url} />
              <span style={{ flex: 1, fontSize: 13.5, color: CREAM, fontWeight: 600 }}>You</span>
              <span style={{ fontSize: 12.5, color: MUTED }}>
                {myRank ? `${myRank.submission_count} in this range` : "0 in this range"}
              </span>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 4, background: PANEL_2, borderRadius: 10, padding: 4, marginTop: 20, width: "fit-content", flexWrap: "wrap" }}>
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            style={{
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: range === r.id ? 600 : 500,
              color: range === r.id ? CREAM : MUTED,
              background: range === r.id ? PANEL : "transparent",
              padding: "7px 12px",
              borderRadius: 6,
            }}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function LeaderboardRow({ avatarUrl, name, count, isLast, theme }) {
  const { LINE, CREAM, MUTED } = theme;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderBottom: isLast ? "none" : `1px solid ${LINE}`,
      }}
    >
      <Avatar url={avatarUrl} />
      <span style={{ flex: 1, fontSize: 13.5, color: CREAM, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
      <span style={{ fontSize: 12.5, color: MUTED, flexShrink: 0 }}>{count}</span>
    </div>
  );
}

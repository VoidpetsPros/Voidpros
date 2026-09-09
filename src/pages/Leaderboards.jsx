import React, { useState, useEffect } from "react";
import { Trophy, Swords, Award } from "lucide-react";
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

export default function Leaderboards() {
  const { isAuthed } = useAuth();
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
      <BackButton />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Trophy size={17} color={GOLD} />
        </div>
        <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 24, color: CREAM, margin: 0 }}>Leaderboards</p>
      </div>
      <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 18px", lineHeight: 1.6 }}>
        Top verified Completions and Challenges.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(232,179,61,0.1)", border: `1px solid ${GOLD}`, borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
        <Award size={16} color={GOLD} style={{ flexShrink: 0 }} />
        <p style={{ fontSize: 12.5, color: CREAM, margin: 0, lineHeight: 1.5 }}>
          The top 3 in each category every month get <strong>1 month of Unlimited</strong>, free.
        </p>
      </div>

      <div style={{ display: "flex", gap: 4, background: PANEL_2, borderRadius: 10, padding: 4, marginBottom: 12, width: "fit-content" }}>
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

      <div style={{ display: "flex", gap: 4, background: PANEL_2, borderRadius: 10, padding: 4, marginBottom: 20, width: "fit-content", flexWrap: "wrap" }}>
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
              rank={row.rnk}
              name={row.username || "Unknown"}
              count={row.submission_count}
              isLast={i === top.length - 1 && !showMyRankRow}
              theme={{ LINE, CREAM, MUTED, GOLD }}
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
              <div style={{ width: 26, textAlign: "center", fontSize: 13, fontWeight: 700, color: GOLD, flexShrink: 0 }}>
                {myRank ? `#${myRank.rnk}` : "N/A"}
              </div>
              <span style={{ flex: 1, fontSize: 13.5, color: CREAM, fontWeight: 600 }}>You</span>
              <span style={{ fontSize: 12.5, color: MUTED }}>
                {myRank ? `${myRank.submission_count} in this range` : "0 in this range"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LeaderboardRow({ rank, name, count, isLast, theme }) {
  const { LINE, CREAM, MUTED, GOLD } = theme;
  const medal = rank === 1 ? "#E8B33D" : rank === 2 ? "#C7CDD6" : rank === 3 ? "#C88A4A" : null;
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
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: medal ? `${medal}22` : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12.5,
          fontWeight: 700,
          color: medal || MUTED,
          flexShrink: 0,
        }}
      >
        {rank}
      </div>
      <span style={{ flex: 1, fontSize: 13.5, color: CREAM, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
      <span style={{ fontSize: 12.5, color: MUTED, flexShrink: 0 }}>{count}</span>
    </div>
  );
}

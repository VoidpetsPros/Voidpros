import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layers, Search, ArrowRight, Trophy, Swords } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useTheme } from "../hooks/ThemeContext";

const SUBMISSION_WAYS = [
  {
    icon: Trophy,
    title: "Completions",
    body: "Submit the team you used to beat any floor.",
    to: "/submit",
  },
  {
    icon: Swords,
    title: "Challenges",
    body: "Beat a floor using a limited pet & item pool.",
    to: "/fulfill",
  },
];

export default function Home({ onRequireAuth }) {
  const { isAuthed } = useAuth();
  const { GOLD, MUTED, CREAM, PANEL, LINE } = useTheme();
  const navigate = useNavigate();

  const goCollection = () => navigate("/collection");
  const goSearch = () => navigate("/search");

  return (
    <div>
      {/* Hero */}
      <div style={{ padding: "48px 28px 8px", maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 32, lineHeight: 1.25, letterSpacing: -0.4, color: CREAM, margin: "0 0 14px" }}>
          Stuck on a floor? Find a solution now
        </h1>
        <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.6, margin: "0 0 8px" }}>
          Match your existing collection on Voidpets, then search the floor you're stuck on for solutions matching your build & items.
        </p>
      </div>

      {/* Two-step guide: this is the actual point of the page — get your
          collection set up, then search. The buttons live right inside the
          steps that explain them. */}
      <div style={{ maxWidth: 720, margin: "32px auto 0", padding: "0 24px", display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 14, padding: 22, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: 999, background: GOLD, color: "#FFFFFF", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              1
            </div>
            <Layers size={17} color={GOLD} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: CREAM, margin: "0 0 6px" }}>Build your collection</p>
          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, margin: "0 0 18px" }}>
            Mark every pet and item you actually own.
          </p>
          <button
            onClick={goCollection}
            style={{ width: "100%", background: PANEL, color: CREAM, border: `1.5px solid ${GOLD}`, borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Go to Collection
          </button>
        </div>

        <div style={{ flex: "1 1 260px", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 14, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: 999, background: GOLD, color: "#FFFFFF", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              2
            </div>
            <Search size={17} color={GOLD} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: CREAM, margin: "0 0 6px" }}>Search a floor</p>
          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, margin: "0 0 18px" }}>
            Search a floor and we'll only show you solutions matching what you have.
          </p>
          <button
            onClick={goSearch}
            style={{ width: "100%", background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Go to Floor Search
          </button>
        </div>
      </div>

      {/* Ways to submit — ties directly into the Submissions menu, and
          into the Leaderboards that now track them instead of karma. */}
      {isAuthed && (
        <div style={{ maxWidth: 720, margin: "36px auto 0", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: MUTED, margin: 0 }}>
              Submit a build
            </p>
            <span style={{ color: MUTED }}>·</span>
            <Link to="/leaderboards" style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: GOLD, textDecoration: "none" }}>
              See Leaderboards
            </Link>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {SUBMISSION_WAYS.map((k) => {
              const Icon = k.icon;
              return (
                <Link
                  key={k.title}
                  to={k.to}
                  style={{
                    flex: "1 1 220px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "rgba(124,58,237,0.06)",
                    border: "1px solid rgba(124,58,237,0.25)",
                    borderRadius: 12,
                    padding: 16,
                    textDecoration: "none",
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(124,58,237,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={17} color={GOLD} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: CREAM, margin: "0 0 2px" }}>{k.title}</p>
                    <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.4 }}>{k.body}</p>
                  </div>
                  <ArrowRight size={13} color={GOLD} style={{ flexShrink: 0 }} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ paddingBottom: 48 }} />
    </div>
  );
}

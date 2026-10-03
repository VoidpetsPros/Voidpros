import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useTheme } from "../hooks/ThemeContext";
import { supabase } from "../lib/supabaseClient";
import BackButton from "../components/BackButton";
import useIsMobile from "../hooks/useIsMobile";

// Shown until real search data exists (or if the fetch fails) — once floors
// have actual search history, FALLBACK_POPULAR_FLOORS is never used.
const FALLBACK_POPULAR_FLOORS = [12, 24, 33, 47, 58, 61, 75];

export default function Search({ onRequireAuth }) {
  const [floor, setFloor] = useState("");
  const [popularFloors, setPopularFloors] = useState(FALLBACK_POPULAR_FLOORS);
  const { isAuthed } = useAuth();
  const isMobile = useIsMobile();
  const visiblePopularFloors = isMobile ? popularFloors.slice(0, 4) : popularFloors;
  const { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    supabase.rpc("get_popular_floors", { p_limit: 7 }).then(({ data, error }) => {
      if (error || !isMounted || !data || data.length === 0) return;
      setPopularFloors(data.map((row) => row.stage));
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const goToResults = (f) => {
    const n = parseInt(f, 10);
    if (isNaN(n) || n <= 0) return;
    if (!isAuthed) {
      onRequireAuth();
      return;
    }
    navigate(`/results/${n}`);
  };

  return (
    <div style={{ padding: "24px 24px 100px", maxWidth: 580, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <BackButton style={{ marginBottom: 0 }} />
        <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 22, color: CREAM, margin: 0 }}>
          Floor Search
        </p>
      </div>

      <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, padding: 22 }}>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <SearchIcon size={16} color={MUTED} style={{ position: "absolute", left: 14, top: 15 }} />
          <input
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goToResults(floor)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Enter floor number, e.g. 47"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: PANEL_2,
              border: `1px solid ${LINE}`,
              borderRadius: 11,
              padding: "13px 14px 13px 40px",
              color: CREAM,
              fontSize: 16,
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", flexWrap: isMobile ? "nowrap" : "wrap", alignItems: "center", gap: 6, marginBottom: 20, overflow: isMobile ? "hidden" : "visible" }}>
          <span style={{ fontSize: 12, color: MUTED, marginRight: 2, flexShrink: 0 }}>Popular:</span>
          {visiblePopularFloors.map((f) => (
            <button
              key={f}
              onClick={() => goToResults(f)}
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                padding: "5px 11px",
                borderRadius: 999,
                border: "1px solid rgba(124,58,237,0.25)",
                background: "rgba(124,58,237,0.06)",
                color: GOLD,
                cursor: "pointer",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={() => goToResults(floor)}
          disabled={!floor}
          style={{
            width: "100%",
            background: GOLD,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 11,
            padding: "14px 0",
            fontSize: 15,
            fontWeight: 600,
            cursor: floor ? "pointer" : "not-allowed",
          }}
        >
          {floor ? `Find solutions for floor ${floor}` : "Enter a floor to continue"}
        </button>
      </div>
    </div>
  );
}

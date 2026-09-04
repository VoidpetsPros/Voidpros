import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft, Compass } from "lucide-react";
import { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD } from "../lib/theme";

const POPULAR_FLOORS = [12, 24, 33, 47, 58, 61, 75];

export default function Search() {
  const [floor, setFloor] = useState("");
  const navigate = useNavigate();

  const goToResults = (f) => {
    const n = parseInt(f, 10);
    if (!isNaN(n) && n > 0) navigate(`/results/${n}`);
  };

  return (
    <div style={{ padding: "24px 24px 100px", maxWidth: 580, margin: "0 auto" }}>
      <button
        onClick={() => navigate("/")}
        style={{ background: "none", border: "none", color: MUTED, fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: 0, marginBottom: 20 }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Compass size={17} color={GOLD} />
        </div>
        <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 24, color: CREAM, margin: 0 }}>
          Which floor are you stuck on?
        </p>
      </div>
      <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 24px", lineHeight: 1.6 }}>
        We'll check it against builds other players have actually cleared it with —
        and match them to pets and items you already own.
      </p>

      <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, padding: 22 }}>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <SearchIcon size={16} color={MUTED} style={{ position: "absolute", left: 14, top: 15 }} />
          <input
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goToResults(floor)}
            type="number"
            min="1"
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

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: MUTED, marginRight: 2 }}>Popular:</span>
          {POPULAR_FLOORS.map((f) => (
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

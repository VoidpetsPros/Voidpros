import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft } from "lucide-react";
import { PANEL, LINE, CREAM, MUTED, GOLD } from "../lib/theme";

const POPULAR_FLOORS = [12, 24, 33, 47, 58, 61, 75];

export default function Search() {
  const [floor, setFloor] = useState("");
  const navigate = useNavigate();

  const goToResults = (f) => {
    const n = parseInt(f, 10);
    if (!isNaN(n) && n > 0) navigate(`/results/${n}`);
  };

  return (
    <div style={{ padding: "24px 24px 100px", maxWidth: 560, margin: "0 auto" }}>
      <button
        onClick={() => navigate("/")}
        style={{ background: "none", border: "none", color: MUTED, fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: 0, marginBottom: 20 }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <p style={{ fontFamily: "Georgia, serif", fontSize: 24, color: CREAM, margin: "0 0 8px" }}>
        Which floor are you stuck on?
      </p>
      <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 24px", lineHeight: 1.6 }}>
        We'll check it against builds other players have actually cleared it with —
        and match them to pets and items you already own.
      </p>

      <div style={{ position: "relative", marginBottom: 12 }}>
        <SearchIcon size={15} color={MUTED} style={{ position: "absolute", left: 12, top: 13 }} />
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
            background: PANEL,
            border: `1px solid ${LINE}`,
            borderRadius: 10,
            padding: "12px 12px 12px 36px",
            color: CREAM,
            fontSize: 16,
            outline: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 28 }}>
        <span style={{ fontSize: 12, color: MUTED, marginRight: 2, alignSelf: "center" }}>Popular:</span>
        {POPULAR_FLOORS.map((f) => (
          <button
            key={f}
            onClick={() => goToResults(f)}
            style={{
              fontSize: 12.5,
              padding: "5px 10px",
              borderRadius: 7,
              border: `1px solid ${LINE}`,
              background: PANEL,
              color: MUTED,
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
          background: floor ? GOLD : PANEL,
          color: floor ? "#FFFFFF" : MUTED,
          border: floor ? "none" : `1px solid ${LINE}`,
          borderRadius: 10,
          padding: "14px 0",
          fontSize: 15,
          fontWeight: 600,
          cursor: floor ? "pointer" : "not-allowed",
        }}
      >
        {floor ? `Find solutions for floor ${floor}` : "Enter a floor to continue"}
      </button>
    </div>
  );
}

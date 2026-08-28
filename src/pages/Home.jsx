import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { GOLD, MUTED, CREAM } from "../lib/theme";

export default function Home({ onRequireAuth }) {
  const { isAuthed, profile } = useAuth();
  const navigate = useNavigate();

  const handleStart = () => {
    if (!isAuthed) {
      onRequireAuth();
      return;
    }
    navigate("/search");
  };

  return (
    <div style={{ padding: "56px 28px 40px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      <p style={{ color: GOLD, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>
        stuck in the void?
      </p>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 34, lineHeight: 1.25, color: CREAM, margin: "0 0 16px" }}>
        Tell us your team. We'll find what beats the floor.
      </h1>
      <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.6, margin: "0 0 28px" }}>
        Search a floor and see which builds only use pets and items you actually own.
      </p>

      {!isAuthed && (
        <p style={{ color: MUTED, fontSize: 13, marginBottom: 20 }}>
          Sign in to start building your collection — pets and items you own,
          saved for real this time.
        </p>
      )}
      {isAuthed && (
        <p style={{ color: MUTED, fontSize: 13, marginBottom: 20 }}>
          Signed in as {profile?.username || "player"}. Try adding a few pets and items to your collection.
        </p>
      )}

      <button
        onClick={handleStart}
        style={{
          background: GOLD,
          color: "#FFFFFF",
          border: "none",
          borderRadius: 10,
          padding: "14px 28px",
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Sparkles size={15} /> Find my solution <ChevronRight size={16} />
      </button>

      {isAuthed && (
        <p style={{ marginTop: 16 }}>
          <button
            onClick={() => navigate("/collection")}
            style={{ background: "none", border: "none", color: MUTED, fontSize: 12.5, cursor: "pointer", textDecoration: "underline", padding: 0 }}
          >
            Or manage your collection first
          </button>
        </p>
      )}
    </div>
  );
}

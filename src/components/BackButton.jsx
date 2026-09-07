import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "../hooks/ThemeContext";

// Same look everywhere: used to live copy-pasted (with slightly different
// destinations) across Search/Results/Submit/Subscription/Settings/
// FulfillAttempt. Now a single component, always pointing home.
export default function BackButton({ style }) {
  const navigate = useNavigate();
  const { MUTED } = useTheme();
  return (
    <button
      onClick={() => navigate("/")}
      style={{
        background: "none",
        border: "none",
        color: MUTED,
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        padding: 0,
        marginBottom: 20,
        ...style,
      }}
    >
      <ArrowLeft size={14} /> Back
    </button>
  );
}

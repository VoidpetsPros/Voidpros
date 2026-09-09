import React, { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { useTheme } from "../hooks/ThemeContext";
import BackButton from "../components/BackButton";

const MAX_LENGTH = 250;

export default function Feedback({ onRequireAuth }) {
  const { isAuthed, user } = useAuth();
  const { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD, DANGER } = useTheme();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isAuthed) {
    onRequireAuth();
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Sign in to leave feedback.</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    setError("");
    const trimmed = message.trim();
    if (!trimmed) {
      setError("Enter some feedback first.");
      return;
    }
    setSubmitting(true);
    const { error: insertError } = await supabase.from("feedback").insert({ user_id: user.id, message: trimmed });
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <div style={{ padding: "24px 24px 80px", maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        <div style={{ background: PANEL, border: "1px solid rgba(139,92,246,0.35)", borderRadius: 16, padding: "32px 24px" }}>
          <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 20, color: CREAM, margin: "0 0 8px" }}>Thanks for the feedback</p>
          <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 20px", lineHeight: 1.6 }}>
            We read every note, even though we don't reply to them individually.
          </p>
          <button
            onClick={() => {
              setMessage("");
              setSuccess(false);
            }}
            style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 9, padding: "11px 22px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
          >
            Leave more feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 24px 80px", maxWidth: 560, margin: "0 auto" }}>
      <BackButton />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MessageSquare size={17} color={GOLD} />
        </div>
        <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 24, color: CREAM, margin: 0 }}>Feedback</p>
      </div>
      <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 20px", lineHeight: 1.6 }}>
        Bugs, ideas, or anything that could be better — let us know. Feedback doesn't get a
        reply, but we do read it and take it into consideration.
      </p>

      <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, padding: 20 }}>
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value.slice(0, MAX_LENGTH));
            if (error) setError("");
          }}
          placeholder="What's on your mind?"
          rows={5}
          style={{ width: "100%", boxSizing: "border-box", background: PANEL_2, border: `1px solid ${LINE}`, borderRadius: 9, padding: 12, color: CREAM, fontSize: 13.5, resize: "none", fontFamily: "inherit", marginBottom: 6 }}
        />
        <p style={{ fontSize: 11.5, color: message.length >= MAX_LENGTH ? DANGER : MUTED, margin: "0 0 14px", textAlign: "right" }}>
          {message.length} / {MAX_LENGTH}
        </p>

        {error && <p style={{ fontSize: 12.5, color: DANGER, margin: "0 0 12px", lineHeight: 1.5 }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{ width: "100%", background: submitting ? PANEL_2 : GOLD, color: submitting ? MUTED : "#FFFFFF", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 14.5, fontWeight: 600, cursor: submitting ? "default" : "pointer" }}
        >
          {submitting ? "Sending…" : "Send feedback"}
        </button>
      </div>
    </div>
  );
}

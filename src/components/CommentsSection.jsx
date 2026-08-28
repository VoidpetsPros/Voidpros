import React, { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { containsProfanity } from "../lib/profanity";
import { PANEL_2, LINE, CREAM, MUTED, GOLD, DANGER } from "../lib/theme";

export default function CommentsSection({ buildId, verified = true }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("comments")
      .select("id, body, show_author, created_at, author:profiles!user_id(username)")
      .eq("build_id", buildId)
      .order("created_at", { ascending: true });
    if (fetchError) {
      console.error(fetchError.message);
    } else {
      setComments(data || []);
    }
    setLoaded(true);
    setLoading(false);
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !loaded) load();
  };

  const submit = async () => {
    if (!text.trim()) return;
    if (containsProfanity(text)) {
      setError("That comment contains language we don't allow. Please rephrase.");
      return;
    }
    setPosting(true);
    const { error: insertError } = await supabase
      .from("comments")
      .insert({ build_id: buildId, user_id: user.id, body: text.trim(), show_author: true });
    setPosting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setText("");
    setError("");
    load();
  };

  return (
    <div style={{ marginTop: 12, borderTop: `1px solid ${LINE}`, paddingTop: 10 }}>
      <button
        onClick={toggle}
        style={{ background: "none", border: "none", color: MUTED, fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }}
      >
        <MessageCircle size={13} /> {loaded ? `${comments.length} comment${comments.length !== 1 ? "s" : ""}` : "Comments"}
      </button>
      {open && (
        <div style={{ marginTop: 10 }}>
          {loading && <p style={{ fontSize: 12.5, color: MUTED }}>Loading…</p>}
          {!loading &&
            comments.map((c) => (
              <div key={c.id} style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 12.5, color: CREAM, margin: "0 0 2px", fontWeight: 500 }}>
                  {c.show_author ? c.author?.username || "a player" : "Anonymous"}
                </p>
                <p style={{ fontSize: 12.5, color: MUTED, margin: 0, lineHeight: 1.5 }}>{c.body}</p>
              </div>
            ))}
          {!loading && comments.length === 0 && <p style={{ fontSize: 12.5, color: MUTED, marginBottom: 10 }}>No comments yet.</p>}

          {user && verified && (
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <input
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Add a comment..."
                style={{ flex: 1, background: PANEL_2, border: `1px solid ${LINE}`, borderRadius: 8, padding: "7px 10px", color: CREAM, fontSize: 12.5, outline: "none" }}
              />
              <button
                onClick={submit}
                disabled={posting}
                style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12.5, cursor: "pointer", flexShrink: 0 }}
              >
                Post
              </button>
            </div>
          )}
          {user && !verified && (
            <p style={{ fontSize: 12, color: MUTED, marginTop: 10, fontStyle: "italic" }}>
              Comments open once this build is verified.
            </p>
          )}
          {error && <p style={{ fontSize: 12, color: DANGER, margin: "6px 0 0" }}>{error}</p>}
        </div>
      )}
    </div>
  );
}

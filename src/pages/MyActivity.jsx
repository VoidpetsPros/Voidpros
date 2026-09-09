import React, { useEffect } from "react";
import { Users } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { useCollection } from "../hooks/useCollection";
import { useMyActivity } from "../hooks/useMyActivity";
import BuildCard from "../components/BuildCard";
import { useTheme } from "../hooks/ThemeContext";
import BackButton from "../components/BackButton";

export default function MyActivity({ onRequireAuth }) {
  const { isAuthed, user, loading: authLoading, markActivitySeen } = useAuth();
  const { PANEL, CREAM, MUTED, GOLD, VIOLET } = useTheme();
  const { pets, items, loading: catalogLoading } = useCatalog();
  const { ownedPets, ownedItems, loading: collectionLoading } = useCollection(user?.id);
  const { builds, loading: activityLoading, error } = useMyActivity(user?.id);

  useEffect(() => {
    if (isAuthed) markActivitySeen();
  }, [isAuthed]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthed) {
    onRequireAuth();
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Sign in to view your activity.</p>
      </div>
    );
  }

  if (authLoading || catalogLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 24px 60px", maxWidth: 640, margin: "0 auto" }}>
      <BackButton />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Users size={17} color={GOLD} />
        </div>
        <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 24, color: CREAM, margin: 0 }}>Community</p>
      </div>
      <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 24px" }}>
        Builds you've submitted or left a comment on, most recent first.
      </p>

      {error && (
        <div style={{ background: PANEL, border: "1px solid rgba(248,113,113,0.4)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 12.5, color: MUTED, fontFamily: "monospace", margin: 0 }}>{error}</p>
        </div>
      )}

      {activityLoading || collectionLoading ? (
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      ) : builds.length === 0 ? (
        <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 16, padding: "32px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 13.5, color: MUTED, margin: 0 }}>
            Nothing yet — submit a build or leave a comment and it'll show up here.
          </p>
        </div>
      ) : (
        builds.map((b) => (
          <div key={b.id} style={{ marginBottom: 6 }}>
            <span
              style={{
                display: "inline-block",
                fontSize: 10.5,
                fontWeight: 600,
                color: VIOLET,
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.2)",
                borderRadius: 999,
                padding: "3px 10px",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              {b._mine ? "Your submission" : "You commented on this"}
            </span>
            <BuildCard build={b} pets={pets} items={items} ownedPets={ownedPets} ownedItemCounts={ownedItems} fullMatch={true} />
          </div>
        ))
      )}
    </div>
  );
}

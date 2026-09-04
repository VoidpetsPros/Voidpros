import React from "react";
import { Link } from "react-router-dom";
import { Award } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { useCollection } from "../hooks/useCollection";
import { useMyActivity } from "../hooks/useMyActivity";
import BuildCard from "../components/BuildCard";
import { PANEL, LINE, CREAM, MUTED, GOLD, VIOLET } from "../lib/theme";

export default function MyActivity({ onRequireAuth }) {
  const { isAuthed, user, profile, loading: authLoading } = useAuth();
  const { pets, items, loading: catalogLoading } = useCatalog();
  const { ownedPets, ownedItems, loading: collectionLoading } = useCollection(user?.id);
  const { builds, loading: activityLoading, error } = useMyActivity(user?.id);

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

  if (!profile?.is_subscribed) {
    return (
      <div style={{ padding: "40px 24px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: "32px 24px" }}>
          <Award size={22} color={GOLD} style={{ marginBottom: 10 }} />
          <p style={{ fontFamily: "Georgia, serif", fontSize: 19, color: CREAM, margin: "0 0 8px" }}>Subscriber feature</p>
          <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 18px", lineHeight: 1.6 }}>
            My Activity — everything you've submitted or commented on, plus what people
            have said about it — is part of the paid tier.
          </p>
          <Link
            to="/search"
            style={{ display: "inline-block", background: GOLD, color: "#FFFFFF", borderRadius: 9, padding: "10px 20px", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}
          >
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 24px 60px", maxWidth: 640, margin: "0 auto" }}>
      <p style={{ fontFamily: "Georgia, serif", fontSize: 24, color: CREAM, margin: "0 0 8px" }}>My activity</p>
      <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 24px" }}>
        Builds you've submitted or left a comment on, most recent first.
      </p>

      {error && (
        <div style={{ background: PANEL, border: "1px solid rgba(248,113,113,0.4)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 12.5, color: MUTED, fontFamily: "monospace", margin: 0 }}>{error}</p>
        </div>
      )}

      {activityLoading || collectionLoading ? (
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      ) : builds.length === 0 ? (
        <div style={{ background: GOLD, borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 13.5, color: "#FFFFFF", margin: 0 }}>
            Nothing yet — submit a build or leave a comment and it'll show up here.
          </p>
        </div>
      ) : (
        builds.map((b) => (
          <div key={b.id} style={{ marginBottom: 6 }}>
            <p style={{ fontSize: 11, color: VIOLET, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 6px" }}>
              {b._mine ? "Your submission" : "You commented on this"}
            </p>
            <BuildCard build={b} pets={pets} items={items} ownedPets={ownedPets} ownedItemCounts={ownedItems} fullMatch={true} />
          </div>
        ))
      )}
    </div>
  );
}

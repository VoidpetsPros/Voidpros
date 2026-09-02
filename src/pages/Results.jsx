import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { useCollection } from "../hooks/useCollection";
import { useBuilds } from "../hooks/useBuilds";
import { supabase } from "../lib/supabaseClient";
import { startCheckout } from "../lib/billing";
import { buildFullyMatches } from "../lib/matching";
import BuildCard from "../components/BuildCard";
import { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD, VIOLET, DANGER } from "../lib/theme";

export default function Results({ onRequireAuth }) {
  const { stage } = useParams();
  const navigate = useNavigate();
  const { isAuthed, user, profile, consumeTrialLookup } = useAuth();
  const { pets, items, loading: catalogLoading } = useCatalog();
  const { ownedPets, ownedItems, loading: collectionLoading } = useCollection(user?.id);
  const { builds: rawBuilds, loading: buildsLoading, error: buildsError, refresh } = useBuilds(stage, user?.id);
  // Builds without team data yet are awaiting admin review — not usable in
  // search until that's added, so they're excluded here entirely rather
  // than showing up as a phantom "match" or empty alternative.
  const builds = useMemo(() => rawBuilds.filter((b) => b.team && b.team.length > 0), [rawBuilds]);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const lookupConsumed = useRef(false);

  useEffect(() => {
    if (!isAuthed) onRequireAuth();
  }, [isAuthed]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubscribe = async () => {
    setCheckoutError("");
    setCheckoutLoading(true);
    try {
      await startCheckout();
    } catch (err) {
      setCheckoutError(err.message || "Something went wrong starting checkout.");
      setCheckoutLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    setRequestError("");
    setRequestSubmitting(true);
    const { error } = await supabase.rpc("create_request", {
      p_stage: Number(stage),
      p_show_requester: true,
    });
    setRequestSubmitting(false);
    if (error) {
      setRequestError(error.message);
      return;
    }
    setRequestSent(true);
  };

  const handleConfirm = async (buildId) => {
    const { error } = await supabase.from("build_confirmations").insert({ build_id: buildId, user_id: user.id });
    if (error) {
      console.error(error.message);
      return;
    }
    refresh();
  };

  const handleVote = async (buildId, direction) => {
    const build = builds.find((b) => b.id === buildId);
    if (!build) return;
    let error;
    if (build.userVote === direction) {
      ({ error } = await supabase.from("build_votes").delete().eq("build_id", buildId).eq("user_id", user.id));
    } else if (build.userVote) {
      ({ error } = await supabase.from("build_votes").update({ direction }).eq("build_id", buildId).eq("user_id", user.id));
    } else {
      ({ error } = await supabase.from("build_votes").insert({ build_id: buildId, user_id: user.id, direction }));
    }
    if (error) {
      console.error(error.message);
      return;
    }
    refresh();
  };

  const matching = useMemo(
    () => builds.filter((b) => buildFullyMatches(b, ownedPets, ownedItems)),
    [builds, ownedPets, ownedItems]
  );
  const alternatives = useMemo(() => builds.filter((b) => !matching.includes(b)), [builds, matching]);

  const outOfLookups = profile && !profile.is_subscribed && profile.trial_lookups_used >= profile.trial_lookups_limit;
  const [alternativesBlocked, setAlternativesBlocked] = useState(false);
  const revealingAlternatives = useRef(false);

  const handleToggleAlternatives = async () => {
    if (showAlternatives) {
      // Hiding them again is always free — only the reveal costs a lookup.
      setShowAlternatives(false);
      return;
    }
    if (outOfLookups) {
      setAlternativesBlocked(true);
      return;
    }
    if (revealingAlternatives.current) return; // guard against a rapid double-click double-charging
    revealingAlternatives.current = true;
    await consumeTrialLookup();
    revealingAlternatives.current = false;
    setAlternativesBlocked(false);
    setShowAlternatives(true);
  };

  useEffect(() => {
    if (lookupConsumed.current) return;
    if (buildsLoading || collectionLoading) return;
    if (matching.length > 0 && !outOfLookups) {
      lookupConsumed.current = true;
      consumeTrialLookup();
    }
  }, [matching.length, buildsLoading, collectionLoading, outOfLookups]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthed) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Sign in to search floors.</p>
      </div>
    );
  }

  if (catalogLoading || collectionLoading || buildsLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Searching floor {stage}…</p>
      </div>
    );
  }

  if (buildsError) {
    return (
      <div style={{ padding: "24px", maxWidth: 640, margin: "0 auto" }}>
        <BackButton />
        <div style={{ background: PANEL, border: `1px solid rgba(179,69,59,0.4)`, borderRadius: 12, padding: "24px", textAlign: "center" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 17, color: CREAM, margin: "0 0 8px" }}>Something went wrong loading builds</p>
          <p style={{ fontSize: 12.5, color: MUTED, fontFamily: "monospace", margin: 0, wordBreak: "break-word" }}>{buildsError}</p>
        </div>
      </div>
    );
  }

  // Gate the reveal behind the subscription once free lookups are used up.
  if (matching.length > 0 && outOfLookups) {
    return (
      <div style={{ padding: "24px", maxWidth: 640, margin: "0 auto" }}>
        <BackButton />
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 20, color: CREAM, margin: "0 0 8px" }}>
            {matching.length} build{matching.length > 1 ? "s" : ""} found for floor {stage}
          </p>
          <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 18px" }}>
            You're out of free lookups ({profile.trial_lookups_used}/{profile.trial_lookups_limit} used).
            Subscribe for unlimited lookups.
          </p>
          <button
            onClick={handleSubscribe}
            disabled={checkoutLoading}
            style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 9, padding: "11px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            {checkoutLoading ? "Redirecting…" : "Subscribe — $4.99/mo"}
          </button>
          {checkoutError && <p style={{ fontSize: 12.5, color: DANGER, margin: "12px 0 0" }}>{checkoutError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 24px 60px", maxWidth: 640, margin: "0 auto" }}>
      <BackButton />

      <p style={{ fontFamily: "Georgia, serif", fontSize: 22, color: CREAM, margin: "0 0 4px" }}>Floor {stage}</p>
      <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 22px" }}>
        {matching.length > 0
          ? `${matching.length} build${matching.length > 1 ? "s" : ""} that only use what you have`
          : builds.length > 0
          ? "No build matches your exact team"
          : "No builds yet"}
      </p>

      {builds.length === 0 ? (
        <div style={{ background: PANEL, border: `1px dashed ${LINE}`, borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 18, color: CREAM, margin: "0 0 8px" }}>
            Nobody's cracked floor {stage} yet
          </p>
          <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 16px", lineHeight: 1.6 }}>
            This lookup didn't cost you a free search. Be the first to submit a build.
          </p>
          <Link
            to="/submit"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 9, padding: "10px 20px", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}
          >
            <Plus size={13} /> Submit a build
          </Link>
        </div>
      ) : matching.length === 0 ? (
        <div style={{ background: PANEL, border: `1px dashed ${LINE}`, borderRadius: 12, padding: "32px 24px", textAlign: "center", marginBottom: 20 }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 18, color: CREAM, margin: "0 0 8px" }}>
            No build matches what you have
          </p>
          <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 16px", lineHeight: 1.6 }}>
            Other builds exist for floor {stage}, but none of them only use pets and
            items from your <Link to="/collection" style={{ color: VIOLET }}>collection</Link>.
          </p>
          <button
            onClick={handleToggleAlternatives}
            style={{ background: "none", border: "none", color: VIOLET, fontSize: 13, cursor: "pointer", textDecoration: "underline", padding: 0 }}
          >
            {showAlternatives ? "Hide alternative builds" : `See ${alternatives.length} alternative build${alternatives.length > 1 ? "s" : ""}`}
          </button>
          {alternativesBlocked && (
            <p style={{ fontSize: 12.5, color: MUTED, margin: "10px 0 0", lineHeight: 1.5 }}>
              You're out of free lookups. Viewing alternative builds also uses a lookup,
              same as a full match.{" "}
              <button onClick={handleSubscribe} style={{ background: "none", border: "none", color: VIOLET, cursor: "pointer", padding: 0, fontSize: 12.5, textDecoration: "underline" }}>
                Subscribe for unlimited
              </button>
              .
            </p>
          )}
          {showAlternatives &&
            alternatives.map((b) => (
              <div key={b.id} style={{ marginTop: 16, textAlign: "left" }}>
                <BuildCard build={b} pets={pets} items={items} ownedPets={ownedPets} ownedItemCounts={ownedItems} fullMatch={false} onVote={handleVote} onConfirm={handleConfirm} />
              </div>
            ))}
        </div>
      ) : (
        matching.map((b) => (
          <BuildCard key={b.id} build={b} pets={pets} items={items} ownedPets={ownedPets} ownedItemCounts={ownedItems} fullMatch={true} onVote={handleVote} onConfirm={handleConfirm} />
        ))
      )}

      {/* Posting a request makes sense any time there's no exact match yet —
          whether nobody's submitted anything for this floor, or builds exist
          but none fit this player's exact collection. */}
      {matching.length === 0 && (
        <>
          {requestSent ? (
            <div style={{ background: PANEL, border: "1px solid rgba(139,92,246,0.35)", borderRadius: 12, padding: 20, marginTop: 20, textAlign: "center" }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 16, color: CREAM, margin: "0 0 6px" }}>Request posted</p>
              <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.6 }}>
                Other players can now attempt floor {stage} using only the pets and items
                you have. Check the{" "}
                <Link to="/fulfill" style={{ color: VIOLET }}>Fulfill requests</Link> tab for progress.
              </p>
            </div>
          ) : profile?.is_subscribed ? (
            <div style={{ background: PANEL_2, border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 16px", marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: MUTED }}>Want another player to build one for you instead?</span>
              <button
                onClick={handleSubmitRequest}
                disabled={requestSubmitting}
                style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
              >
                {requestSubmitting ? "Posting…" : "Submit a request"}
              </button>
            </div>
          ) : (
            <div style={{ background: PANEL_2, border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 16px", marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12.5, color: MUTED }}>
                Subscribers can post a request so other players attempt this floor using
                only your pets and items.
              </span>
              <button
                onClick={handleSubscribe}
                disabled={checkoutLoading}
                style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", flexShrink: 0, marginLeft: 12 }}
              >
                {checkoutLoading ? "Redirecting…" : "Subscribe"}
              </button>
            </div>
          )}
          {checkoutError && <p style={{ fontSize: 12.5, color: DANGER, margin: "10px 0 0" }}>{checkoutError}</p>}
          {requestError && <p style={{ fontSize: 12.5, color: DANGER, margin: "10px 0 0" }}>{requestError}</p>}
        </>
      )}

      {builds.length > 0 && (
        <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", background: PANEL_2, border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 16px" }}>
          <span style={{ fontSize: 13, color: MUTED }}>Beat this floor with something else?</span>
          <Link
            to="/submit"
            style={{ background: "none", border: `1px solid ${VIOLET}`, color: VIOLET, fontSize: 12.5, padding: "7px 12px", borderRadius: 7, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={13} /> Submit your build
          </Link>
        </div>
      )}
    </div>
  );
}

function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/search")}
      style={{ background: "none", border: "none", color: MUTED, fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: 0, marginBottom: 20 }}
    >
      <ArrowLeft size={14} /> Back
    </button>
  );
}

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { useCollection } from "../hooks/useCollection";
import { useBuilds } from "../hooks/useBuilds";
import { supabase } from "../lib/supabaseClient";
import { startCheckout } from "../lib/billing";
import { buildFullyMatches, missingCountForBuild } from "../lib/matching";
import { getDisplayLookupUsage } from "../lib/lookups";
import BuildCard from "../components/BuildCard";
import TrialCTA from "../components/TrialCTA";
import { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD, VIOLET, DANGER } from "../lib/theme";

export default function Results({ onRequireAuth }) {
  const { stage } = useParams();
  const navigate = useNavigate();
  const { isAuthed, user, profile, consumeTrialLookup } = useAuth();
  const { pets, items, loading: catalogLoading } = useCatalog();
  const { ownedPets, ownedItems, loading: collectionLoading } = useCollection(user?.id);
  const { builds: rawBuilds, loading: buildsLoading, error: buildsError, applyVoteLocally } = useBuilds(stage, user?.id);
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

  const handleVote = async (buildId) => {
    const build = builds.find((b) => b.id === buildId);
    if (!build) return;
    const currentlyUpvoted = build.userVote === "up";
    // Optimistic, instant — no refetch, so the list doesn't flash or lose scroll position.
    applyVoteLocally(buildId, !currentlyUpvoted);
    const { error } = currentlyUpvoted
      ? await supabase.from("build_votes").delete().eq("build_id", buildId).eq("user_id", user.id)
      : await supabase.from("build_votes").insert({ build_id: buildId, user_id: user.id, direction: "up" });
    if (error) {
      console.error(error.message);
      applyVoteLocally(buildId, currentlyUpvoted); // roll back on failure
    }
  };

  const matching = useMemo(
    () => builds.filter((b) => buildFullyMatches(b, ownedPets, ownedItems)),
    [builds, ownedPets, ownedItems]
  );
  const alternatives = useMemo(() => {
    const nonMatching = builds.filter((b) => !matching.includes(b));
    // Closest-to-working first — a build you're missing one thing from is
    // far easier to act on (swap a pet/item) than one missing several.
    return [...nonMatching].sort(
      (a, b) => missingCountForBuild(a, ownedPets, ownedItems) - missingCountForBuild(b, ownedPets, ownedItems)
    );
  }, [builds, matching, ownedPets, ownedItems]);

  // Frozen at whatever it was when this floor's page first loaded — never
  // recalculated after that. Without this, a search that legitimately uses
  // your last lookup would immediately re-trigger this same check (now
  // reading the freshly-bumped count) and hide the very results that search
  // just earned.
  const outOfLookupsSnapshot = useRef(null);
  if (outOfLookupsSnapshot.current === null && profile) {
    outOfLookupsSnapshot.current = !profile.is_subscribed && profile.trial_lookups_used >= profile.trial_lookups_limit;
  }
  const outOfLookups = outOfLookupsSnapshot.current ?? false;
  const [alternativesBlocked, setAlternativesBlocked] = useState(false);
  const revealingAlternatives = useRef(false);
  // Once paid for, reopening alternatives during this same visit is free —
  // only the very first reveal per floor should ever cost a lookup.
  const alreadyRevealedAlternatives = useRef(false);

  const handleToggleAlternatives = async () => {
    if (showAlternatives) {
      // Hiding them again is always free — only the reveal costs a lookup.
      setShowAlternatives(false);
      return;
    }
    if (alreadyRevealedAlternatives.current) {
      setShowAlternatives(true);
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
    alreadyRevealedAlternatives.current = true;
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
        <div style={{ background: PANEL, border: `1px solid rgba(248,113,113,0.4)`, borderRadius: 12, padding: "24px", textAlign: "center" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 17, color: CREAM, margin: "0 0 8px" }}>Something went wrong loading builds</p>
          <p style={{ fontSize: 12.5, color: MUTED, fontFamily: "monospace", margin: 0, wordBreak: "break-word" }}>{buildsError}</p>
        </div>
      </div>
    );
  }

  // Gate behind the subscription once free lookups are used up — this
  // applies regardless of whether a match exists, so the person always sees
  // one consistent "you're out" screen instead of sometimes landing on the
  // normal results page with a blocked alternatives link.
  if (outOfLookups) {
    return (
      <div style={{ padding: "24px", maxWidth: 640, margin: "0 auto" }}>
        <BackButton />
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
          {matching.length > 0 ? (
            <p style={{ fontFamily: "Georgia, serif", fontSize: 20, color: CREAM, margin: "0 0 8px" }}>
              {matching.length} build{matching.length > 1 ? "s" : ""} found for floor {stage}
            </p>
          ) : (
            <p style={{ fontFamily: "Georgia, serif", fontSize: 20, color: CREAM, margin: "0 0 8px" }}>
              You're out of free lookups
            </p>
          )}
          <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 18px" }}>
            You're out of free lookups ({getDisplayLookupUsage(profile).used}/{getDisplayLookupUsage(profile).limit} used).
            Subscribe for unlimited lookups.
          </p>
          <TrialCTA />
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
        <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
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
        <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 12, padding: "32px 24px", textAlign: "center", marginBottom: 20 }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 18, color: CREAM, margin: "0 0 8px" }}>
            No build matches what you have
          </p>
          <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 16px", lineHeight: 1.6 }}>
            Other builds exist for floor {stage}, but none of them only use pets and
            items from your <Link to="/collection" style={{ color: VIOLET }}>collection</Link>.
          </p>
          <button
            onClick={handleToggleAlternatives}
            style={{ background: "none", border: "none", color: VIOLET, fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0 }}
          >
            {showAlternatives ? "Hide alternative builds" : `See ${alternatives.length} alternative build${alternatives.length > 1 ? "s" : ""}`}
          </button>
          {alternativesBlocked && (
            <p style={{ fontSize: 12.5, color: MUTED, margin: "10px 0 0", lineHeight: 1.5 }}>
              You're out of free lookups. Viewing alternative builds also uses a lookup,
              same as a full match.{" "}
              <button onClick={handleSubscribe} style={{ background: "none", border: "none", color: VIOLET, fontWeight: 600, cursor: "pointer", padding: 0, fontSize: 12.5, textDecoration: "underline" }}>
                Subscribe for unlimited
              </button>
              .
            </p>
          )}
          {checkoutError && <p style={{ fontSize: 12, color: DANGER, margin: "8px 0 0" }}>{checkoutError}</p>}
          {showAlternatives &&
            alternatives.map((b) => (
              <div key={b.id} style={{ marginTop: 16, textAlign: "left" }}>
                <BuildCard build={b} pets={pets} items={items} ownedPets={ownedPets} ownedItemCounts={ownedItems} fullMatch={false} onVote={handleVote} />
              </div>
            ))}
        </div>
      ) : (
        matching.map((b) => (
          <BuildCard key={b.id} build={b} pets={pets} items={items} ownedPets={ownedPets} ownedItemCounts={ownedItems} fullMatch={true} onVote={handleVote} />
        ))
      )}

      {/* Posting a request makes sense any time there's no exact match yet —
          whether nobody's submitted anything for this floor, or builds exist
          but none fit this player's exact collection. */}
      {matching.length === 0 && (
        <>
          {requestSent ? (
            <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 12, padding: 20, marginTop: 20, textAlign: "center" }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 16, color: CREAM, margin: "0 0 6px" }}>Request posted</p>
              <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.6 }}>
                Other players can now attempt floor {stage} using only the pets and items
                you have. Check the{" "}
                <Link to="/fulfill" style={{ color: VIOLET }}>Fulfill requests</Link> tab for progress.
              </p>
            </div>
          ) : profile?.is_subscribed ? (
            <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 10, padding: "12px 16px", marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: CREAM }}>Want another player to build one for you instead?</span>
              <button
                onClick={handleSubmitRequest}
                disabled={requestSubmitting}
                style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
              >
                {requestSubmitting ? "Posting…" : "Submit a request"}
              </button>
            </div>
          ) : (
            <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 10, padding: "12px 16px", marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <span style={{ fontSize: 12.5, color: CREAM }}>
                Subscribers can post a request so other players attempt this floor using
                only your pets and items.
              </span>
              <TrialCTA
                style={{ padding: "8px 14px", fontSize: 12.5, borderRadius: 8 }}
              />
            </div>
          )}
          {requestError && <p style={{ fontSize: 12.5, color: DANGER, margin: "10px 0 0" }}>{requestError}</p>}
        </>
      )}

      {builds.length > 0 && (
        <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 10, padding: "12px 16px" }}>
          <span style={{ fontSize: 13, color: CREAM }}>Beat this floor with something else?</span>
          <Link
            to="/submit"
            style={{ background: GOLD, border: "none", color: "#FFFFFF", fontSize: 12.5, fontWeight: 600, padding: "7px 12px", borderRadius: 7, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
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

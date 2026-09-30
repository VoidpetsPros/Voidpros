import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Plus, Lock, Sparkles } from "lucide-react";
import { getBossForFloor, ELEMENT_COLORS } from "../lib/bossFloors";
import BackButton from "../components/BackButton";
import { useAuth } from "../hooks/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { useCollection } from "../hooks/useCollection";
import { useBuilds } from "../hooks/useBuilds";
import { supabase } from "../lib/supabaseClient";
import { buildFullyMatches, missingCountForBuild } from "../lib/matching";
import BuildCard from "../components/BuildCard";
import SuggestedBuildCard from "../components/SuggestedBuildCard";
import TrialCTA from "../components/TrialCTA";
import { useTheme } from "../hooks/ThemeContext";

export default function Results({ onRequireAuth }) {
  const { stage } = useParams();
  const boss = getBossForFloor(stage);
  const bossColor = boss ? ELEMENT_COLORS[boss.element] : null;
  const navigate = useNavigate();
  const { isAuthed, user, profile } = useAuth();
  const { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD, VIOLET, DANGER } = useTheme();
  const { pets, items, loading: catalogLoading } = useCatalog();
  const { ownedPets, ownedItems, loading: collectionLoading } = useCollection(user?.id);
  const { builds: rawBuilds, loading: buildsLoading, error: buildsError, applyVoteLocally } = useBuilds(stage, user?.id);
  // Builds without team data yet are awaiting admin review — not usable in
  // search until that's added, so they're excluded here entirely rather
  // than showing up as a phantom "match" or empty alternative.
  const builds = useMemo(() => rawBuilds.filter((b) => b.team && b.team.length > 0), [rawBuilds]);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState("");

  const handleSuggest = async () => {
    setSuggestLoading(true);
    setSuggestError("");
    const stageNum = Number(stage);
    const { data, error: rpcError } = await supabase.rpc("suggest_build_for_floor", { p_stage: stageNum });
    setSuggestLoading(false);
    if (rpcError) {
      setSuggestError(rpcError.message);
      return;
    }
    setSuggestion(data);
  };
  const [requestSent, setRequestSent] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    if (!isAuthed) onRequireAuth();
  }, [isAuthed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Counts toward "Popular Floors" on the Search page — fires once per
  // results page load, regardless of how the user got here (typed it in,
  // tapped a popular-floor chip, or a direct link).
  //
  // supabase-js's query/rpc builders are lazy "thenables" — the request
  // is only actually sent once you await/.then() them. A bare
  // `supabase.rpc(...)` with no await never fires the network call at
  // all, which is why this silently never recorded anything before.
  useEffect(() => {
    const stageNum = Number(stage);
    if (!isAuthed || !stageNum || stageNum < 1) return;
    supabase.rpc("increment_floor_search", { p_stage: stageNum }).then(({ error }) => {
      if (error) console.error("increment_floor_search failed:", error.message);
    });
  }, [stage, isAuthed]);

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

  // For a free user, item ids on every slot come back null (redacted
  // server-side), so buildItemCounts naturally returns {} and this
  // reduces to pure pet-matching — no special-casing needed here.
  const matching = useMemo(
    () => builds.filter((b) => buildFullyMatches(b, ownedPets, ownedItems)),
    [builds, ownedPets, ownedItems]
  );
  const alternatives = useMemo(() => {
    const nonMatching = builds.filter((b) => !matching.includes(b));
    // Closest-to-working first — a build you're missing one thing from is
    // far easier to act on (swap a pet/item) than one missing several.
    // Unlimited-only: everyone else sees them in the order they arrived.
    if (!profile?.is_subscribed) return nonMatching;
    return [...nonMatching].sort(
      (a, b) => missingCountForBuild(a, ownedPets, ownedItems) - missingCountForBuild(b, ownedPets, ownedItems)
    );
  }, [builds, matching, ownedPets, ownedItems, profile?.is_subscribed]);

  // Every build in a single search response shares the same items_visible
  // value (same viewer) — used elsewhere by BuildCard to decide whether to
  // show item detail; no UI banner announces it here anymore.

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
          <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 17, color: CREAM, margin: "0 0 8px" }}>Something went wrong loading builds</p>
          <p style={{ fontSize: 12.5, color: MUTED, fontFamily: "monospace", margin: 0, wordBreak: "break-word" }}>{buildsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 24px 60px", maxWidth: 640, margin: "0 auto" }}>
      <BackButton />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {boss ? (
            <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 22, color: bossColor, margin: 0 }}>
              {boss.element.charAt(0).toUpperCase() + boss.element.slice(1)} · {boss.name}
            </p>
          ) : (
            <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 22, color: CREAM, margin: 0 }}>Floor {stage}</p>
          )}
        </div>
        {builds.some((b) => b.items_visible === false && b.has_items) && (
          <button
            onClick={() => navigate("/subscribe")}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${GOLD}`, color: GOLD, borderRadius: 7, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
          >
            <Lock size={12} /> Unlock Item View
          </button>
        )}
      </div>
      <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 14px" }}>
        {matching.length > 0
          ? `${matching.length} build${matching.length > 1 ? "s" : ""} that only use what you have`
          : builds.length > 0
          ? "No build matches your exact team"
          : "No builds yet"}
      </p>

      {boss && (
        <div style={{ marginBottom: 22 }}>
          <button
            onClick={handleSuggest}
            disabled={suggestLoading}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${VIOLET}`, color: VIOLET, borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: suggestLoading ? "default" : "pointer" }}
          >
            <Sparkles size={13} />
            {suggestLoading ? "Analyzing clears…" : "Suggest Build"}
          </button>
          {suggestError && <p style={{ fontSize: 12, color: DANGER, marginTop: 8 }}>{suggestError}</p>}
          {suggestion && <SuggestedBuildCard suggestion={suggestion} pets={pets} items={items} />}
        </div>
      )}

      {builds.length === 0 ? (
        <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
          <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 18, color: CREAM, margin: "0 0 8px" }}>
            Nobody's cracked floor {stage} yet
          </p>
          <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 16px", lineHeight: 1.6 }}>
            Be the first to submit a build.
          </p>
          <Link
            to="/submit"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 9, padding: "10px 20px", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}
          >
            <Plus size={13} /> Submit a build
          </Link>
        </div>
      ) : matching.length === 0 ? (
        <div style={{ background: boss ? `${bossColor}22` : "rgba(124,58,237,0.08)", border: `2px solid ${boss ? `${bossColor}70` : "rgba(124,58,237,0.3)"}`, borderRadius: 12, padding: "32px 24px", textAlign: "center", marginBottom: 20 }}>
          <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 18, color: CREAM, margin: "0 0 8px" }}>
            No build matches what you have
          </p>
          <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 16px", lineHeight: 1.6 }}>
            Other builds exist for floor {stage}, but none of them only use pets and
            items from your <Link to="/collection" style={{ color: VIOLET }}>collection</Link>.
          </p>
          <button
            onClick={() => setShowAlternatives((v) => !v)}
            style={{ background: "none", border: "none", color: VIOLET, fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0 }}
          >
            {showAlternatives ? "Hide alternative builds" : `See ${alternatives.length} alternative build${alternatives.length > 1 ? "s" : ""}`}
          </button>
          {showAlternatives &&
            alternatives.map((b) => (
              <div key={b.id} style={{ marginTop: 16, textAlign: "left" }}>
                <BuildCard build={b} pets={pets} items={items} ownedPets={ownedPets} ownedItemCounts={ownedItems} fullMatch={false} onVote={handleVote} accentColor={bossColor} />
              </div>
            ))}
        </div>
      ) : (
        <>
          {matching.map((b) => (
            <BuildCard key={b.id} build={b} pets={pets} items={items} ownedPets={ownedPets} ownedItemCounts={ownedItems} fullMatch={true} onVote={handleVote} accentColor={bossColor} />
          ))}

          {alternatives.length > 0 && (
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button
                onClick={() => setShowAlternatives((v) => !v)}
                style={{ background: "none", border: "none", color: VIOLET, fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0 }}
              >
                {showAlternatives ? "Hide alternative builds" : `See ${alternatives.length} alternative build${alternatives.length > 1 ? "s" : ""}`}
              </button>
              {showAlternatives &&
                alternatives.map((b) => (
                  <div key={b.id} style={{ marginTop: 16, textAlign: "left" }}>
                    <BuildCard build={b} pets={pets} items={items} ownedPets={ownedPets} ownedItemCounts={ownedItems} fullMatch={false} onVote={handleVote} accentColor={bossColor} />
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {/* Posting a request makes sense any time there's no exact match yet —
          whether nobody's submitted anything for this floor, or builds exist
          but none fit this player's exact collection. */}
      {matching.length === 0 && (
        <>
          {requestSent ? (
            <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 12, padding: 20, marginTop: 20, textAlign: "center" }}>
              <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 16, color: CREAM, margin: "0 0 6px" }}>Request posted</p>
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

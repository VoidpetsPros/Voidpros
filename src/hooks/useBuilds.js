import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

// Fetches every non-rejected build submitted for a given floor, along with
// its 4 team slots and proof images. Also fetches which of these builds the
// current viewer has already voted on, so the UI can reflect that without a
// second round trip per build.
export function useBuilds(stage, userId) {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!stage) {
      setBuilds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("builds")
      .select(
        `
        id, stage, note, status, upvotes, comment_count, show_author, author_id, created_at,
        author:profiles!author_id(username),
        team:build_team_slots(*),
        images:build_images(kind, storage_path)
      `
      )
      .eq("stage", Number(stage))
      .neq("status", "rejected")
      .order("status", { ascending: false }) // verified first
      .order("upvotes", { ascending: false });

    if (fetchError) {
      console.error("useBuilds query failed:", fetchError);
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    let withViewerState = data || [];
    // sort team slots by slot_index client-side (Supabase doesn't let us
    // order a nested relation independently of the parent order)
    withViewerState = withViewerState.map((b) => ({
      ...b,
      team: [...(b.team || [])].sort((a, b2) => a.slot_index - b2.slot_index),
    }));

    if (userId && withViewerState.length > 0) {
      const buildIds = withViewerState.map((b) => b.id);
      const { data: votesData } = await supabase
        .from("build_votes")
        .select("build_id, direction")
        .eq("user_id", userId)
        .in("build_id", buildIds);
      const voteMap = {};
      (votesData || []).forEach((v) => (voteMap[v.build_id] = v.direction));
      withViewerState = withViewerState.map((b) => ({
        ...b,
        userVote: voteMap[b.id] || null,
      }));
    }

    setBuilds(withViewerState);
    setLoading(false);
  }, [stage, userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Updates a single build's vote state in place — no refetch, so the list
  // doesn't flash/reload or lose scroll position on every click.
  const applyVoteLocally = useCallback((buildId, nowUpvoted) => {
    setBuilds((prev) =>
      prev.map((b) =>
        b.id === buildId ? { ...b, userVote: nowUpvoted ? "up" : null, upvotes: b.upvotes + (nowUpvoted ? 1 : -1) } : b
      )
    );
  }, []);

  return { builds, loading, error, refresh: load, applyVoteLocally };
}

export function imageUrl(storagePath) {
  const { data } = supabase.storage.from("submission-images").getPublicUrl(storagePath);
  return data.publicUrl;
}

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const BUILD_SELECT = `
  id, stage, note, status, confirmations, upvotes, downvotes, show_author, author_id, created_at,
  author:profiles!author_id(username),
  team:build_team_slots(*),
  images:build_images(kind, storage_path)
`;

// Builds a user has either authored OR left a comment on, deduplicated and
// tagged with why each one shows up, most recent first.
export function useMyActivity(userId) {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!userId) {
      setBuilds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const [ownRes, commentRes] = await Promise.all([
      supabase.from("builds").select(BUILD_SELECT).eq("author_id", userId),
      supabase.from("comments").select("build_id").eq("user_id", userId),
    ]);

    if (ownRes.error) {
      setError(ownRes.error.message);
      setLoading(false);
      return;
    }

    const ownBuilds = (ownRes.data || []).map((b) => ({ ...b, _mine: true, _commented: false }));
    const commentedIds = [...new Set((commentRes.data || []).map((c) => c.build_id))].filter(
      (id) => !ownBuilds.some((b) => b.id === id)
    );

    let commentedBuilds = [];
    if (commentedIds.length > 0) {
      const { data, error: commentedError } = await supabase.from("builds").select(BUILD_SELECT).in("id", commentedIds);
      if (commentedError) {
        console.error(commentedError.message);
      } else {
        commentedBuilds = (data || []).map((b) => ({ ...b, _mine: false, _commented: true }));
      }
    }

    const merged = [...ownBuilds, ...commentedBuilds]
      .map((b) => ({ ...b, team: [...(b.team || [])].sort((a, c) => a.slot_index - c.slot_index) }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setBuilds(merged);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { builds, loading, error, refresh: load };
}

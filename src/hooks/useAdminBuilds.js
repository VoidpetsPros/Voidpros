import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useAdminBuilds() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("builds")
      .select(
        `
        id, stage, note, status, upvotes, comment_count, show_author, author_id, created_at,
        author:profiles!author_id(username, is_subscribed),
        team:build_team_slots(*),
        images:build_images(kind, storage_path)
      `
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("useAdminBuilds query failed:", fetchError);
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    // Priority review: Unlimited subscribers' submissions get reviewed
    // first. Oldest-first is still the tiebreaker within each group, so
    // it's still fair ordering among peers.
    const sorted = [...(data || [])].sort((a, b) => {
      const aSub = a.author?.is_subscribed ? 0 : 1;
      const bSub = b.author?.is_subscribed ? 0 : 1;
      if (aSub !== bSub) return aSub - bSub;
      return new Date(a.created_at) - new Date(b.created_at);
    });

    setBuilds(sorted.map((b) => ({ ...b, team: [...(b.team || [])].sort((a, c) => a.slot_index - c.slot_index) })));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { builds, loading, error, refresh: load };
}

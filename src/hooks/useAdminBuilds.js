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
        id, stage, note, status, confirmations, upvotes, downvotes, show_author, author_id, created_at,
        author:profiles!author_id(username),
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

    setBuilds((data || []).map((b) => ({ ...b, team: [...(b.team || [])].sort((a, c) => a.slot_index - c.slot_index) })));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { builds, loading, error, refresh: load };
}

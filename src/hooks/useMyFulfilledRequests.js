import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const BUILD_SELECT = `
  id, stage, note, status, confirmations, upvotes, downvotes, show_author, author_id, created_at,
  author:profiles!author_id(username),
  team:build_team_slots(*),
  images:build_images(kind, storage_path)
`;

// Finds every verified fulfillment for a request the CURRENT user made,
// and returns the build each one published — this is the "your request
// was fulfilled" notification data.
export function useMyFulfilledRequests(userId) {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setBuilds([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: fulfillments, error } = await supabase
      .from("fulfillments")
      .select("id, resulting_build_id, request:requests!inner(id, stage, requester_id)")
      .eq("status", "verified")
      .eq("request.requester_id", userId)
      .not("resulting_build_id", "is", null);

    if (error) {
      console.error("useMyFulfilledRequests query failed:", error.message);
      setLoading(false);
      return;
    }

    const buildIds = [...new Set((fulfillments || []).map((f) => f.resulting_build_id).filter(Boolean))];
    if (buildIds.length === 0) {
      setBuilds([]);
      setLoading(false);
      return;
    }

    const { data: buildsData, error: buildsError } = await supabase.from("builds").select(BUILD_SELECT).in("id", buildIds);
    if (buildsError) {
      console.error(buildsError.message);
      setLoading(false);
      return;
    }

    setBuilds((buildsData || []).map((b) => ({ ...b, team: [...(b.team || [])].sort((a, c) => a.slot_index - c.slot_index) })));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { builds, loading, refresh: load };
}

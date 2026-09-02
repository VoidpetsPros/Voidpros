import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const BUILD_SELECT = `
  id, stage, note, status, upvotes, comment_count, show_author, author_id, created_at,
  author:profiles!author_id(username),
  team:build_team_slots(*),
  images:build_images(kind, storage_path)
`;

// Every request the current user has submitted (as requester) that they
// haven't dismissed — both still-open ones and fulfilled ones. Fulfilled
// entries carry the resulting build, same shape useBuilds/BuildCard expect.
export function useMyRequests(userId) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!userId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const { data: reqData, error: reqError } = await supabase
      .from("requests")
      .select("id, stage, fulfilled, created_at")
      .eq("requester_id", userId)
      .eq("dismissed_by_requester", false)
      .order("created_at", { ascending: false });

    if (reqError) {
      console.error("useMyRequests query failed:", reqError.message);
      setError(reqError.message);
      setLoading(false);
      return;
    }

    const fulfilledIds = (reqData || []).filter((r) => r.fulfilled).map((r) => r.id);
    const buildByRequest = {};

    if (fulfilledIds.length > 0) {
      const { data: fulfillments } = await supabase
        .from("fulfillments")
        .select("request_id, resulting_build_id")
        .eq("status", "verified")
        .in("request_id", fulfilledIds)
        .not("resulting_build_id", "is", null);

      const buildIds = [...new Set((fulfillments || []).map((f) => f.resulting_build_id).filter(Boolean))];
      if (buildIds.length > 0) {
        const { data: buildsData } = await supabase.from("builds").select(BUILD_SELECT).in("id", buildIds);
        const buildById = Object.fromEntries(
          (buildsData || []).map((b) => [b.id, { ...b, team: [...(b.team || [])].sort((a, c) => a.slot_index - c.slot_index) }])
        );
        (fulfillments || []).forEach((f) => {
          if (f.resulting_build_id && buildById[f.resulting_build_id]) {
            buildByRequest[f.request_id] = buildById[f.resulting_build_id];
          }
        });
      }
    }

    setRequests((reqData || []).map((r) => ({ ...r, resultingBuild: buildByRequest[r.id] || null })));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { requests, loading, error, refresh: load };
}

export async function dismissRequest(requestId) {
  return supabase.rpc("dismiss_my_request", { p_request_id: requestId });
}

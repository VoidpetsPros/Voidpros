import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useAdminFulfillments() {
  const [fulfillments, setFulfillments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("fulfillments")
      .select(
        `
        id, request_id, note, status, show_fulfiller, created_at,
        fulfiller:profiles!fulfiller_id(username),
        request:requests!request_id(stage),
        team:fulfillment_team_slots(*),
        images:fulfillment_images(kind, storage_path)
      `
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("useAdminFulfillments query failed:", fetchError);
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setFulfillments(
      (data || []).map((f) => ({ ...f, team: [...(f.team || [])].sort((a, b) => a.slot_index - b.slot_index) }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { fulfillments, loading, error, refresh: load };
}

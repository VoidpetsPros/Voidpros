import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("requests")
      .select(
        `
        id, stage, show_requester, fulfilled, requester_id, created_at,
        requester:profiles!requester_id(username),
        pets:request_pets(pet_id),
        items:request_items(item_id, count)
      `
      )
      .eq("fulfilled", false)
      .eq("cancelled", false)
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("useRequests query failed:", fetchError);
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setRequests(
      (data || []).map((r) => ({
        ...r,
        pets: (r.pets || []).map((p) => p.pet_id),
        items: Object.fromEntries((r.items || []).map((i) => [i.item_id, i.count])),
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { requests, loading, error, refresh: load };
}

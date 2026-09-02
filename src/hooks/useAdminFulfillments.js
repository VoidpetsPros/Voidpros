import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useAdminFulfillments() {
  const [fulfillments, setFulfillments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // No team data to select yet — the fulfiller only submits screenshots.
    // Pull the request's pool instead, so the admin knows what's actually
    // allowed when entering the team during review.
    const { data, error: fetchError } = await supabase
      .from("fulfillments")
      .select(
        `
        id, request_id, note, status, show_fulfiller, created_at,
        fulfiller:profiles!fulfiller_id(username),
        request:requests!request_id(
          stage,
          pets:request_pets(pet_id),
          items:request_items(item_id, count)
        ),
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
      (data || []).map((f) => ({
        ...f,
        allowedPetIds: (f.request?.pets || []).map((p) => p.pet_id),
        allowedItems: Object.fromEntries((f.request?.items || []).map((i) => [i.item_id, i.count])),
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { fulfillments, loading, error, refresh: load };
}

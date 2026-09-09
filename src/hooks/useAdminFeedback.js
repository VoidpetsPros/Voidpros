import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useAdminFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("feedback")
      .select("id, message, created_at, user:profiles!user_id(username)")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("useAdminFeedback query failed:", fetchError);
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setFeedback(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { feedback, loading, error, refresh: load };
}

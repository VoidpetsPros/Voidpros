import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

// Total verified build count, shown on the Home page and in Admin only —
// not in the global header, so it doesn't follow people onto every page.
export default function useVerifiedBuildCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchVerifiedCount() {
      const { count: result, error } = await supabase
        .from("builds")
        .select("*", { count: "exact", head: true })
        .eq("status", "verified");

      if (!error && isMounted) {
        setCount(result);
      }
    }

    fetchVerifiedCount();

    return () => {
      isMounted = false;
    };
  }, []);

  return count;
}

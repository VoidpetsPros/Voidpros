import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

// Fetches the game catalog (pets + items) once and shares it. This data
// changes rarely (only when you add new pets/items), so no realtime
// subscription — a page refresh is enough to pick up catalog changes.
export function useCatalog() {
  const [pets, setPets] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [petsRes, itemsRes] = await Promise.all([
        supabase.from("pets").select("*").order("name"),
        supabase.from("items").select("*").order("name"),
      ]);
      if (cancelled) return;
      if (petsRes.error) console.error(petsRes.error.message);
      if (itemsRes.error) console.error(itemsRes.error.message);
      setPets(petsRes.data || []);
      setItems(itemsRes.data || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const itemsByType = {
    hat: items.filter((i) => i.type === "hat"),
    scarf: items.filter((i) => i.type === "scarf"),
    accessory: items.filter((i) => i.type === "accessory"),
  };

  return { pets, items, itemsByType, loading };
}

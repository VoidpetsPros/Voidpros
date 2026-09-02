import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

// Fetches the game catalog (pets + items) once and shares it. This data
// changes rarely (only when you add new pets/items), so no realtime
// subscription — a page refresh is enough to pick up catalog changes.

// Highest rarity first, then alphabetical within each rarity tier.
const RARITY_RANK = { Uber: 0, Legendary: 1, Epic: 2, Rare: 3, Common: 4 };
function sortByRarityThenName(a, b) {
  const rankA = RARITY_RANK[a.rarity] ?? 99;
  const rankB = RARITY_RANK[b.rarity] ?? 99;
  if (rankA !== rankB) return rankA - rankB;
  return a.name.localeCompare(b.name);
}

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
      setPets((petsRes.data || []).slice().sort(sortByRarityThenName));
      setItems((itemsRes.data || []).slice().sort(sortByRarityThenName));
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

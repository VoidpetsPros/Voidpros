import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

// Reads/writes a signed-in user's owned pets (boolean pool) and owned items
// (counted pool). Levels are intentionally NOT tracked here — per the product
// rules, levels only matter on submitted builds, never on inventory.
export function useCollection(userId) {
  const [ownedPets, setOwnedPets] = useState([]); // array of pet ids
  const [ownedItems, setOwnedItems] = useState({}); // { itemId: count }
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setOwnedPets([]);
      setOwnedItems({});
      setLoading(false);
      return;
    }
    setLoading(true);
    const [petsRes, itemsRes] = await Promise.all([
      supabase.from("user_pets").select("pet_id").eq("user_id", userId),
      supabase.from("user_items").select("item_id, count").eq("user_id", userId),
    ]);
    if (petsRes.error) console.error(petsRes.error.message);
    if (itemsRes.error) console.error(itemsRes.error.message);

    setOwnedPets((petsRes.data || []).map((r) => r.pet_id));
    const counts = {};
    (itemsRes.data || []).forEach((r) => {
      counts[r.item_id] = r.count;
    });
    setOwnedItems(counts);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const togglePet = async (petId) => {
    if (!userId) return;
    const owns = ownedPets.includes(petId);
    // optimistic update
    setOwnedPets((prev) => (owns ? prev.filter((id) => id !== petId) : [...prev, petId]));
    const { error } = owns
      ? await supabase.from("user_pets").delete().eq("user_id", userId).eq("pet_id", petId)
      : await supabase.from("user_pets").insert({ user_id: userId, pet_id: petId });
    if (error) {
      console.error(error.message);
      load(); // roll back to server truth on failure
    }
  };

  const setItemCount = async (itemId, count) => {
    if (!userId) return;
    const prev = ownedItems[itemId] || 0;
    // optimistic update
    setOwnedItems((cur) => {
      const next = { ...cur };
      if (count <= 0) delete next[itemId];
      else next[itemId] = count;
      return next;
    });
    let error;
    if (count <= 0) {
      ({ error } = await supabase.from("user_items").delete().eq("user_id", userId).eq("item_id", itemId));
    } else {
      ({ error } = await supabase
        .from("user_items")
        .upsert({ user_id: userId, item_id: itemId, count }, { onConflict: "user_id,item_id" }));
    }
    if (error) {
      console.error(error.message);
      load();
    }
  };

  return { ownedPets, ownedItems, loading, togglePet, setItemCount, refresh: load };
}

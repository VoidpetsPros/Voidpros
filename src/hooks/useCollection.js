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

  // Used by the "Select all <rarity>" buttons in Collection.jsx — sets
  // ownership for a whole batch of pet ids at once instead of one at a time.
  const bulkSetPets = async (petIds, own) => {
    if (!userId || petIds.length === 0) return;
    // optimistic update
    setOwnedPets((prev) => {
      const set = new Set(prev);
      petIds.forEach((id) => (own ? set.add(id) : set.delete(id)));
      return Array.from(set);
    });
    const { error } = own
      ? await supabase.from("user_pets").upsert(
          petIds.map((petId) => ({ user_id: userId, pet_id: petId })),
          { onConflict: "user_id,pet_id" }
        )
      : await supabase.from("user_pets").delete().eq("user_id", userId).in("pet_id", petIds);
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

  // Used by the "Select all <rarity>" buttons in Collection.jsx — sets
  // ownership for a whole batch of item ids at once. Items are capped at 1
  // per player (see migration 0020), so "own" always means count = 1.
  const bulkSetItemCounts = async (itemIds, own) => {
    if (!userId || itemIds.length === 0) return;
    // optimistic update
    setOwnedItems((cur) => {
      const next = { ...cur };
      itemIds.forEach((id) => {
        if (own) next[id] = 1;
        else delete next[id];
      });
      return next;
    });
    const { error } = own
      ? await supabase.from("user_items").upsert(
          itemIds.map((itemId) => ({ user_id: userId, item_id: itemId, count: 1 })),
          { onConflict: "user_id,item_id" }
        )
      : await supabase.from("user_items").delete().eq("user_id", userId).in("item_id", itemIds);
    if (error) {
      console.error(error.message);
      load();
    }
  };

  return { ownedPets, ownedItems, loading, togglePet, setItemCount, bulkSetPets, bulkSetItemCounts, refresh: load };
}

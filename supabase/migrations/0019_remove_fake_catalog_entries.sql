-- ============================================================
-- voidpros — remove leftover fake catalog entries (CORRECTED)
-- 6 of the original 10 placeholder pets (Spite, Joy, Envy, Patience,
-- Wrath, Greed) were already upgraded to real data in place. The
-- remaining 4 (Sorrow, Hope, Dread, Calm) don't correspond to any real
-- Voidpet Dungeon pet — removing them here. All 10 original placeholder
-- items are also fake and get removed.
--
-- Fix vs. the first attempt: a build published from an approved
-- fulfillment is still referenced by that fulfillment's
-- resulting_build_id column. That reference has to be cleared before
-- the build can be deleted, or Postgres correctly refuses the delete.
-- ============================================================

do $$
declare
  fake_pet_ids text[] := array['p7', 'p8', 'p9', 'p10']; -- Sorrow, Hope, Dread, Calm
  fake_item_ids text[] := array['h1', 'h2', 'h3', 's1', 's2', 's3', 'a1', 'a2', 'a3', 'a4'];
  target_build_ids uuid[];
begin
  -- find builds that use any fake pet or item
  select array_agg(distinct build_id) into target_build_ids
  from build_team_slots
  where pet_id = any(fake_pet_ids)
     or hat_id = any(fake_item_ids)
     or scarf_id = any(fake_item_ids)
     or accessory1_id = any(fake_item_ids)
     or accessory2_id = any(fake_item_ids);

  if target_build_ids is not null then
    -- release any fulfillment's "this is the build I produced" pointer
    -- before deleting the build itself
    update fulfillments set resulting_build_id = null where resulting_build_id = any(target_build_ids);
    delete from builds where id = any(target_build_ids);
  end if;

  -- fulfillments whose OWN team slots used a fake pet or item
  -- (cascades to their team_slots, images)
  delete from fulfillments where id in (
    select fulfillment_id from fulfillment_team_slots
    where pet_id = any(fake_pet_ids)
       or hat_id = any(fake_item_ids)
       or scarf_id = any(fake_item_ids)
       or accessory1_id = any(fake_item_ids)
       or accessory2_id = any(fake_item_ids)
  );

  -- requests whose pool included any fake pet or item
  delete from requests where id in (
    select request_id from request_pets where pet_id = any(fake_pet_ids)
    union
    select request_id from request_items where item_id = any(fake_item_ids)
  );

  -- personal ownership pools
  delete from user_pets where pet_id = any(fake_pet_ids);
  delete from user_items where item_id = any(fake_item_ids);

  -- finally, the catalog rows themselves
  delete from pets where id = any(fake_pet_ids);
  delete from items where id = any(fake_item_ids);
end $$;

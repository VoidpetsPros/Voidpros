-- ============================================================
-- voidpros — atomic build submission
-- Inserting a build, its 4 team slots, and its images as 3 separate client
-- calls risks a half-broken build if one step fails partway through. This
-- function does all of it in a single transaction (Postgres functions run
-- as one transaction by default) — either the whole submission lands, or
-- none of it does.
--
-- Images are uploaded to Storage by the client BEFORE calling this function
-- (Storage isn't part of the Postgres transaction), so p_images just carries
-- the storage paths of files that already exist.
-- ============================================================

create function submit_build(
  p_stage int,
  p_note text,
  p_show_author boolean,
  p_team jsonb,   -- array of exactly 4: {slot_index, pet_id, pet_level, hat_id, hat_level, scarf_id, scarf_level, accessory1_id, accessory1_level, accessory2_id, accessory2_level}
  p_images jsonb  -- array of {kind, storage_path}
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_build_id uuid;
  slot jsonb;
  img jsonb;
  distinct_pet_count int;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to submit a build';
  end if;

  if p_stage is null or p_stage < 1 then
    raise exception 'A valid floor number is required';
  end if;

  if jsonb_array_length(p_team) <> 4 then
    raise exception 'A build must have exactly 4 team slots';
  end if;

  if not exists (select 1 from jsonb_array_elements(p_images) e where e->>'kind' = 'completion') then
    raise exception 'A completion screenshot is required';
  end if;
  if not exists (select 1 from jsonb_array_elements(p_images) e where e->>'kind' = 'pets') then
    raise exception 'A pets screenshot is required';
  end if;
  if not exists (select 1 from jsonb_array_elements(p_images) e where e->>'kind' = 'items') then
    raise exception 'An items screenshot is required';
  end if;

  insert into builds (stage, author_id, show_author, note)
  values (p_stage, auth.uid(), p_show_author, nullif(trim(p_note), ''))
  returning id into new_build_id;

  for slot in select * from jsonb_array_elements(p_team) loop
    insert into build_team_slots (
      build_id, slot_index, pet_id, pet_level, hat_id, hat_level,
      scarf_id, scarf_level, accessory1_id, accessory1_level, accessory2_id, accessory2_level
    ) values (
      new_build_id,
      (slot->>'slot_index')::int,
      slot->>'pet_id',
      (slot->>'pet_level')::int,
      slot->>'hat_id',
      (slot->>'hat_level')::int,
      slot->>'scarf_id',
      (slot->>'scarf_level')::int,
      slot->>'accessory1_id',
      (slot->>'accessory1_level')::int,
      slot->>'accessory2_id',
      (slot->>'accessory2_level')::int
    );
  end loop;

  select count(distinct pet_id) into distinct_pet_count from build_team_slots where build_id = new_build_id;
  if distinct_pet_count <> 4 then
    raise exception 'A team must use 4 distinct pets';
  end if;

  for img in select * from jsonb_array_elements(p_images) loop
    insert into build_images (build_id, kind, storage_path)
    values (new_build_id, img->>'kind', img->>'storage_path');
  end loop;

  return new_build_id;
end;
$$;

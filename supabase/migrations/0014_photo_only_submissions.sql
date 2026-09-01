-- ============================================================
-- voidpros — photo-only build submissions
-- Players now only submit screenshots + a floor number + optional notes.
-- The structured pet/item/level data (needed for search matching) gets
-- entered by an admin while reviewing the screenshots, in the same step
-- as approving. This removes the manual team-builder step for players
-- entirely, while keeping search matching working (it still needs real
-- structured data from somewhere — it just now comes from admin review
-- instead of the submitter).
-- ============================================================

create or replace function submit_build(
  p_stage int,
  p_note text,
  p_show_author boolean,
  p_images jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_build_id uuid;
  img jsonb;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to submit a build';
  end if;
  if p_stage is null or p_stage < 1 then
    raise exception 'A valid floor number is required';
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

  for img in select * from jsonb_array_elements(p_images) loop
    insert into build_images (build_id, kind, storage_path)
    values (new_build_id, img->>'kind', img->>'storage_path');
  end loop;

  return new_build_id;
end;
$$;

-- Admin enters the team shown in the screenshots and approves in one step.
-- This is now the ONLY way a regular submission gets structured team data.
create function admin_approve_build(p_build_id uuid, p_team jsonb) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  elem jsonb;
  distinct_pet_count int;
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admin only';
  end if;
  if jsonb_array_length(p_team) <> 4 then
    raise exception 'A build must have exactly 4 team slots';
  end if;

  for elem in select * from jsonb_array_elements(p_team) loop
    insert into build_team_slots (
      build_id, slot_index, pet_id, pet_level, hat_id, hat_level,
      scarf_id, scarf_level, accessory1_id, accessory1_level, accessory2_id, accessory2_level
    ) values (
      p_build_id,
      (elem->>'slot_index')::int,
      elem->>'pet_id', (elem->>'pet_level')::int,
      elem->>'hat_id', (elem->>'hat_level')::int,
      elem->>'scarf_id', (elem->>'scarf_level')::int,
      elem->>'accessory1_id', (elem->>'accessory1_level')::int,
      elem->>'accessory2_id', (elem->>'accessory2_level')::int
    );
  end loop;

  select count(distinct pet_id) into distinct_pet_count from build_team_slots where build_id = p_build_id;
  if distinct_pet_count <> 4 then
    raise exception 'A team must use 4 distinct pets';
  end if;

  update builds set status = 'verified' where id = p_build_id;
end;
$$;

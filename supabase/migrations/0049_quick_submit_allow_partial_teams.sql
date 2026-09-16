-- Quick Submit (admin) was rejecting any build with fewer than 4 pets,
-- even though the client UI (Admin.jsx QuickSubmitBuild) only requires at
-- least one pet. Bring the function in line with the client: allow 1-4
-- team slots, and 1-4 distinct pets, instead of requiring exactly 4.

create or replace function admin_quick_submit_build(p_stage int, p_team jsonb, p_note text) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_build_id uuid;
  elem jsonb;
  distinct_pet_count int;
  slot_count int;
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admin only';
  end if;
  if p_stage is null or p_stage < 1 then
    raise exception 'A valid floor number is required';
  end if;

  slot_count := jsonb_array_length(p_team);
  if slot_count < 1 or slot_count > 4 then
    raise exception 'A build must have between 1 and 4 team slots';
  end if;

  -- No author, no karma, no review queue — this is bulk-seeded catalog
  -- data, not a player submission.
  insert into builds (stage, author_id, show_author, note, status, confirmations)
  values (p_stage, null, false, nullif(trim(p_note), ''), 'verified', 0)
  returning id into new_build_id;

  for elem in select * from jsonb_array_elements(p_team) loop
    insert into build_team_slots (
      build_id, slot_index, pet_id, pet_level, hat_id, hat_level,
      scarf_id, scarf_level, accessory1_id, accessory1_level, accessory2_id, accessory2_level
    ) values (
      new_build_id,
      (elem->>'slot_index')::int,
      elem->>'pet_id', (elem->>'pet_level')::int,
      nullif(elem->>'hat_id', ''), nullif(elem->>'hat_level', '')::int,
      nullif(elem->>'scarf_id', ''), nullif(elem->>'scarf_level', '')::int,
      nullif(elem->>'accessory1_id', ''), nullif(elem->>'accessory1_level', '')::int,
      nullif(elem->>'accessory2_id', ''), nullif(elem->>'accessory2_level', '')::int
    );
  end loop;

  select count(distinct pet_id) into distinct_pet_count from build_team_slots where build_id = new_build_id;
  if distinct_pet_count <> slot_count then
    raise exception 'Each pet used must be different — one is repeated.';
  end if;

  return new_build_id;
end;
$$;

-- ============================================================
-- voidpros — allow partial teams (1-4 pets) on build approval
-- admin_approve_fulfillment already allows 1-4 pets (a requester may not
-- own enough for a full team). admin_approve_build never got the same
-- treatment and still hard-requires exactly 4 distinct pets, which
-- blocks approving a legitimate 2-pet (or 1/3-pet) completion.
-- ============================================================

create or replace function admin_approve_build(p_build_id uuid, p_team jsonb) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  elem jsonb;
  team_len int;
  distinct_pet_count int;
  target_author uuid;
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admin only';
  end if;

  team_len := jsonb_array_length(p_team);
  if team_len < 1 or team_len > 4 then
    raise exception 'Submit between 1 and 4 pets';
  end if;

  for elem in select * from jsonb_array_elements(p_team) loop
    insert into build_team_slots (
      build_id, slot_index, pet_id, pet_level, hat_id, hat_level,
      scarf_id, scarf_level, accessory1_id, accessory1_level, accessory2_id, accessory2_level
    ) values (
      p_build_id,
      (elem->>'slot_index')::int,
      elem->>'pet_id', (elem->>'pet_level')::int,
      nullif(elem->>'hat_id', ''), nullif(elem->>'hat_level', '')::int,
      nullif(elem->>'scarf_id', ''), nullif(elem->>'scarf_level', '')::int,
      nullif(elem->>'accessory1_id', ''), nullif(elem->>'accessory1_level', '')::int,
      nullif(elem->>'accessory2_id', ''), nullif(elem->>'accessory2_level', '')::int
    );
  end loop;

  select count(distinct pet_id) into distinct_pet_count from build_team_slots where build_id = p_build_id;
  if distinct_pet_count <> team_len then
    raise exception 'Each pet must be different — one is repeated';
  end if;

  update builds set status = 'verified' where id = p_build_id returning author_id into target_author;

  if target_author is not null then
    perform recompute_karma(target_author);
  end if;
end;
$$;

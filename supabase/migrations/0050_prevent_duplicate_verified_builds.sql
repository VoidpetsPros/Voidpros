-- Prevent verifying an exact duplicate build: same floor (stage), and the
-- same set of pets — each with the same level and the same hat/scarf/
-- accessories at the same levels. Order of slots doesn't matter for this
-- comparison (an admin or player may list the same team in a different
-- order), so the signature is built sorted by pet_id rather than by
-- slot_index.
--
-- Applied to both places a build becomes 'verified':
--   - admin_approve_build   (normal player submissions, reviewed by an admin)
--   - admin_quick_submit_build (admin bulk-seeded catalog builds)

create or replace function build_team_signature(p_build_id uuid) returns text
language sql
stable
as $$
  select string_agg(
    coalesce(pet_id, '-') || ':' || coalesce(pet_level::text, '-') || ':' ||
    coalesce(hat_id, '-') || ':' || coalesce(hat_level::text, '-') || ':' ||
    coalesce(scarf_id, '-') || ':' || coalesce(scarf_level::text, '-') || ':' ||
    coalesce(accessory1_id, '-') || ':' || coalesce(accessory1_level::text, '-') || ':' ||
    coalesce(accessory2_id, '-') || ':' || coalesce(accessory2_level::text, '-'),
    '|' order by pet_id
  )
  from build_team_slots
  where build_id = p_build_id;
$$;

create or replace function admin_approve_build(p_build_id uuid, p_team jsonb) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  elem jsonb;
  team_len int;
  distinct_pet_count int;
  target_stage int;
  new_signature text;
  duplicate_exists boolean;
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

  select stage into target_stage from builds where id = p_build_id;
  new_signature := build_team_signature(p_build_id);

  select exists (
    select 1 from builds b
    where b.stage = target_stage
      and b.status = 'verified'
      and b.id <> p_build_id
      and build_team_signature(b.id) = new_signature
  ) into duplicate_exists;

  if duplicate_exists then
    raise exception 'An identical build (same floor, pets, items, and levels) is already verified';
  end if;

  update builds set status = 'verified' where id = p_build_id;
end;
$$;

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
  new_signature text;
  duplicate_exists boolean;
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

  new_signature := build_team_signature(new_build_id);

  select exists (
    select 1 from builds b
    where b.stage = p_stage
      and b.status = 'verified'
      and b.id <> new_build_id
      and build_team_signature(b.id) = new_signature
  ) into duplicate_exists;

  if duplicate_exists then
    raise exception 'An identical build (same floor, pets, items, and levels) is already verified';
  end if;

  return new_build_id;
end;
$$;

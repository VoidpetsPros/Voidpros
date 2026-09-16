-- Track which admin published each Quick Submit build, and expose a
-- per-admin breakdown so admins can see how many builds each person has
-- bulk-seeded through the tool.
--
-- author_id on `builds` intentionally stays null for Quick Submit rows
-- (that's what keeps them out of player karma/leaderboards elsewhere in
-- the app) — quick_submitted_by is a separate, admin-only-visible column
-- purely for this internal tracking.

alter table builds add column quick_submitted_by uuid references profiles(id) on delete set null;

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
  caller uuid := auth.uid();
begin
  if not exists (select 1 from profiles where id = caller and is_admin = true) then
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
  -- data, not a player submission. quick_submitted_by records which admin
  -- actually ran the tool, for internal tracking only.
  insert into builds (stage, author_id, show_author, note, status, confirmations, quick_submitted_by)
  values (p_stage, null, false, nullif(trim(p_note), ''), 'verified', 0, caller)
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

-- Per-admin breakdown of Quick Submit activity. Admin-only.
create or replace function get_quick_submit_stats() returns table (
  admin_id uuid,
  username text,
  build_count bigint,
  last_submitted_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admin only';
  end if;

  return query
    select
      p.id as admin_id,
      p.username,
      count(b.id) as build_count,
      max(b.created_at) as last_submitted_at
    from builds b
    join profiles p on p.id = b.quick_submitted_by
    where b.quick_submitted_by is not null
    group by p.id, p.username
    order by build_count desc;
end;
$$;

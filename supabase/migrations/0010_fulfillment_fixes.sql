-- ============================================================
-- voidpros — fulfillment fixes
-- ============================================================

-- Replace submit_fulfillment: fulfillers can now use ANY pets/items, not
-- just what's in the requester's pool. Testing showed many requesters don't
-- own enough distinct pets/items to even assemble a valid 4-pet team, which
-- made some requests mathematically impossible to fulfill under the old
-- restriction. This also removes the query that caused "column reference
-- 'slot' is ambiguous" — that error came from reusing "slot" as both a
-- declared PL/pgSQL variable and a SQL table alias in the same function.
create or replace function submit_fulfillment(
  p_request_id uuid,
  p_note text,
  p_show_fulfiller boolean,
  p_team jsonb,
  p_images jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_fulfillment_id uuid;
  elem jsonb;
  img jsonb;
  distinct_pet_count int;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to submit a fulfillment';
  end if;
  if not exists (select 1 from requests where id = p_request_id and not fulfilled) then
    raise exception 'This request is no longer open';
  end if;
  if jsonb_array_length(p_team) <> 4 then
    raise exception 'A fulfillment must have exactly 4 team slots';
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

  insert into fulfillments (request_id, fulfiller_id, show_fulfiller, note)
  values (p_request_id, auth.uid(), p_show_fulfiller, nullif(trim(p_note), ''))
  returning id into new_fulfillment_id;

  for elem in select * from jsonb_array_elements(p_team) loop
    insert into fulfillment_team_slots (
      fulfillment_id, slot_index, pet_id, pet_level, hat_id, hat_level,
      scarf_id, scarf_level, accessory1_id, accessory1_level, accessory2_id, accessory2_level
    ) values (
      new_fulfillment_id,
      (elem->>'slot_index')::int,
      elem->>'pet_id', (elem->>'pet_level')::int,
      elem->>'hat_id', (elem->>'hat_level')::int,
      elem->>'scarf_id', (elem->>'scarf_level')::int,
      elem->>'accessory1_id', (elem->>'accessory1_level')::int,
      elem->>'accessory2_id', (elem->>'accessory2_level')::int
    );
  end loop;

  select count(distinct pet_id) into distinct_pet_count from fulfillment_team_slots where fulfillment_id = new_fulfillment_id;
  if distinct_pet_count <> 4 then
    raise exception 'A team must use 4 distinct pets';
  end if;

  for img in select * from jsonb_array_elements(p_images) loop
    insert into fulfillment_images (fulfillment_id, kind, storage_path)
    values (new_fulfillment_id, img->>'kind', img->>'storage_path');
  end loop;

  return new_fulfillment_id;
end;
$$;

-- Replace admin_decide_fulfillment: approving now ALSO publishes the
-- fulfillment into the searchable `builds` table (pre-verified, since an
-- admin already reviewed the proof screenshots as part of approving it),
-- so it shows up in normal floor search for anyone, not just visible to
-- the original requester.
create or replace function admin_decide_fulfillment(p_fulfillment_id uuid, p_status text) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_fulfiller uuid;
  target_request uuid;
  target_stage int;
  target_note text;
  target_show boolean;
  new_build_id uuid;
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admin only';
  end if;
  if p_status not in ('verified', 'rejected') then
    raise exception 'Invalid status';
  end if;

  select f.fulfiller_id, f.request_id, r.stage, f.note, f.show_fulfiller
  into target_fulfiller, target_request, target_stage, target_note, target_show
  from fulfillments f
  join requests r on r.id = f.request_id
  where f.id = p_fulfillment_id;

  if target_fulfiller is null then
    raise exception 'Fulfillment not found';
  end if;

  update fulfillments set status = p_status, karma_awarded = (p_status = 'verified') where id = p_fulfillment_id;

  if p_status = 'verified' then
    update requests set fulfilled = true where id = target_request;

    insert into builds (stage, author_id, show_author, note, status, confirmations)
    values (target_stage, target_fulfiller, target_show, target_note, 'verified', 0)
    returning id into new_build_id;

    insert into build_team_slots (
      build_id, slot_index, pet_id, pet_level, hat_id, hat_level,
      scarf_id, scarf_level, accessory1_id, accessory1_level, accessory2_id, accessory2_level
    )
    select new_build_id, slot_index, pet_id, pet_level, hat_id, hat_level,
           scarf_id, scarf_level, accessory1_id, accessory1_level, accessory2_id, accessory2_level
    from fulfillment_team_slots
    where fulfillment_id = p_fulfillment_id;

    insert into build_images (build_id, kind, storage_path)
    select new_build_id, kind, storage_path
    from fulfillment_images
    where fulfillment_id = p_fulfillment_id;
  end if;

  perform recompute_karma(target_fulfiller);
end;
$$;

-- Note: this new build is inserted directly as 'verified', not via an
-- UPDATE from pending → verified, so the grant_lookup_on_verify trigger
-- (which only fires on UPDATE) does NOT give the fulfiller a bonus lookup
-- the way a normal build submission does. That's a deliberate scope
-- decision for now — say the word if you want that reward extended to
-- cover this path too.

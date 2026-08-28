-- ============================================================
-- voidpros — requests, fulfillment, and unified karma
-- ============================================================

-- ---------- karma now has two sources: build upvotes AND fulfillment
-- rewards. The old sync_author_karma trigger did a flat "karma = sum of
-- upvotes" which would silently WIPE OUT any fulfillment karma the next
-- time a vote changed. This replaces it with a shared recompute function
-- that always accounts for both, so neither source can clobber the other.
create function recompute_karma(target_user uuid) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  build_karma int;
  fulfillment_karma int;
begin
  select coalesce(sum(b.upvotes), 0) into build_karma
  from builds b where b.author_id = target_user and b.status = 'verified';

  select coalesce(count(*) * 10, 0) into fulfillment_karma
  from fulfillments f where f.fulfiller_id = target_user and f.status = 'verified';

  perform set_config('app.bypass_profile_guard', 'true', true);
  update profiles set karma = build_karma + fulfillment_karma where id = target_user;
end;
$$;

create or replace function sync_author_karma() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected_build_id uuid := coalesce(new.build_id, old.build_id);
  affected_author uuid;
begin
  select author_id into affected_author from builds where id = affected_build_id;
  if affected_author is not null then
    perform recompute_karma(affected_author);
  end if;
  return null;
end;
$$;

-- ---------- creating a request (subscriber feature) ----------
-- Snapshots the CALLER's own current pets/items server-side — never trusts
-- a client-submitted list — so a request always reflects what someone
-- actually owns at the moment they ask for help.
create function create_request(p_stage int, p_show_requester boolean) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_request_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to submit a request';
  end if;
  if not exists (select 1 from profiles where id = auth.uid() and is_subscribed = true) then
    raise exception 'Submitting a request is a subscriber feature';
  end if;
  if p_stage is null or p_stage < 1 then
    raise exception 'A valid floor number is required';
  end if;

  insert into requests (stage, requester_id, show_requester)
  values (p_stage, auth.uid(), p_show_requester)
  returning id into new_request_id;

  insert into request_pets (request_id, pet_id)
  select new_request_id, pet_id from user_pets where user_id = auth.uid();

  insert into request_items (request_id, item_id, count)
  select new_request_id, item_id, count from user_items where user_id = auth.uid();

  if not exists (select 1 from request_pets where request_id = new_request_id) then
    raise exception 'Add at least one pet to your collection before submitting a request';
  end if;

  return new_request_id;
end;
$$;

-- ---------- fulfilling a request ----------
-- Validates that every pet AND every item used is actually within the
-- requester's pool, and that item usage doesn't exceed the quantity they
-- own — same anti-cheat rigor as a normal build submission, but checked
-- against a specific request's snapshot instead of the game catalog.
create function submit_fulfillment(
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
  slot jsonb;
  img jsonb;
  distinct_pet_count int;
  allowed_pets text[];
  bad_pet text;
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

  select array_agg(pet_id) into allowed_pets from request_pets where request_id = p_request_id;

  select slot->>'pet_id' into bad_pet
  from jsonb_array_elements(p_team) slot
  where not (slot->>'pet_id' = any(allowed_pets))
  limit 1;
  if bad_pet is not null then
    raise exception 'Pet % is not in the requester''s pool', bad_pet;
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

  for slot in select * from jsonb_array_elements(p_team) loop
    insert into fulfillment_team_slots (
      fulfillment_id, slot_index, pet_id, pet_level, hat_id, hat_level,
      scarf_id, scarf_level, accessory1_id, accessory1_level, accessory2_id, accessory2_level
    ) values (
      new_fulfillment_id,
      (slot->>'slot_index')::int,
      slot->>'pet_id', (slot->>'pet_level')::int,
      slot->>'hat_id', (slot->>'hat_level')::int,
      slot->>'scarf_id', (slot->>'scarf_level')::int,
      slot->>'accessory1_id', (slot->>'accessory1_level')::int,
      slot->>'accessory2_id', (slot->>'accessory2_level')::int
    );
  end loop;

  select count(distinct pet_id) into distinct_pet_count from fulfillment_team_slots where fulfillment_id = new_fulfillment_id;
  if distinct_pet_count <> 4 then
    raise exception 'A team must use 4 distinct pets';
  end if;

  -- item quantity check: tally how many of each item this team actually
  -- uses, and reject if any item is used more times than the requester owns
  create temporary table if not exists tmp_item_usage (item_id text primary key, qty int) on commit drop;
  delete from tmp_item_usage;

  for slot in select * from jsonb_array_elements(p_team) loop
    insert into tmp_item_usage(item_id, qty) values (slot->>'hat_id', 1)
      on conflict (item_id) do update set qty = tmp_item_usage.qty + 1;
    insert into tmp_item_usage(item_id, qty) values (slot->>'scarf_id', 1)
      on conflict (item_id) do update set qty = tmp_item_usage.qty + 1;
    insert into tmp_item_usage(item_id, qty) values (slot->>'accessory1_id', 1)
      on conflict (item_id) do update set qty = tmp_item_usage.qty + 1;
    insert into tmp_item_usage(item_id, qty) values (slot->>'accessory2_id', 1)
      on conflict (item_id) do update set qty = tmp_item_usage.qty + 1;
  end loop;

  if exists (
    select 1 from tmp_item_usage u
    left join request_items ri on ri.request_id = p_request_id and ri.item_id = u.item_id
    where u.qty > coalesce(ri.count, 0)
  ) then
    raise exception 'This team uses more of an item than the requester owns';
  end if;

  for img in select * from jsonb_array_elements(p_images) loop
    insert into fulfillment_images (fulfillment_id, kind, storage_path)
    values (new_fulfillment_id, img->>'kind', img->>'storage_path');
  end loop;

  return new_fulfillment_id;
end;
$$;

-- ---------- admin approves/rejects a fulfillment ----------
-- Approving marks the request fulfilled and awards 10 karma via the same
-- recompute_karma function builds use, so both sources stay consistent.
create function admin_decide_fulfillment(p_fulfillment_id uuid, p_status text) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_fulfiller uuid;
  target_request uuid;
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admin only';
  end if;
  if p_status not in ('verified', 'rejected') then
    raise exception 'Invalid status';
  end if;

  select fulfiller_id, request_id into target_fulfiller, target_request
  from fulfillments where id = p_fulfillment_id;

  if target_fulfiller is null then
    raise exception 'Fulfillment not found';
  end if;

  update fulfillments set status = p_status, karma_awarded = (p_status = 'verified') where id = p_fulfillment_id;

  if p_status = 'verified' then
    update requests set fulfilled = true where id = target_request;
  end if;

  perform recompute_karma(target_fulfiller);
end;
$$;

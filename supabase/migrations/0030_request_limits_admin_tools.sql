-- ============================================================
-- voidpros — request limits, admin quick-submit, admin deletes
-- ============================================================

-- ---------- one active request per player, but they can cancel ----------
alter table requests add column cancelled boolean not null default false;

create or replace function create_request(p_stage int, p_show_requester boolean) returns uuid
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
  if exists (select 1 from requests where requester_id = auth.uid() and fulfilled = false and cancelled = false) then
    raise exception 'You already have an active request — cancel it before posting another';
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

create function cancel_request(p_request_id uuid) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Must be signed in';
  end if;
  if not exists (select 1 from requests where id = p_request_id and requester_id = auth.uid()) then
    raise exception 'Request not found';
  end if;
  if exists (select 1 from requests where id = p_request_id and fulfilled = true) then
    raise exception 'This request has already been fulfilled';
  end if;

  update requests set cancelled = true where id = p_request_id;
end;
$$;

-- Cancelled requests can no longer be attempted, same as fulfilled ones.
create or replace function submit_fulfillment(
  p_request_id uuid,
  p_note text,
  p_show_fulfiller boolean,
  p_images jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_fulfillment_id uuid;
  img jsonb;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to submit a fulfillment';
  end if;
  if not exists (select 1 from requests where id = p_request_id and not fulfilled and not cancelled) then
    raise exception 'This request is no longer open';
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

  for img in select * from jsonb_array_elements(p_images) loop
    insert into fulfillment_images (fulfillment_id, kind, storage_path)
    values (new_fulfillment_id, img->>'kind', img->>'storage_path');
  end loop;

  return new_fulfillment_id;
end;
$$;

-- ---------- admin quick-submit: skip photos/review entirely, publish now ----------
create function admin_quick_submit_build(p_stage int, p_team jsonb, p_note text) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_build_id uuid;
  elem jsonb;
  distinct_pet_count int;
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admin only';
  end if;
  if p_stage is null or p_stage < 1 then
    raise exception 'A valid floor number is required';
  end if;
  if jsonb_array_length(p_team) <> 4 then
    raise exception 'A build must have exactly 4 team slots';
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
  if distinct_pet_count <> 4 then
    raise exception 'A team must use 4 distinct pets';
  end if;

  return new_build_id;
end;
$$;

-- ---------- admin delete: builds and comments ----------
create function admin_delete_build(p_build_id uuid) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admin only';
  end if;
  delete from builds where id = p_build_id;
end;
$$;

create function admin_delete_comment(p_comment_id uuid) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admin only';
  end if;
  delete from comments where id = p_comment_id;
end;
$$;

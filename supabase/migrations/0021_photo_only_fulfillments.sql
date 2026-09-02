-- ============================================================
-- voidpros — photo-only fulfillment attempts
-- Fulfillers no longer pick pets/items/levels themselves — same change
-- migration 0014 made for regular build submissions. They just submit
-- proof screenshots; an admin looks at the screenshots and enters the
-- team during review, checked against the request's actual pool.
-- ============================================================

-- ---------- submitting an attempt: photos only, no team ----------
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
  if not exists (select 1 from requests where id = p_request_id and not fulfilled) then
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

-- ---------- admin approval: enters the team, checked against the
-- request's pool, then publishes it exactly like admin_approve_build ----------
create or replace function admin_approve_fulfillment(p_fulfillment_id uuid, p_team jsonb) returns void
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
  elem jsonb;
  team_len int;
  allowed_pets text[];
  bad_pet text;
  distinct_pet_count int;
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admin only';
  end if;

  select f.fulfiller_id, f.request_id, r.stage, f.note, f.show_fulfiller
  into target_fulfiller, target_request, target_stage, target_note, target_show
  from fulfillments f
  join requests r on r.id = f.request_id
  where f.id = p_fulfillment_id and f.status = 'pending';

  if target_fulfiller is null then
    raise exception 'Fulfillment not found or already decided';
  end if;

  team_len := jsonb_array_length(p_team);
  if team_len < 1 or team_len > 4 then
    raise exception 'Submit between 1 and 4 pets';
  end if;

  select array_agg(pet_id) into allowed_pets from request_pets where request_id = target_request;

  select x.pet_id into bad_pet
  from (select value ->> 'pet_id' as pet_id from jsonb_array_elements(p_team)) x
  where not (x.pet_id = any(allowed_pets))
  limit 1;
  if bad_pet is not null then
    raise exception 'Pet % is not in the requester''s pool', bad_pet;
  end if;

  update fulfillments set status = 'verified', karma_awarded = true where id = p_fulfillment_id;
  update requests set fulfilled = true where id = target_request;

  insert into builds (stage, author_id, show_author, note, status, confirmations)
  values (target_stage, target_fulfiller, target_show, target_note, 'verified', 0)
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
  if distinct_pet_count <> team_len then
    raise exception 'Each pet must be different — you repeated one';
  end if;

  -- item quantity check: must not exceed what the requester's snapshot owns
  create temporary table if not exists tmp_item_usage (item_id text primary key, qty int) on commit drop;
  delete from tmp_item_usage;

  for elem in select * from jsonb_array_elements(p_team) loop
    if nullif(elem->>'hat_id', '') is not null then
      insert into tmp_item_usage(item_id, qty) values (elem->>'hat_id', 1)
        on conflict (item_id) do update set qty = tmp_item_usage.qty + 1;
    end if;
    if nullif(elem->>'scarf_id', '') is not null then
      insert into tmp_item_usage(item_id, qty) values (elem->>'scarf_id', 1)
        on conflict (item_id) do update set qty = tmp_item_usage.qty + 1;
    end if;
    if nullif(elem->>'accessory1_id', '') is not null then
      insert into tmp_item_usage(item_id, qty) values (elem->>'accessory1_id', 1)
        on conflict (item_id) do update set qty = tmp_item_usage.qty + 1;
    end if;
    if nullif(elem->>'accessory2_id', '') is not null then
      insert into tmp_item_usage(item_id, qty) values (elem->>'accessory2_id', 1)
        on conflict (item_id) do update set qty = tmp_item_usage.qty + 1;
    end if;
  end loop;

  if exists (
    select 1 from tmp_item_usage u
    left join request_items ri on ri.request_id = target_request and ri.item_id = u.item_id
    where u.qty > coalesce(ri.count, 0)
  ) then
    raise exception 'This uses more of an item than the requester owns';
  end if;

  insert into build_images (build_id, kind, storage_path)
  select new_build_id, kind, storage_path
  from fulfillment_images
  where fulfillment_id = p_fulfillment_id;

  update fulfillments set resulting_build_id = new_build_id where id = p_fulfillment_id;

  perform recompute_karma(target_fulfiller);
end;
$$;

-- ---------- admin rejection: unchanged in effect, just its own function
-- now that approval needs a team argument and rejection doesn't ----------
create or replace function admin_reject_fulfillment(p_fulfillment_id uuid) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admin only';
  end if;
  update fulfillments set status = 'rejected' where id = p_fulfillment_id and status = 'pending';
end;
$$;

-- fulfillment_team_slots is no longer written at submission time — the
-- table stays (older verified rows still reference it), but nothing new
-- inserts into it going forward; admin_approve_fulfillment writes straight
-- to build_team_slots instead.

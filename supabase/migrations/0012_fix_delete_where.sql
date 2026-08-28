-- ============================================================
-- voidpros — fix "DELETE requires a WHERE clause"
-- Supabase enables a safety extension that blocks DELETE/UPDATE statements
-- without an explicit WHERE clause. `delete from tmp_item_usage;` had none.
-- ============================================================

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
  allowed_pets text[];
  bad_pet text;
  team_len int;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to submit a fulfillment';
  end if;
  if not exists (select 1 from requests where id = p_request_id and not fulfilled) then
    raise exception 'This request is no longer open';
  end if;

  team_len := jsonb_array_length(p_team);
  if team_len < 1 or team_len > 4 then
    raise exception 'Submit between 1 and 4 pets';
  end if;

  select array_agg(pet_id) into allowed_pets from request_pets where request_id = p_request_id;

  select x.pet_id into bad_pet
  from (select value ->> 'pet_id' as pet_id from jsonb_array_elements(p_team)) x
  where not (x.pet_id = any(allowed_pets))
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

  for elem in select * from jsonb_array_elements(p_team) loop
    insert into fulfillment_team_slots (
      fulfillment_id, slot_index, pet_id, pet_level, hat_id, hat_level,
      scarf_id, scarf_level, accessory1_id, accessory1_level, accessory2_id, accessory2_level
    ) values (
      new_fulfillment_id,
      (elem->>'slot_index')::int,
      elem->>'pet_id', (elem->>'pet_level')::int,
      nullif(elem->>'hat_id', ''), nullif(elem->>'hat_level', '')::int,
      nullif(elem->>'scarf_id', ''), nullif(elem->>'scarf_level', '')::int,
      nullif(elem->>'accessory1_id', ''), nullif(elem->>'accessory1_level', '')::int,
      nullif(elem->>'accessory2_id', ''), nullif(elem->>'accessory2_level', '')::int
    );
  end loop;

  select count(distinct pet_id) into distinct_pet_count from fulfillment_team_slots where fulfillment_id = new_fulfillment_id;
  if distinct_pet_count <> team_len then
    raise exception 'Each pet must be different — you repeated one';
  end if;

  create temporary table if not exists tmp_item_usage (item_id text primary key, qty int) on commit drop;
  delete from tmp_item_usage where true;

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
    left join request_items ri on ri.request_id = p_request_id and ri.item_id = u.item_id
    where u.qty > coalesce(ri.count, 0)
  ) then
    raise exception 'This uses more of an item than the requester owns';
  end if;

  for img in select * from jsonb_array_elements(p_images) loop
    insert into fulfillment_images (fulfillment_id, kind, storage_path)
    values (new_fulfillment_id, img->>'kind', img->>'storage_path');
  end loop;

  return new_fulfillment_id;
end;
$$;

-- ============================================================
-- voidpros — remove karma system, add leaderboards
--
-- Karma is gone: no more computing it, displaying it, or awarding the
-- 100-karma free-lookup bonus going forward. (Anyone who already earned
-- that one-time +5 lookup bonus keeps it — trial_lookups_limit isn't
-- touched here, so nothing is clawed back.)
--
-- Replaces it with two leaderboard functions:
--   get_leaderboard_top(category, range, limit) — top N ranked users
--   get_my_leaderboard_rank(category, range)    — caller's own rank,
--     even outside the top N (no rows back if they have 0 submissions
--     in that category/range — the frontend shows "N/A" for that case)
--
-- category is 'completions' or 'challenges'. range is '7d', '30d', or
-- 'all'. Completions = standalone build submissions only — builds
-- created via fulfilling someone else's Challenge request are excluded
-- here (they're counted as Challenges instead) by checking that no
-- fulfillment's resulting_build_id points at them.
--
-- Anonymous submissions (show_author/show_fulfiller = false) still count
-- toward a player's leaderboard total and still show their real username
-- here — that anonymity toggle only hides authorship on the public
-- floor-search build listing, not on the leaderboard.
-- ============================================================

-- ---------- 1. stop guarding a column that's about to not exist ----------
create or replace function guard_protected_profile_columns() returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_setting('app.bypass_profile_guard', true) is distinct from 'true' then
    if new.is_admin is distinct from old.is_admin
      or new.is_subscribed is distinct from old.is_subscribed
      or new.trial_lookups_used is distinct from old.trial_lookups_used
      or new.trial_lookups_limit is distinct from old.trial_lookups_limit
      or new.stripe_customer_id is distinct from old.stripe_customer_id
      or new.stripe_subscription_id is distinct from old.stripe_subscription_id
    then
      raise exception 'This field can only be changed by a trusted server process';
    end if;
  end if;
  return new;
end;
$$;

-- ---------- 2. admin_approve_build — drop the recompute_karma call ----------
create or replace function admin_approve_build(p_build_id uuid, p_team jsonb) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  elem jsonb;
  team_len int;
  distinct_pet_count int;
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

  update builds set status = 'verified' where id = p_build_id;
end;
$$;

-- ---------- 3. admin_approve_fulfillment — drop the recompute_karma call ----------
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

  update fulfillments set status = 'verified' where id = p_fulfillment_id;
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
end;
$$;

-- ---------- 4. drop the now-unused karma function and columns ----------
drop function if exists recompute_karma(uuid);
alter table profiles drop column if exists karma;
alter table profiles drop column if exists karma_bonus_granted;
alter table fulfillments drop column if exists karma_awarded;

-- ---------- 5. leaderboards ----------
create or replace function get_leaderboard_top(p_category text, p_range text, p_limit int default 10)
returns table(rnk bigint, user_id uuid, username text, submission_count bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  cutoff timestamptz;
begin
  if p_range = '7d' then
    cutoff := now() - interval '7 days';
  elsif p_range = '30d' then
    cutoff := now() - interval '30 days';
  else
    cutoff := '-infinity'::timestamptz;
  end if;

  if p_category = 'completions' then
    return query
      select x.rnk, x.uid, x.uname, x.cnt from (
        select
          b.author_id as uid,
          p.username as uname,
          count(*) as cnt,
          rank() over (order by count(*) desc) as rnk
        from builds b
        join profiles p on p.id = b.author_id
        where b.status = 'verified'
          and b.author_id is not null
          and b.created_at >= cutoff
          and not exists (select 1 from fulfillments f where f.resulting_build_id = b.id)
        group by b.author_id, p.username
      ) x
      order by x.rnk asc
      limit p_limit;
  elsif p_category = 'challenges' then
    return query
      select x.rnk, x.uid, x.uname, x.cnt from (
        select
          f.fulfiller_id as uid,
          p.username as uname,
          count(*) as cnt,
          rank() over (order by count(*) desc) as rnk
        from fulfillments f
        join profiles p on p.id = f.fulfiller_id
        where f.status = 'verified' and f.created_at >= cutoff
        group by f.fulfiller_id, p.username
      ) x
      order by x.rnk asc
      limit p_limit;
  else
    raise exception 'Invalid category';
  end if;
end;
$$;

create or replace function get_my_leaderboard_rank(p_category text, p_range text)
returns table(rnk bigint, submission_count bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  cutoff timestamptz;
begin
  if auth.uid() is null then
    return;
  end if;

  if p_range = '7d' then
    cutoff := now() - interval '7 days';
  elsif p_range = '30d' then
    cutoff := now() - interval '30 days';
  else
    cutoff := '-infinity'::timestamptz;
  end if;

  if p_category = 'completions' then
    return query
      select x.rnk, x.cnt from (
        select
          b.author_id as uid,
          count(*) as cnt,
          rank() over (order by count(*) desc) as rnk
        from builds b
        where b.status = 'verified'
          and b.author_id is not null
          and b.created_at >= cutoff
          and not exists (select 1 from fulfillments f where f.resulting_build_id = b.id)
        group by b.author_id
      ) x
      where x.uid = auth.uid();
  elsif p_category = 'challenges' then
    return query
      select x.rnk, x.cnt from (
        select
          f.fulfiller_id as uid,
          count(*) as cnt,
          rank() over (order by count(*) desc) as rnk
        from fulfillments f
        where f.status = 'verified' and f.created_at >= cutoff
        group by f.fulfiller_id
      ) x
      where x.uid = auth.uid();
  else
    raise exception 'Invalid category';
  end if;
end;
$$;

-- ============================================================
-- voidpros — Achievements & Cosmetics
--
-- Three achievement tracks:
--   completions — verified builds submitted via Submit (source = 'completion')
--   challenges  — verified fulfillments (Challenges)
--   searches    — total floor searches performed (profiles.total_searches)
--
-- Each achievement grants exactly one cosmetic — a profile icon players
-- can equip once unlocked, shown next to their username on build cards,
-- comments, and their own profile.
-- ============================================================

-- ---------- 1. distinguish where a `builds` row actually came from ----------
-- admin_approve_build only ever operates on regular player submissions, so
-- those are unambiguously 'completion'. Challenge-derived rows and
-- Quick-Submit rows are backfilled below using real existing links —
-- fulfillments.resulting_build_id and quick_submitted_by — rather than
-- guessing, so historical counts stay accurate.
alter table builds add column source text not null default 'completion'
  check (source in ('completion', 'challenge', 'quick_submit'));

update builds set source = 'challenge'
where id in (select resulting_build_id from fulfillments where resulting_build_id is not null);

update builds set source = 'quick_submit'
where quick_submitted_by is not null;

-- ---------- 2. per-user lifetime search count ----------
alter table profiles add column total_searches int not null default 0;

-- ---------- 3. achievement catalog ----------
create table achievements (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('completions', 'challenges', 'searches')),
  threshold int not null,
  name text not null,
  image_url text,
  created_at timestamptz not null default now(),
  unique (category, threshold)
);

alter table achievements enable row level security;
create policy "achievements are publicly readable" on achievements for select using (true);

insert into achievements (category, threshold, name) values
  ('completions', 1, 'First Completion'),
  ('completions', 10, '10 Completions'),
  ('completions', 50, '50 Completions'),
  ('completions', 100, '100 Completions'),
  ('completions', 250, '250 Completions'),
  ('completions', 500, '500 Completions'),
  ('completions', 1000, '1,000 Completions'),
  ('challenges', 1, 'First Challenge'),
  ('challenges', 5, '5 Challenges'),
  ('challenges', 10, '10 Challenges'),
  ('challenges', 20, '20 Challenges'),
  ('challenges', 50, '50 Challenges'),
  ('challenges', 100, '100 Challenges'),
  ('challenges', 250, '250 Challenges'),
  ('searches', 1, 'First Search'),
  ('searches', 50, '50 Searches'),
  ('searches', 500, '500 Searches'),
  ('searches', 1000, '1,000 Searches');

-- ---------- 4. which achievements a user has actually unlocked ----------
create table user_achievements (
  user_id uuid not null references profiles(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table user_achievements enable row level security;
create policy "users can view their own unlocked achievements" on user_achievements
  for select using (auth.uid() = user_id);

-- ---------- 5. which cosmetic is currently equipped ----------
alter table profiles add column equipped_achievement_id uuid references achievements(id);

-- Protect it the same way as is_admin/is_subscribed/stripe fields — only a
-- trusted server process (equip_achievement_cosmetic below, which
-- validates ownership first) can change it.
create or replace function guard_protected_profile_columns() returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_setting('app.bypass_profile_guard', true) is distinct from 'true' then
    if new.is_admin is distinct from old.is_admin
      or new.is_subscribed is distinct from old.is_subscribed
      or new.stripe_customer_id is distinct from old.stripe_customer_id
      or new.stripe_subscription_id is distinct from old.stripe_subscription_id
      or new.equipped_achievement_id is distinct from old.equipped_achievement_id
    then
      raise exception 'This field can only be changed by a trusted server process';
    end if;
  end if;
  return new;
end;
$$;

-- ---------- 6. grant any newly-crossed achievements ----------
-- Safe to call repeatedly — `on conflict do nothing` means re-crossing an
-- already-unlocked threshold (impossible anyway, since counts only go up)
-- never errors.
create or replace function grant_achievements_for_user(p_user_id uuid) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  completions_count int;
  challenges_count int;
  searches_count int;
begin
  if p_user_id is null then
    return;
  end if;

  select count(*) into completions_count from builds
    where author_id = p_user_id and status = 'verified' and source = 'completion';
  select count(*) into challenges_count from fulfillments
    where fulfiller_id = p_user_id and status = 'verified';
  select coalesce(total_searches, 0) into searches_count from profiles where id = p_user_id;

  insert into user_achievements (user_id, achievement_id)
  select p_user_id, a.id
  from achievements a
  where
    (a.category = 'completions' and a.threshold <= completions_count)
    or (a.category = 'challenges' and a.threshold <= challenges_count)
    or (a.category = 'searches' and a.threshold <= searches_count)
  on conflict (user_id, achievement_id) do nothing;
end;
$$;

-- ---------- 7. equip an unlocked cosmetic (or pass null to unequip) ----------
create or replace function equip_achievement_cosmetic(p_achievement_id uuid) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Must be signed in';
  end if;

  if p_achievement_id is not null and not exists (
    select 1 from user_achievements where user_id = auth.uid() and achievement_id = p_achievement_id
  ) then
    raise exception 'You have not unlocked this cosmetic';
  end if;

  perform set_config('app.bypass_profile_guard', 'true', true);
  update profiles set equipped_achievement_id = p_achievement_id where id = auth.uid();
end;
$$;

-- ---------- 8. everything the Achievements page needs, in one call ----------
create or replace function get_my_achievements() returns table (
  id uuid,
  category text,
  threshold int,
  name text,
  image_url text,
  unlocked boolean,
  unlocked_at timestamptz,
  current_progress int
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller uuid := auth.uid();
  completions_count int;
  challenges_count int;
  searches_count int;
begin
  if caller is null then
    raise exception 'Must be signed in';
  end if;

  select count(*) into completions_count from builds
    where author_id = caller and status = 'verified' and source = 'completion';
  select count(*) into challenges_count from fulfillments
    where fulfiller_id = caller and status = 'verified';
  select coalesce(total_searches, 0) into searches_count from profiles where id = caller;

  return query
    select
      a.id, a.category, a.threshold, a.name, a.image_url,
      (ua.user_id is not null) as unlocked,
      ua.unlocked_at,
      case a.category
        when 'completions' then completions_count
        when 'challenges' then challenges_count
        when 'searches' then searches_count
      end as current_progress
    from achievements a
    left join user_achievements ua on ua.achievement_id = a.id and ua.user_id = caller
    order by
      case a.category when 'completions' then 1 when 'challenges' then 2 else 3 end,
      a.threshold;
end;
$$;

-- ---------- 9. hook into every place progress actually happens ----------

-- Regular Completions: admin_approve_build always operates on a player
-- submission (author_id already set at submit time), so it's always
-- source = 'completion' by definition — no need to set it explicitly.
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
  target_author uuid;
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

  select stage, author_id into target_stage, target_author from builds where id = p_build_id;
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

  perform grant_achievements_for_user(target_author);
end;
$$;

-- Challenges
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

  insert into builds (stage, author_id, show_author, note, status, confirmations, source)
  values (target_stage, target_fulfiller, target_show, target_note, 'verified', 0, 'challenge')
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

  perform grant_achievements_for_user(target_fulfiller);
end;
$$;

-- Quick Submit: explicitly tag source so these never get miscounted as
-- player Completions (author_id is null here anyway, so no player ever
-- gets achievement credit for these — nothing to grant).
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

  insert into builds (stage, author_id, show_author, note, status, confirmations, quick_submitted_by, source)
  values (p_stage, null, false, nullif(trim(p_note), ''), 'verified', 0, caller, 'quick_submit')
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

-- Searches
create or replace function increment_floor_search(p_stage int) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller uuid := auth.uid();
begin
  if p_stage is null or p_stage < 1 then
    return;
  end if;

  insert into floor_search_counts (stage, search_count, last_searched_at)
  values (p_stage, 1, now())
  on conflict (stage) do update
    set search_count = floor_search_counts.search_count + 1,
        last_searched_at = now();

  if caller is not null then
    update profiles set total_searches = total_searches + 1 where id = caller;
    perform grant_achievements_for_user(caller);
  end if;
end;
$$;

-- ---------- 10. surface the equipped cosmetic wherever authors show up ----------
create or replace function get_search_results(p_stage int) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller uuid := auth.uid();
  is_sub boolean := false;
  used_preview boolean := false;
  result jsonb;
begin
  if caller is not null then
    select coalesce(is_subscribed, false), coalesce(first_search_preview_used, false)
      into is_sub, used_preview
      from profiles where id = caller;

    if not is_sub and not used_preview then
      perform set_config('app.bypass_profile_guard', 'true', true);
      update profiles set first_search_preview_used = true where id = caller;
      is_sub := true;
    end if;
  end if;

  with base as (
    select
      bl.id, bl.stage, bl.note, bl.status, bl.upvotes, bl.comment_count,
      bl.show_author, bl.author_id, bl.created_at,
      (case when bl.status = 'verified' then 1 else 0 end) as status_rank,
      jsonb_build_object('username', p.username, 'cosmetic_url', ea.image_url) as author,
      is_sub as items_visible,
      exists (
        select 1 from build_team_slots ts3
        where ts3.build_id = bl.id
          and (ts3.hat_id is not null or ts3.scarf_id is not null or ts3.accessory1_id is not null or ts3.accessory2_id is not null)
      ) as has_items,
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', ts.id,
            'slot_index', ts.slot_index,
            'pet_id', ts.pet_id,
            'pet_level', ts.pet_level,
            'hat_id', case when is_sub then ts.hat_id else null end,
            'hat_level', case when is_sub then ts.hat_level else null end,
            'scarf_id', case when is_sub then ts.scarf_id else null end,
            'scarf_level', case when is_sub then ts.scarf_level else null end,
            'accessory1_id', case when is_sub then ts.accessory1_id else null end,
            'accessory1_level', case when is_sub then ts.accessory1_level else null end,
            'accessory2_id', case when is_sub then ts.accessory2_id else null end,
            'accessory2_level', case when is_sub then ts.accessory2_level else null end
          ) order by ts.slot_index
        )
        from build_team_slots ts
        where ts.build_id = bl.id
      ) as team,
      (
        select jsonb_agg(jsonb_build_object('kind', im.kind, 'storage_path', im.storage_path))
        from build_images im
        where im.build_id = bl.id and (is_sub or im.kind <> 'items')
      ) as images,
      (
        select string_agg(pet_id || ':' || pet_level::text, '|' order by pet_id)
        from build_team_slots ts4
        where ts4.build_id = bl.id
      ) as pet_signature
    from builds bl
    left join profiles p on p.id = bl.author_id
    left join achievements ea on ea.id = p.equipped_achievement_id
    where bl.stage = p_stage and bl.status <> 'rejected'
  ),
  ranked as (
    select
      b.*,
      row_number() over (
        partition by case when is_sub then b.id::text else b.pet_signature end
        order by b.status_rank desc, b.upvotes desc
      ) as rn
    from base b
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id, 'stage', r.stage, 'note', r.note, 'status', r.status,
        'upvotes', r.upvotes, 'comment_count', r.comment_count,
        'show_author', r.show_author, 'author_id', r.author_id,
        'created_at', r.created_at, 'author', r.author,
        'items_visible', r.items_visible, 'has_items', r.has_items,
        'team', r.team, 'images', r.images
      )
      order by r.status_rank desc, r.upvotes desc
    ),
    '[]'::jsonb
  )
  into result
  from ranked r
  where r.rn = 1;

  return result;
end;
$$;

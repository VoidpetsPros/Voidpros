-- ============================================================
-- voidpros — karma overhaul + onboarding tutorial tracking
-- 1. Karma no longer comes from upvotes at all.
-- 2. Verified build submissions ("Completions") now earn 5 karma.
-- 3. Verified fulfillments ("Challenges") still earn 10 karma, unchanged.
-- 4. Hitting 100 karma grants a one-time +5 free lookups bonus.
-- 5. Adds a flag so the first-time onboarding tutorial only shows once
--    per account (until completed or dismissed).
-- ============================================================

-- ---------- stop awarding karma for upvotes ----------
drop trigger if exists on_vote_change_sync_karma on build_votes;
drop function if exists sync_author_karma();

alter table profiles add column karma_bonus_granted boolean not null default false;

-- ---------- new karma formula: 5 per verified build + 10 per verified fulfillment ----------
create or replace function recompute_karma(target_user uuid) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  build_karma int;
  fulfillment_karma int;
  new_karma int;
  already_bonused boolean;
begin
  select coalesce(count(*) * 5, 0) into build_karma
  from builds b where b.author_id = target_user and b.status = 'verified';

  select coalesce(count(*) * 10, 0) into fulfillment_karma
  from fulfillments f where f.fulfiller_id = target_user and f.status = 'verified';

  new_karma := build_karma + fulfillment_karma;

  select karma_bonus_granted into already_bonused from profiles where id = target_user;

  perform set_config('app.bypass_profile_guard', 'true', true);
  update profiles set karma = new_karma where id = target_user;

  -- One-time reward for reaching 100 karma: 5 extra free lookups.
  if new_karma >= 100 and not coalesce(already_bonused, false) then
    perform set_config('app.bypass_profile_guard', 'true', true);
    update profiles
    set trial_lookups_limit = trial_lookups_limit + 5, karma_bonus_granted = true
    where id = target_user;
  end if;
end;
$$;

-- ---------- build submissions now earn karma too — admin_approve_build
-- needs to call recompute_karma the same way admin_approve_fulfillment does ----------
create or replace function admin_approve_build(p_build_id uuid, p_team jsonb) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  elem jsonb;
  distinct_pet_count int;
  target_author uuid;
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Admin only';
  end if;
  if jsonb_array_length(p_team) <> 4 then
    raise exception 'A build must have exactly 4 team slots';
  end if;

  for elem in select * from jsonb_array_elements(p_team) loop
    insert into build_team_slots (
      build_id, slot_index, pet_id, pet_level, hat_id, hat_level,
      scarf_id, scarf_level, accessory1_id, accessory1_level, accessory2_id, accessory2_level
    ) values (
      p_build_id,
      (elem->>'slot_index')::int,
      elem->>'pet_id', (elem->>'pet_level')::int,
      elem->>'hat_id', (elem->>'hat_level')::int,
      elem->>'scarf_id', (elem->>'scarf_level')::int,
      elem->>'accessory1_id', (elem->>'accessory1_level')::int,
      elem->>'accessory2_id', (elem->>'accessory2_level')::int
    );
  end loop;

  select count(distinct pet_id) into distinct_pet_count from build_team_slots where build_id = p_build_id;
  if distinct_pet_count <> 4 then
    raise exception 'A team must use 4 distinct pets';
  end if;

  update builds set status = 'verified' where id = p_build_id returning author_id into target_author;

  if target_author is not null then
    perform recompute_karma(target_author);
  end if;
end;
$$;

-- ---------- onboarding tutorial: shows once per account until completed/dismissed ----------
alter table profiles add column tutorial_completed boolean not null default false;

create function complete_tutorial() returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Must be signed in';
  end if;
  update profiles set tutorial_completed = true where id = auth.uid();
end;
$$;

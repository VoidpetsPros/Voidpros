-- ============================================================
-- voidpros — karma from votes + submission reward
-- ============================================================

-- Whenever a vote is added/changed/removed, recompute the build author's
-- karma as the total upvotes across all of THEIR verified builds. Votes can
-- only exist on verified builds (enforced by a trigger from migration 0001),
-- so this only ever counts votes that were legitimately cast.
create function sync_author_karma() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected_build_id uuid := coalesce(new.build_id, old.build_id);
  affected_author uuid;
  total_karma int;
begin
  select author_id into affected_author from builds where id = affected_build_id;
  if affected_author is null then
    return null;
  end if;

  select coalesce(sum(b.upvotes), 0) into total_karma
  from builds b
  where b.author_id = affected_author and b.status = 'verified';

  perform set_config('app.bypass_profile_guard', 'true', true);
  update profiles set karma = total_karma where id = affected_author;

  return null;
end;
$$;

-- Named so it alphabetically sorts AFTER "on_build_vote_change" (migration
-- 0001's trigger, which updates builds.upvotes/downvotes) — Postgres fires
-- same-event triggers in name order, and this one needs to read the
-- already-updated vote counts, not stale ones.
create trigger on_vote_change_sync_karma
  after insert or update or delete on build_votes
  for each row execute procedure sync_author_karma();

-- When a build flips to verified (whether by admin approval or hitting 3
-- community confirmations), give the author one extra free lookup —
-- matching the "submit a build, earn a free lookup once it's verified" rule.
create function grant_lookup_on_verify() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'verified' and old.status is distinct from 'verified' then
    perform set_config('app.bypass_profile_guard', 'true', true);
    update profiles
    set trial_lookups_limit = trial_lookups_limit + 1
    where id = new.author_id;
  end if;
  return new;
end;
$$;

create trigger on_build_verified_grant_lookup
  after update on builds
  for each row execute procedure grant_lookup_on_verify();

-- Note: this covers karma from BUILD votes only. Fulfillment attempts (the
-- "beat my floor with only what I own" request feature) have their own
-- 10-karma reward per the original design — that gets wired up when the
-- requests/fulfillment flow itself is built, not here.

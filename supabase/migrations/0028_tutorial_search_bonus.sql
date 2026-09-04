-- ============================================================
-- voidpros — one-time tutorial search bonus
-- Reaching the "Search a floor" step in the tutorial grants +1 free lookup,
-- exactly once per account. The flag lives here, not in the tutorial's own
-- step state, so calling this repeatedly (e.g. clicking Back and forward
-- through the tutorial) can never grant more than one bonus.
-- ============================================================

alter table profiles add column tutorial_bonus_lookup_granted boolean not null default false;

create function grant_tutorial_search_bonus() returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Must be signed in';
  end if;

  if exists (select 1 from profiles where id = auth.uid() and tutorial_bonus_lookup_granted = true) then
    return; -- already granted, no-op
  end if;

  perform set_config('app.bypass_profile_guard', 'true', true);
  update profiles
  set trial_lookups_limit = trial_lookups_limit + 1, tutorial_bonus_lookup_granted = true
  where id = auth.uid();
end;
$$;

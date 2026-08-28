-- ============================================================
-- voidpros — admin accounts + build moderation
-- ============================================================

alter table profiles add column is_admin boolean not null default false;

-- ---------- lock down profile columns that must never be self-editable ----------
-- The existing "users can update their own profile" policy allows changing
-- ANY column on their own row — fine for username, but is_admin, karma,
-- is_subscribed, and the trial/stripe columns must never be settable by the
-- browser directly. This trigger blocks changes to those columns unless a
-- trusted server-side path explicitly allows it for this one statement.
create function guard_protected_profile_columns() returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_setting('app.bypass_profile_guard', true) is distinct from 'true' then
    if new.is_admin is distinct from old.is_admin
      or new.karma is distinct from old.karma
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

create trigger guard_profiles_before_update
  before update on profiles
  for each row execute procedure guard_protected_profile_columns();

-- The trial-lookup function needs to flip the bypass flag for its own
-- update, or the trigger above would now block it too.
create or replace function increment_trial_lookup() returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_count int;
begin
  perform set_config('app.bypass_profile_guard', 'true', true);
  update profiles
  set trial_lookups_used = trial_lookups_used + 1
  where id = auth.uid()
    and not is_subscribed
    and trial_lookups_used < trial_lookups_limit
  returning trial_lookups_used into new_count;
  return new_count;
end;
$$;

-- ---------- admins can approve/reject builds ----------
-- There was no UPDATE policy on `builds` at all until now, meaning nobody —
-- not even an admin — could change a build's status through the app.
create policy "admins can moderate builds" on builds for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

-- ============================================================
-- To make yourself an admin, run this separately (fill in your user id
-- from Authentication → Users in the dashboard):
--
--   select set_config('app.bypass_profile_guard', 'true', true);
--   update profiles set is_admin = true where id = 'paste-your-user-uuid-here';
--
-- The set_config line is required — without it, the guard trigger above
-- will correctly refuse the change, same as it would for anyone else.
-- ============================================================

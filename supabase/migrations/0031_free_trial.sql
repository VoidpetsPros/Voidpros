-- ============================================================
-- voidpros — 7-day free trial (card required via Stripe, one-time per account)
-- Starting the trial immediately zeroes out remaining free lookups. If the
-- trial isn't converted to a paid subscription, lookups stay at zero —
-- they're never restored. trial_used blocks ever starting a second trial.
-- ============================================================

alter table profiles add column trial_used boolean not null default false;

create or replace function admin_set_subscription_status(
  p_user_id uuid,
  p_customer_id text,
  p_subscription_id text,
  p_is_subscribed boolean,
  p_grant_trial boolean default false
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform set_config('app.bypass_profile_guard', 'true', true);
  update profiles
  set
    stripe_customer_id = coalesce(p_customer_id, stripe_customer_id),
    stripe_subscription_id = p_subscription_id,
    is_subscribed = p_is_subscribed,
    trial_used = case when p_grant_trial then true else trial_used end,
    trial_lookups_used = case when p_grant_trial then trial_lookups_limit else trial_lookups_used end
  where id = p_user_id;
end;
$$;

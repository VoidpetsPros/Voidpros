-- ============================================================
-- voidpros — Stripe subscription status writer
-- This is the ONLY way is_subscribed / stripe_customer_id /
-- stripe_subscription_id ever change. It's called exclusively by the
-- Stripe webhook handler using the Supabase service-role key — never by
-- a regular user's session. The REVOKE/GRANT below enforces that at the
-- database level: even if someone found this function's name and tried
-- calling it themselves, Postgres would refuse.
-- ============================================================

create function admin_set_subscription_status(
  p_user_id uuid,
  p_customer_id text,
  p_subscription_id text,
  p_is_subscribed boolean
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
    is_subscribed = p_is_subscribed
  where id = p_user_id;
end;
$$;

revoke all on function admin_set_subscription_status(uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function admin_set_subscription_status(uuid, text, text, boolean) to service_role;

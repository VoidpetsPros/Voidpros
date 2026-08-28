-- ============================================================
-- voidpros — safer trial-lookup increment
-- Doing this as a table UPDATE from the client would let anyone with dev
-- tools rewrite their own trial count. This function runs server-side,
-- always acts on the CALLING user (auth.uid(), never a client-supplied id),
-- and only increments if they're not subscribed and under their limit.
-- ============================================================

create function increment_trial_lookup() returns int as $$
declare
  new_count int;
begin
  update profiles
  set trial_lookups_used = trial_lookups_used + 1
  where id = auth.uid()
    and not is_subscribed
    and trial_lookups_used < trial_lookups_limit
  returning trial_lookups_used into new_count;

  return new_count; -- null if already subscribed or already at the limit
end;
$$ language plpgsql security definer;

-- Note: this is a partial safeguard, not a complete one. The broader
-- lockdown — preventing any direct client update to karma, is_subscribed,
-- or the stripe_* columns on `profiles` — belongs with the Stripe/billing
-- work, since at that point is_subscribed should only ever be set by a
-- webhook handler, never by the browser at all.

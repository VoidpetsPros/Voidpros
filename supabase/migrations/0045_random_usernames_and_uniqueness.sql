-- ============================================================
-- voidpros — random auto-generated usernames, collision-safe
-- Two problems with the original handle_new_user trigger:
--  1. It defaulted to the email prefix when no username was given —
--     that's not just a privacy leak (email address fragments shown
--     publicly), it also means two people signing up with similar
--     emails (e.g. same prefix, different domain) would collide on the
--     unique username constraint and one of their signups would fail
--     outright with an opaque "Database error saving new user".
--  2. An explicitly-chosen username that collides had the same failure
--     mode — no clean "that's taken" message, just a broken signup.
--     (The client now checks availability before calling signUp for
--     that case — see AuthModal.jsx — so this trigger only needs to
--     handle the no-username-given fallback robustly.)
-- ============================================================

create or replace function handle_new_user() returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  desired_username text;
  candidate text;
  attempt int := 0;
begin
  desired_username := nullif(trim(new.raw_user_meta_data->>'username'), '');

  if desired_username is not null then
    -- Explicit choice — insert as-is. If it collides, the client already
    -- checked availability moments earlier, so this should be rare; let
    -- it fail loudly rather than silently rename what they typed.
    insert into public.profiles (id, username) values (new.id, desired_username);
  else
    -- No username given — generate a random one, never based on their
    -- email, and retry with a new random suffix on the rare collision.
    loop
      candidate := 'Player' || lpad(floor(random() * 1000000)::text, 6, '0');
      begin
        insert into public.profiles (id, username) values (new.id, candidate);
        exit;
      exception when unique_violation then
        attempt := attempt + 1;
        if attempt > 10 then
          raise exception 'Could not generate a unique username';
        end if;
      end;
    end loop;
  end if;

  return new;
end;
$$;

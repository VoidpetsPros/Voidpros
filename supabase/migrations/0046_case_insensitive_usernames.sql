-- ============================================================
-- voidpros — usernames unique case-insensitively
-- "VoidPros" and "voidpros" were treated as different usernames — the
-- unique constraint is on the raw column, which Postgres compares
-- case-sensitively by default. Adds a case-insensitive unique index so
-- every path (signup, the random fallback, Settings renames) rejects a
-- collision regardless of case, and a username_available() RPC the
-- client can check against before ever attempting a write.
--
-- Existing case-variant duplicates (if any already slipped through) are
-- resolved first — for each group of usernames that only differ by
-- case, the earliest-created one keeps its name and every later
-- duplicate gets renamed to a random Player###### handle (same scheme
-- as the anonymous-signup fallback), since building the unique index
-- would otherwise fail on the existing conflict.
-- ============================================================

do $$
declare
  dup record;
  new_name text;
  attempt int;
begin
  for dup in
    select id
    from (
      select id, row_number() over (partition by lower(username) order by created_at asc, id asc) as rn
      from profiles
      where username is not null
    ) ranked
    where rn > 1
  loop
    attempt := 0;
    loop
      new_name := 'Player' || lpad(floor(random() * 1000000)::text, 6, '0');
      begin
        update profiles set username = new_name where id = dup.id;
        exit;
      exception when unique_violation then
        attempt := attempt + 1;
        if attempt > 10 then
          raise exception 'Could not resolve duplicate username for profile %', dup.id;
        end if;
      end;
    end loop;
  end loop;
end $$;

create unique index if not exists profiles_username_lower_idx on profiles (lower(username));

create or replace function username_available(p_username text) returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select not exists (select 1 from profiles where lower(username) = lower(p_username));
$$;

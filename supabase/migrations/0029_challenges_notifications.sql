-- ============================================================
-- voidpros — Challenges notification badge
-- Red dot on the Submissions menu + Challenges option whenever there's an
-- open request from someone else that this player hasn't looked at yet.
-- Clears the moment they visit the Challenges page.
-- ============================================================

alter table profiles add column challenges_last_seen_at timestamptz not null default now();

create function has_new_challenges(p_user_id uuid) returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from requests r
    where r.requester_id is distinct from p_user_id
      and r.fulfilled = false
      and r.created_at > (select challenges_last_seen_at from profiles where id = p_user_id)
  );
$$;

create function mark_challenges_seen() returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Must be signed in';
  end if;
  update profiles set challenges_last_seen_at = now() where id = auth.uid();
end;
$$;

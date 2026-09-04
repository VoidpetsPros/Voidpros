-- ============================================================
-- voidpros — activity notification tracking
-- Powers the red badge on the Profile button and Community tab: true
-- whenever one of the user's own builds has gotten a new upvote or
-- comment since they last opened the Community page.
-- ============================================================

alter table profiles add column activity_last_seen_at timestamptz not null default now();

create function has_new_activity(p_user_id uuid) returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from comments c
    join builds b on b.id = c.build_id
    where b.author_id = p_user_id
      and c.user_id is distinct from p_user_id
      and c.created_at > (select activity_last_seen_at from profiles where id = p_user_id)
  )
  or exists (
    select 1
    from build_votes v
    join builds b on b.id = v.build_id
    where b.author_id = p_user_id
      and v.user_id is distinct from p_user_id
      and v.created_at > (select activity_last_seen_at from profiles where id = p_user_id)
  );
$$;

create function mark_activity_seen() returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Must be signed in';
  end if;
  update profiles set activity_last_seen_at = now() where id = auth.uid();
end;
$$;

-- ============================================================
-- voidpros — comment counts + remove confirmations
-- 1. Adds a denormalized comment_count on builds, kept in sync the same
--    way upvotes/confirmations already are, so the count can show up
--    front without fetching every build's comments first.
-- 2. Removes the ability to confirm a build at all — the confirmations
--    feature and "This worked for me too" button are being retired.
--    Existing confirmations/counts are left alone (harmless, just frozen);
--    this only blocks new ones from ever being created again.
-- ============================================================

alter table builds add column comment_count int not null default 0;

update builds b set comment_count = (select count(*) from comments c where c.build_id = b.id);

create function sync_build_comment_counts() returns trigger
language plpgsql
security definer
as $$
begin
  update builds set comment_count = (select count(*) from comments where build_id = coalesce(new.build_id, old.build_id))
  where id = coalesce(new.build_id, old.build_id);
  return null;
end;
$$;

create trigger on_build_comment_change
  after insert or delete on comments
  for each row execute procedure sync_build_comment_counts();

-- No insert policy left on build_confirmations means nobody can create a
-- new confirmation from the client, RLS-enabled or not.
drop policy if exists "users can confirm a build once" on build_confirmations;

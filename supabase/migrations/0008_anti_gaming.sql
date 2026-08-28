-- ============================================================
-- voidpros — anti-gaming: no self-votes, no comments on unverified builds
-- ============================================================

-- ---------- can't upvote/downvote your own build ----------
drop policy "users can vote once per build" on build_votes;
create policy "users can vote once per build" on build_votes for insert
  with check (
    auth.uid() = user_id
    and not exists (select 1 from builds b where b.id = build_id and b.author_id = auth.uid())
  );

-- ---------- can't confirm your own build either ----------
-- Same exploit shape as self-voting — self-confirming would let someone
-- nudge their own build toward the 3-confirmation auto-verify threshold.
drop policy "users can confirm a build once" on build_confirmations;
create policy "users can confirm a build once" on build_confirmations for insert
  with check (
    auth.uid() = user_id
    and not exists (select 1 from builds b where b.id = build_id and b.author_id = auth.uid())
  );

-- ---------- comments only allowed on verified builds ----------
drop policy "users can post comments" on comments;
create policy "users can post comments" on comments for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from builds b where b.id = build_id and b.status = 'verified')
  );

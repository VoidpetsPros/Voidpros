-- ============================================================
-- voidpros — remove downvoting
-- Upvotes stay exactly as they were. Existing down votes are cleared (the
-- existing sync_build_vote_counts trigger recomputes downvotes to 0 as a
-- result), and the check constraint is tightened so 'down' can never be
-- inserted again, even from outside the UI.
-- ============================================================

delete from build_votes where direction = 'down';

alter table build_votes drop constraint if exists build_votes_direction_check;
alter table build_votes add constraint build_votes_direction_check check (direction = 'up');

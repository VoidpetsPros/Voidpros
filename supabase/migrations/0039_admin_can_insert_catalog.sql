-- ============================================================
-- voidpros — let admins add brand new pets/items from the app
-- pets/items previously had no INSERT policy at all — every row so far
-- came from migrations run directly with elevated SQL access. This adds
-- the same admin-only pattern already used for the UPDATE policy in
-- migration 0033, so the new "Add pet/item" admin panel can insert rows
-- through the normal client instead of needing a hand-written migration
-- every time.
-- ============================================================

create policy "admins can insert pets" on pets for insert
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

create policy "admins can insert items" on items for insert
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

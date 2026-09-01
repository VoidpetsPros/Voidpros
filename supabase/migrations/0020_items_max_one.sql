-- ============================================================
-- voidpros — items can only ever be owned 0 or 1 at a time
-- Per the real game's rules: "Only one of each item can exist; duplicates
-- are converted to ascension points." This adds a hard database check so
-- it's enforced no matter what the app sends — not just a UI convention.
-- ============================================================

alter table user_items add constraint user_items_max_one check (count <= 1);
alter table request_items add constraint request_items_max_one check (count <= 1);

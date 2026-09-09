-- ============================================================
-- voidpros — feedback feature
-- Adds a feedback table where any signed-in user can leave a short note
-- (capped at 250 characters at the database level, matching the UI
-- limit). Users can only insert and read their own feedback — they
-- can't see anyone else's. Admins can read all of it.
-- ============================================================

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  message text not null check (char_length(message) > 0 and char_length(message) <= 250),
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

create policy "users can submit their own feedback"
  on feedback for insert
  with check (auth.uid() = user_id);

create policy "users can view their own feedback"
  on feedback for select
  using (auth.uid() = user_id);

create policy "admins can view all feedback"
  on feedback for select
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

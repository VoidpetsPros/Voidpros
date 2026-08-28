-- ============================================================
-- voidpros — storage bucket for submission screenshots
-- ============================================================

insert into storage.buckets (id, name, public)
values ('submission-images', 'submission-images', true)
on conflict (id) do nothing;

-- Anyone can view images (they're proof screenshots meant to be seen).
create policy "submission images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'submission-images');

-- Only signed-in users can upload, and only into a folder named after their own user id
-- (path convention: {user_id}/{build_or_fulfillment_id}/{filename}).
create policy "users can upload their own submission images"
  on storage.objects for insert
  with check (
    bucket_id = 'submission-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- voidpros — real images for pets and items
-- Adds an image_url column to both catalog tables, lets admins update
-- them (previously pets/items had no UPDATE policy at all — only
-- publicly readable), and sets up a public storage bucket to hold the
-- actual image files.
-- ============================================================

alter table pets add column if not exists image_url text;
alter table items add column if not exists image_url text;

create policy "admins can update pets" on pets for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

create policy "admins can update items" on items for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

-- ---------- storage bucket for catalog art ----------
insert into storage.buckets (id, name, public)
values ('catalog-images', 'catalog-images', true)
on conflict (id) do nothing;

create policy "catalog images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'catalog-images');

-- upsert:true on the client re-uses the same path per pet/item, so this
-- needs both insert (first upload) and update (replacing it later).
create policy "admins can upload catalog images"
  on storage.objects for insert
  with check (
    bucket_id = 'catalog-images'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "admins can replace catalog images"
  on storage.objects for update
  using (
    bucket_id = 'catalog-images'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  )
  with check (
    bucket_id = 'catalog-images'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  );

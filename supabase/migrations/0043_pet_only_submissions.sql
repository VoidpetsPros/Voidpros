-- ============================================================
-- voidpros — Pet Only Submissions
-- Adds an option to submit a Completion with just the pets screenshot —
-- no items screenshot required. When p_pets_only is true, submit_build
-- skips the items-screenshot check entirely. The resulting build simply
-- has no item data at all (build_team_slots gets no rows inserted for
-- hat/scarf/accessory during admin review, same as any build an admin
-- approves with those fields left blank) — it shows up in search for
-- everyone, free or paid, as a pets-only build, same as it would if an
-- item-visible build's items happened to all be redacted.
-- ============================================================

create or replace function submit_build(
  p_stage int,
  p_note text,
  p_show_author boolean,
  p_images jsonb,
  p_pets_only boolean default false
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_build_id uuid;
  img jsonb;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to submit a build';
  end if;
  if p_stage is null or p_stage < 1 then
    raise exception 'A valid floor number is required';
  end if;

  if not exists (select 1 from jsonb_array_elements(p_images) e where e->>'kind' = 'pets') then
    raise exception 'A pets screenshot is required';
  end if;
  if not p_pets_only and not exists (select 1 from jsonb_array_elements(p_images) e where e->>'kind' = 'items') then
    raise exception 'An items screenshot is required';
  end if;

  insert into builds (stage, author_id, show_author, note)
  values (p_stage, auth.uid(), p_show_author, nullif(trim(p_note), ''))
  returning id into new_build_id;

  for img in select * from jsonb_array_elements(p_images) loop
    insert into build_images (build_id, kind, storage_path)
    values (new_build_id, img->>'kind', img->>'storage_path');
  end loop;

  return new_build_id;
end;
$$;

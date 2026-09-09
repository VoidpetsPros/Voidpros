-- ============================================================
-- voidpros — drop the "proof of completion" requirement on submissions
-- Players no longer need to attach a victory-screen screenshot when
-- submitting a build — just the pets and items screenshots. This
-- matches the removal of that upload slot on the Submit page.
-- ============================================================

create or replace function submit_build(
  p_stage int,
  p_note text,
  p_show_author boolean,
  p_images jsonb
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
  if not exists (select 1 from jsonb_array_elements(p_images) e where e->>'kind' = 'items') then
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

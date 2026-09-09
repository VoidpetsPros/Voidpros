-- ============================================================
-- voidpros — items screenshot is just optional now, no toggle needed
-- Supersedes 0043's p_pets_only flag — turned out to be unnecessary
-- complexity. Items screenshots are now always optional on submit_build,
-- full stop.
--
-- Important: 0043 used `create or replace function submit_build(...5
-- args...)`, but Postgres treats a different argument COUNT as a
-- different function signature, not a replacement — so that migration
-- actually left two overloads of submit_build sitting side by side (the
-- original 4-arg one from 0036, and the 5-arg one from 0043). Calling it
-- with just 4 named args is ambiguous between them. Drop both explicitly
-- before creating the one true version.
-- ============================================================

drop function if exists submit_build(int, text, boolean, jsonb);
drop function if exists submit_build(int, text, boolean, jsonb, boolean);

create function submit_build(
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

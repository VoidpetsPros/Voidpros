-- ============================================================
-- voidpros — Auto-delete stale Challenges
--
-- A Challenge (request) that nobody has fulfilled within 48 hours gets
-- removed automatically. Keeps the Challenges list from filling up with
-- requests nobody's going to pick up. Called by the daily cron job
-- (api/cron-daily-cleanup.js).
-- ============================================================

create or replace function delete_stale_challenges() returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  deleted_count int;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Forbidden';
  end if;

  delete from requests
  where fulfilled = false
    and created_at < now() - interval '48 hours';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

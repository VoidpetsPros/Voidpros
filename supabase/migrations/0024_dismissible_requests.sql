-- ============================================================
-- voidpros — dismissible requests
-- Lets a requester clear a fulfilled request off their own "My Requests"
-- list. The resulting build stays exactly where it is in floor search —
-- this only hides the request card for the person who made it.
-- ============================================================

alter table requests add column dismissed_by_requester boolean not null default false;

create function dismiss_my_request(p_request_id uuid) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Must be signed in';
  end if;
  if not exists (select 1 from requests where id = p_request_id and requester_id = auth.uid()) then
    raise exception 'Request not found';
  end if;
  if not exists (select 1 from requests where id = p_request_id and fulfilled = true) then
    raise exception 'Only a fulfilled request can be dismissed';
  end if;

  update requests set dismissed_by_requester = true where id = p_request_id;
end;
$$;

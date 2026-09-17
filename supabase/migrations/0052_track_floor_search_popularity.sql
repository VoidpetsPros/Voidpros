-- Track how many times each floor has been searched, so "Popular Floors"
-- on the Search page can reflect real usage instead of a hardcoded list.

create table floor_search_counts (
  stage int primary key,
  search_count bigint not null default 0,
  last_searched_at timestamptz not null default now()
);

alter table floor_search_counts enable row level security;

-- Readable by anyone (needed to render the popular-floors list) — no
-- direct writes from clients, only through increment_floor_search below.
create policy "floor_search_counts_select" on floor_search_counts
  for select using (true);

create or replace function increment_floor_search(p_stage int) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Fires passively whenever a search results page loads — ignore bad
  -- input quietly rather than raising, since this shouldn't ever block
  -- the actual search from completing.
  if p_stage is null or p_stage < 1 then
    return;
  end if;

  insert into floor_search_counts (stage, search_count, last_searched_at)
  values (p_stage, 1, now())
  on conflict (stage) do update
    set search_count = floor_search_counts.search_count + 1,
        last_searched_at = now();
end;
$$;

create or replace function get_popular_floors(p_limit int default 7) returns table (
  stage int,
  search_count bigint
)
language sql
stable
as $$
  select stage, search_count
  from floor_search_counts
  order by search_count desc, last_searched_at desc
  limit greatest(p_limit, 1);
$$;

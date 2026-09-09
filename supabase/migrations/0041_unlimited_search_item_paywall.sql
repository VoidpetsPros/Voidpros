-- ============================================================
-- voidpros — unlimited search for everyone + item paywall
--
-- Search is no longer limited for anyone, free or paid. The whole
-- trial_lookups system (increment_trial_lookup, the tutorial's +1 bonus,
-- the old karma milestone's +5 — that one already went with karma) is
-- gone. What used to gate on "search count" now gates on "item detail
-- visibility" instead:
--   - Free users (including anonymous visitors) see every build that
--     matches their pets, with pet names/levels, but no item data.
--   - Subscribers see everything, same as before.
--   - Challenges (Fulfill) are unaffected — full item visibility for
--     everyone there, since fulfilling one requires knowing the exact
--     items allowed.
--   - Posting a Request is already subscriber-only, so item visibility
--     there is moot.
--
-- get_search_results(stage) is the new entry point for floor search: it
-- returns every non-rejected build for that floor, with item fields
-- nulled out (and item-kind proof images excluded) for anyone who isn't
-- subscribed, plus a you_own_all_items flag so a free user can be told
-- "you already have everything this needs" without ever seeing which
-- items those are.
-- ============================================================

-- ---------- 1. drop the trial-lookup guard checks before dropping the columns ----------
create or replace function guard_protected_profile_columns() returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_setting('app.bypass_profile_guard', true) is distinct from 'true' then
    if new.is_admin is distinct from old.is_admin
      or new.is_subscribed is distinct from old.is_subscribed
      or new.stripe_customer_id is distinct from old.stripe_customer_id
      or new.stripe_subscription_id is distinct from old.stripe_subscription_id
    then
      raise exception 'This field can only be changed by a trusted server process';
    end if;
  end if;
  return new;
end;
$$;

-- ---------- 2. drop the now-pointless trial-lookup functions and columns ----------
drop function if exists increment_trial_lookup();
drop function if exists grant_tutorial_search_bonus();
alter table profiles drop column if exists trial_lookups_used;
alter table profiles drop column if exists trial_lookups_limit;
alter table profiles drop column if exists tutorial_bonus_lookup_granted;

-- ---------- 3. floor search, with server-side item redaction ----------
create or replace function get_search_results(p_stage int) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller uuid := auth.uid();
  is_sub boolean := false;
  result jsonb;
begin
  if caller is not null then
    select coalesce(is_subscribed, false) into is_sub from profiles where id = caller;
  end if;

  select coalesce(jsonb_agg(row_to_json(b)::jsonb order by b.status_rank desc, b.upvotes desc), '[]'::jsonb)
  into result
  from (
    select
      bl.id, bl.stage, bl.note, bl.status, bl.upvotes, bl.comment_count,
      bl.show_author, bl.author_id, bl.created_at,
      (case when bl.status = 'verified' then 1 else 0 end) as status_rank,
      jsonb_build_object('username', p.username) as author,
      is_sub as items_visible,
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', ts.id,
            'slot_index', ts.slot_index,
            'pet_id', ts.pet_id,
            'pet_level', ts.pet_level,
            'hat_id', case when is_sub then ts.hat_id else null end,
            'hat_level', case when is_sub then ts.hat_level else null end,
            'scarf_id', case when is_sub then ts.scarf_id else null end,
            'scarf_level', case when is_sub then ts.scarf_level else null end,
            'accessory1_id', case when is_sub then ts.accessory1_id else null end,
            'accessory1_level', case when is_sub then ts.accessory1_level else null end,
            'accessory2_id', case when is_sub then ts.accessory2_id else null end,
            'accessory2_level', case when is_sub then ts.accessory2_level else null end
          ) order by ts.slot_index
        )
        from build_team_slots ts
        where ts.build_id = bl.id
      ) as team,
      (
        select jsonb_agg(jsonb_build_object('kind', im.kind, 'storage_path', im.storage_path))
        from build_images im
        where im.build_id = bl.id and (is_sub or im.kind <> 'items')
      ) as images,
      (
        case
          when caller is null or is_sub then null
          else not exists (
            select 1
            from (
              select item_id, count(*) as needed from (
                select hat_id as item_id from build_team_slots where build_id = bl.id and hat_id is not null
                union all
                select scarf_id from build_team_slots where build_id = bl.id and scarf_id is not null
                union all
                select accessory1_id from build_team_slots where build_id = bl.id and accessory1_id is not null
                union all
                select accessory2_id from build_team_slots where build_id = bl.id and accessory2_id is not null
              ) x
              group by item_id
            ) req
            left join user_items ui on ui.user_id = caller and ui.item_id = req.item_id
            where coalesce(ui.count, 0) < req.needed
          )
        end
      ) as you_own_all_items
    from builds bl
    left join profiles p on p.id = bl.author_id
    where bl.stage = p_stage and bl.status <> 'rejected'
  ) b;

  return result;
end;
$$;

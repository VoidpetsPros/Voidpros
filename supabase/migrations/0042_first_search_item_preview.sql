-- ============================================================
-- voidpros — one-time "first search" item preview
-- The tutorial's Search step should let a new user see full item detail
-- on that search, even on Free, so they understand what they're missing
-- out on afterward. Rather than plumbing a "tutorial mode" flag through
-- Search -> Results -> get_search_results, this just unlocks full item
-- visibility for whichever search happens to be a signed-in user's
-- first ever — which in practice is that tutorial search anyway — then
-- locks back to normal free-tier rules permanently after.
-- ============================================================

alter table profiles add column first_search_preview_used boolean not null default false;

-- Protect it the same way as the other trusted-only columns — otherwise
-- the existing "users can update their own profile" policy would let
-- someone just reset this back to false and reuse the preview forever.
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
      or new.first_search_preview_used is distinct from old.first_search_preview_used
    then
      raise exception 'This field can only be changed by a trusted server process';
    end if;
  end if;
  return new;
end;
$$;

create or replace function get_search_results(p_stage int) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  caller uuid := auth.uid();
  is_sub boolean := false;
  used_preview boolean := false;
  result jsonb;
begin
  if caller is not null then
    select coalesce(is_subscribed, false), coalesce(first_search_preview_used, false)
      into is_sub, used_preview
      from profiles where id = caller;

    if not is_sub and not used_preview then
      perform set_config('app.bypass_profile_guard', 'true', true);
      update profiles set first_search_preview_used = true where id = caller;
      is_sub := true; -- only for this call's redaction logic below — not written anywhere
    end if;
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

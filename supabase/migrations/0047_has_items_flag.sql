-- ============================================================
-- voidpros — has_items flag for the item-unlock banner
-- The client can't tell a Pet Only build apart from a redacted
-- items-build just by looking at nulled-out hat/scarf/accessory fields —
-- both look identical once redacted. Adds has_items (computed from the
-- real, unredacted team data) so BuildCard only shows the "Unlock Item
-- View" upsell on builds that actually have item data to unlock.
--
-- Also drops you_own_all_items — the banner that used it ("you already
-- own everything this needs") is being replaced by a single upgrade
-- prompt regardless of ownership, so it's no longer read anywhere.
-- ============================================================

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
      exists (
        select 1 from build_team_slots ts3
        where ts3.build_id = bl.id
          and (ts3.hat_id is not null or ts3.scarf_id is not null or ts3.accessory1_id is not null or ts3.accessory2_id is not null)
      ) as has_items,
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
      ) as images
    from builds bl
    left join profiles p on p.id = bl.author_id
    where bl.stage = p_stage and bl.status <> 'rejected'
  ) b;

  return result;
end;
$$;

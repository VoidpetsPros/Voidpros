-- Personal display preference: whether to show pet levels and item chips
-- on build cards at all. Off by default — players who want the detail
-- can turn it on in Settings. This is independent of, and layered on top
-- of, the existing item-visibility paywall: item chips still only ever
-- render for Unlimited subscribers regardless of this preference.
alter table profiles add column show_levels_and_items boolean not null default false;

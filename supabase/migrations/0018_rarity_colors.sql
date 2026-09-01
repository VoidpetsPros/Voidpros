-- ============================================================
-- voidpros — correct rarity color scheme
-- Common = green, Rare = blue, Epic = violet, Legendary = gold,
-- Uber = scarlet red. Applies to every item already in the table,
-- regardless of which earlier migration inserted it.
-- ============================================================

-- Defensive: make sure the column actually exists before touching it,
-- in case 0015 didn't fully run for some reason.
alter table items add column if not exists rarity text;

update items set color = case rarity
  when 'Common' then '#7FC97F'
  when 'Rare' then '#6FA8DC'
  when 'Epic' then '#A98FE0'
  when 'Legendary' then '#E8B33D'
  when 'Uber' then '#D9534F'
  else color
end
where rarity is not null;

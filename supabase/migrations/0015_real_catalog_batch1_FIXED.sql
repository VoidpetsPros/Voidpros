-- ============================================================
-- voidpros — real Voidpet Dungeon catalog (batch 1, CORRECTED)
-- Run this INSTEAD of the original 0015 — 6 placeholder pets (Spite,
-- Joy, Envy, Patience, Wrath, Greed) happened to share names with real
-- pets, and since pets.name is unique, trying to insert new rows for
-- them failed. Fixed here by updating those 6 existing rows in place
-- with real data (keeping their old ids, so nothing referencing them
-- breaks), then inserting everyone else normally.
-- ============================================================

alter table pets add column if not exists element text;
alter table pets add column if not exists role text;
alter table pets add column if not exists rarity text;
alter table items add column if not exists rarity text;

-- ---------- fix the 6 name collisions in place ----------
update pets set element = 'Metal', role = 'Fighter', rarity = 'Rare', color = '#B8B8C4', variant = 1 where name = 'Spite';
update pets set element = 'Fire', role = 'Healer', rarity = 'Rare', color = '#E89B7D', variant = 3 where name = 'Joy';
update pets set element = 'Metal', role = 'Fighter', rarity = 'Rare', color = '#B8B8C4', variant = 1 where name = 'Envy';
update pets set element = 'Wood', role = 'Healer', rarity = 'Legendary', color = '#A8C97F', variant = 3 where name = 'Patience';
update pets set element = 'Fire', role = 'Fighter', rarity = 'Legendary', color = '#E89B7D', variant = 1 where name = 'Wrath';
update pets set element = 'Fire', role = 'Fighter', rarity = 'Legendary', color = '#E89B7D', variant = 1 where name = 'Greed';

-- ---------- insert the remaining 49 real pets ----------
-- on conflict (name) do nothing protects against re-running this if it's
-- ever executed twice, or after a prior partial success.
insert into pets (id, name, element, role, rarity, color, variant) values
  ('vp004', 'Pain', 'Fire', 'Tank', 'Rare', '#E89B7D', 2),
  ('vp006', 'Lonely', 'Water', 'Healer', 'Rare', '#8FC1E0', 3),
  ('vp007', 'Paranoia', 'Metal', 'Fighter', 'Epic', '#B8B8C4', 1),
  ('vp008', 'Sonder', 'Water', 'Healer', 'Epic', '#8FC1E0', 3),
  ('vp009', 'Sanctimony', 'Earth', 'Fighter', 'Epic', '#C9A876', 1),
  ('vp010', 'Abandonment', 'Water', 'Tank', 'Rare', '#8FC1E0', 2),
  ('vp011', 'Jealous', 'Wood', 'Fighter', 'Legendary', '#A8C97F', 1),
  ('vp012', 'Gluttony', 'Earth', 'Fighter', 'Legendary', '#C9A876', 1),
  ('vp013', 'Pride', 'Metal', 'Fighter', 'Legendary', '#B8B8C4', 1),
  ('vp014', 'Lust', 'Metal', 'Fighter', 'Legendary', '#B8B8C4', 1),
  ('vp015', 'Sloth', 'Earth', 'Tank', 'Legendary', '#C9A876', 2),
  ('vp018', 'Estrangement', 'Water', 'Fighter', 'Legendary', '#8FC1E0', 1),
  ('vp019', 'Nostalgia', 'Earth', 'Healer', 'Legendary', '#C9A876', 3),
  ('vp020', 'Judgement', 'Metal', 'Fighter', 'Rare', '#B8B8C4', 1),
  ('vp021', 'Salty', 'Earth', 'Tank', 'Rare', '#C9A876', 2),
  ('vp022', 'Sadge', 'Water', 'Fighter', 'Epic', '#8FC1E0', 1),
  ('vp023', 'Down Bad', 'Wood', 'Fighter', 'Legendary', '#A8C97F', 1),
  ('vp024', 'Cringe', 'Wood', 'Tank', 'Epic', '#A8C97F', 2),
  ('vp025', 'Grumpy', 'Earth', 'Fighter', 'Rare', '#C9A876', 1),
  ('vp026', 'Curious', 'Wood', 'Fighter', 'Rare', '#A8C97F', 1),
  ('vp027', 'Glee', 'Earth', 'Support', 'Rare', '#C9A876', 3),
  ('vp028', 'Rejection', 'Water', 'Tank', 'Legendary', '#8FC1E0', 2),
  ('vp029', 'Desperate', 'Metal', 'Fighter', 'Epic', '#B8B8C4', 1),
  ('vp030', 'Defiance', 'Fire', 'Fighter', 'Legendary', '#E89B7D', 1),
  ('vp031', 'Merry', 'Wood', 'Healer', 'Epic', '#A8C97F', 3),
  ('vp032', 'Apathy', 'Earth', 'Fighter', 'Rare', '#C9A876', 1),
  ('vp033', 'Disdain', 'Metal', 'Fighter', 'Legendary', '#B8B8C4', 1),
  ('vp034', 'Panic', 'Fire', 'Fighter', 'Epic', '#E89B7D', 1),
  ('vp035', 'Resistance', 'Earth', 'Tank', 'Epic', '#C9A876', 2),
  ('vp036', 'Determination', 'Fire', 'Tank', 'Epic', '#E89B7D', 2),
  ('vp037', 'Wonder', 'Wood', 'Healer', 'Rare', '#A8C97F', 3),
  ('vp038', 'Mischief', 'Wood', 'Fighter', 'Legendary', '#A8C97F', 1),
  ('vp039', 'Persistence', 'Water', 'Healer', 'Legendary', '#8FC1E0', 3),
  ('vp040', 'Ambition', 'Water', 'Fighter', 'Legendary', '#8FC1E0', 1),
  ('vp041', 'Conviction', 'Metal', 'Tank', 'Rare', '#B8B8C4', 2),
  ('vp043', 'Wistful', 'Wood', 'Fighter', 'Epic', '#A8C97F', 1),
  ('vp044', 'Scorn', 'Metal', 'Tank', 'Legendary', '#B8B8C4', 2),
  ('vp045', 'Diligence', 'Earth', 'Fighter', 'Legendary', '#C9A876', 1),
  ('vp047', 'Charity', 'Fire', 'Healer', 'Legendary', '#E89B7D', 3),
  ('vp048', 'Petulance', 'Wood', 'Tank', 'Legendary', '#A8C97F', 2),
  ('vp049', 'Devotion', 'Fire', 'Tank', 'Legendary', '#E89B7D', 2),
  ('vp050', 'Kind', 'Wood', 'Fighter', 'Legendary', '#A8C97F', 1),
  ('vp051', 'Rapture', 'Fire', 'Fighter', 'Legendary', '#E89B7D', 1),
  ('vp052', 'Chastity', 'Metal', 'Healer', 'Legendary', '#B8B8C4', 3),
  ('vp053', 'Temperance', 'Water', 'Tank', 'Legendary', '#8FC1E0', 2),
  ('vp054', 'Humble', 'Water', 'Fighter', 'Legendary', '#8FC1E0', 1)
on conflict (name) do nothing;

-- ---------- real items (only ~11 could be found publicly documented) ----------
insert into items (id, name, type, icon, color, rarity) values
  ('vi_h001', 'Ice Cream Hat', 'hat', 'crown', '#F0DDA6', 'Common'),
  ('vi_h002', 'Chef Hat', 'hat', 'feather', '#E3DCC9', 'Common'),
  ('vi_h003', 'Silk Top Hat', 'hat', 'gem', '#D9CDF0', 'Rare'),
  ('vi_h004', 'Pinwheel Hat', 'hat', 'wind', '#CFE0EF', 'Rare'),
  ('vi_s001', 'Retro Pink Flower Collar', 'scarf', 'sprout', '#F0C9A8', 'Common'),
  ('vi_s002', 'Red Bow Tie', 'scarf', 'bell', '#E89B7D', 'Common'),
  ('vi_s003', 'Spider Necklace', 'scarf', 'gem', '#B8B8C4', 'Rare'),
  ('vi_s004', 'Bubblegum Scarf', 'scarf', 'wind', '#F0C9A8', 'Common'),
  ('vi_s005', 'Aqua Spiked Collar', 'scarf', 'testtube', '#CFE0EF', 'Rare'),
  ('vi_s006', 'Watermelon Collar', 'scarf', 'sprout', '#A8C97F', 'Rare'),
  ('vi_s007', 'Ruby Collar', 'scarf', 'flame', '#E89B7D', 'Epic')
on conflict (name) do nothing;

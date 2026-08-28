-- ============================================================
-- voidpros — placeholder seed data
-- This is the SAME mock catalog used in the prototype, just moved into
-- real tables. Replace with the real 100+ item / full pet list later —
-- that's a straightforward re-seed, not a schema change.
-- ============================================================

insert into pets (id, name, tag, color, variant) values
  ('p1', 'Spite', 'shadow', '#D9CDF0', 1),
  ('p2', 'Joy', 'flame', '#F0C9A8', 2),
  ('p3', 'Envy', 'poison', '#CFE3D0', 3),
  ('p4', 'Patience', 'stone', '#E3DCC9', 1),
  ('p5', 'Wrath', 'flame', '#F0C9A8', 3),
  ('p6', 'Greed', 'gold', '#F0DDA6', 2),
  ('p7', 'Sorrow', 'water', '#CFE0EF', 1),
  ('p8', 'Hope', 'light', '#F5EFD8', 3),
  ('p9', 'Dread', 'shadow', '#D9CDF0', 2),
  ('p10', 'Calm', 'water', '#CFE0EF', 3);

insert into items (id, name, type, icon, color) values
  ('h1', 'Cracked lantern', 'hat', 'lamp', '#F0DDA6'),
  ('h2', 'Moonlit crown', 'hat', 'crown', '#D9CDF0'),
  ('h3', 'Feathered cap', 'hat', 'feather', '#E3DCC9'),
  ('s1', 'Whispering scarf', 'scarf', 'wind', '#CFE0EF'),
  ('s2', 'Vinewrap scarf', 'scarf', 'sprout', '#CFE3D0'),
  ('s3', 'Bell-fringe scarf', 'scarf', 'bell', '#D9CDF0'),
  ('a1', 'Tarnished coin', 'accessory', 'coins', '#F0DDA6'),
  ('a2', 'Ash vial', 'accessory', 'testtube', '#DCD6C9'),
  ('a3', 'Ember shard', 'accessory', 'flame', '#F0C9A8'),
  ('a4', 'Void gem', 'accessory', 'gem', '#D9CDF0');

-- Note: no builds are seeded here on purpose — builds need a real author_id
-- (a row in auth.users), which doesn't exist until someone signs up. Once you
-- have a test account, insert a couple of sample builds through the app itself
-- (or ask me for a seed script keyed to your test user's UUID).

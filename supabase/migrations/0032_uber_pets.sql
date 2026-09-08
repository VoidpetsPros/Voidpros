-- ============================================================
-- voidpros — add Uber rarity tier pets
-- Introduces the first 4 Uber-tier pets, one level above Legendary.
-- Each is the "Higher Form" of an existing Legendary pet, keeping that
-- pet's element and role so it slots into search/collection the same way.
-- Uber already exists as a recognized rarity value in the frontend
-- (RARITY_ORDER/RARITY_COLORS) and on items — this just starts using it
-- for pets too. No schema change needed since pets.rarity is free-text.
-- ============================================================

insert into pets (id, name, element, role, rarity, color, variant) values
  ('vp-uber-lust', 'Higher Form Lust', 'Metal', 'Fighter', 'Uber', '#B8B8C4', 1),
  ('vp-uber-downbad', 'Higher Form Down Bad', 'Wood', 'Fighter', 'Uber', '#A8C97F', 1),
  ('vp-uber-greed', 'Higher Form Greed', 'Fire', 'Fighter', 'Uber', '#E89B7D', 1),
  ('vp-uber-sloth', 'Higher Form Sloth', 'Earth', 'Tank', 'Uber', '#C9A876', 2)
on conflict (name) do nothing;

-- ============================================================
-- voidpros — real catalog batch 2: final 3 pets + a role correction
-- ============================================================

-- Glee's role was updated in-game to Support since the wiki was last edited.
update pets set role = 'Support' where id = 'vp027';

-- The 3 pets missing from the wiki entirely — not documented anywhere
-- public, added here from direct player knowledge.
insert into pets (id, name, element, role, rarity, color, variant) values
  ('vp055', 'Denial', 'Earth', 'Support', 'Legendary', '#C9A876', 3),
  ('vp056', 'Bummer', 'Metal', 'Fighter', 'Legendary', '#B8B8C4', 1),
  ('vp057', 'Malice', 'Earth', 'Fighter', 'Legendary', '#C9A876', 1)
on conflict (id) do nothing;

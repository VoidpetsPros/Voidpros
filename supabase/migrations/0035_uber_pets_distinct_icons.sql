-- ============================================================
-- voidpros — distinct placeholder icon per Uber pet
-- Supersedes 0034, which gave all 4 Uber pets the same generic
-- variant 4. That shape was replaced with 4 separate, name-themed
-- shapes (variants 5-8) so each pet looks distinct until it has a
-- real uploaded image:
--   5 = Lust        (sharp, heart-notched silhouette)
--   6 = Down Bad     (drooping ears, downturned frown)
--   7 = Greed        (faceted gem cut)
--   8 = Sloth        (heavy slumped shape, closed sleepy eyes)
-- ============================================================

update pets set variant = 5 where id = 'vp-uber-lust';
update pets set variant = 6 where id = 'vp-uber-downbad';
update pets set variant = 7 where id = 'vp-uber-greed';
update pets set variant = 8 where id = 'vp-uber-sloth';

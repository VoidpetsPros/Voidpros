-- ============================================================
-- voidpros — use the new sleeker head icon for the Uber pets
-- Variant 4 (added to PetAvatar's VoidCreature) is a more angular,
-- pointed-ear head silhouette meant to read as a "higher form" upgrade
-- over the softer body shapes used by variants 1-3. Only affects pets
-- with no image_url yet — once a real image is uploaded through the
-- admin catalog panel, this placeholder no longer shows.
-- ============================================================

update pets set variant = 4
where id in ('vp-uber-lust', 'vp-uber-downbad', 'vp-uber-greed', 'vp-uber-sloth');

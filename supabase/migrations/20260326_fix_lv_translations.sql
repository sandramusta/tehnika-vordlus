-- Fix Latvian translations for equipment types that were missed by add_translations.sql
-- Root cause: add_translations.sql WHERE clause used '%rullo%' (2 L's) but
-- the Estonian name 'Ruloonpress' contains 'ruloo' (1 L, 2 O's) → no match.

-- Fix Round Baler (Ruloonpress) lv translation
UPDATE equipment_types
SET name_translations = jsonb_set(
  COALESCE(name_translations, '{}'),
  '{lv}',
  '"Apaļo baļu presētājs"'
)
WHERE name ILIKE '%round_baler%'
   OR name ILIKE '%round baler%'
   OR name ILIKE '%round%baler%'
   OR name_et ILIKE '%ruloon%'
   OR name_et ILIKE '%rullpress%';

-- Fix Forage Harvester lv translation (may have wrong value 'Lopibandas novaktajs')
UPDATE equipment_types
SET name_translations = jsonb_set(
  COALESCE(name_translations, '{}'),
  '{lv}',
  '"Lopbarības novāktājs"'
)
WHERE name ILIKE '%forage%'
   OR name ILIKE '%forage_harvester%'
   OR name_et ILIKE '%heksler%'
   OR name_et ILIKE '%niiduk%'
   OR name_et ILIKE '%siloharvester%';

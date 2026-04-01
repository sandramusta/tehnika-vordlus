-- ─────────────────────────────────────────────────────────────────────────────
-- Add multilingual translation columns
-- Run this migration once in your Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. equipment_types: add name_translations JSONB
ALTER TABLE equipment_types
  ADD COLUMN IF NOT EXISTS name_translations JSONB DEFAULT '{}';

-- 2. competitive_arguments: add translations JSONB
--    Shape: { "en": { "argument_title": "...", "argument_description": "...",
--                      "problem_text": "...", "solution_text": "...", "benefit_text": "..." },
--             "de": { ... }, ... }
ALTER TABLE competitive_arguments
  ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';

-- 3. myths: add translations JSONB
--    Shape: { "en": { "myth": "...", "reality": "...", "advantage": "..." },
--             "de": { ... }, ... }
ALTER TABLE myths
  ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed name_translations for equipment_types
-- Adjust the WHERE clause to match the Estonian names in your database.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE equipment_types
SET name_translations = '{
  "en": "Combine harvester",
  "de": "Mähdrescher",
  "fi": "Puimuri",
  "sv": "Skördetröska",
  "da": "Mejetærsker",
  "no": "Skurtresker",
  "pl": "Kombajn zbożowy",
  "lv": "Kombains",
  "lt": "Kombainai"
}'::jsonb
WHERE name_et ILIKE '%combine%'
   OR name ILIKE '%combine%'
   OR name_et ILIKE '%kombaini%'
   OR name ILIKE '%kombaini%';

UPDATE equipment_types
SET name_translations = '{
  "en": "Tractor",
  "de": "Traktor",
  "fi": "Traktori",
  "sv": "Traktor",
  "da": "Traktor",
  "no": "Traktor",
  "pl": "Traktor",
  "lv": "Traktors",
  "lt": "Traktoriai"
}'::jsonb
WHERE name_et ILIKE '%traktor%'
   OR name ILIKE '%traktor%';

UPDATE equipment_types
SET name_translations = '{
  "en": "Telehandler",
  "de": "Teleskoplader",
  "fi": "Teleskooppikuormaaja",
  "sv": "Teleskoplastare",
  "da": "Teleskoplæsser",
  "no": "Teleskoplaster",
  "pl": "Ładowarka teleskopowa",
  "lv": "Teleskopiskais iekrāvējs",
  "lt": "Teleskopinis krautuvas"
}'::jsonb
WHERE name_et ILIKE '%teleskoop%'
   OR name ILIKE '%teleskoop%'
   OR name_et ILIKE '%telehandler%'
   OR name ILIKE '%telehandler%';

UPDATE equipment_types
SET name_translations = '{
  "en": "Forage harvester",
  "de": "Feldhäcksler",
  "fi": "Tarkkuussilppuri",
  "sv": "Exaktahack",
  "da": "Finsnitter",
  "no": "Finhakker",
  "pl": "Sieczkarnia polowa",
  "lv": "Lopbarības novāktājs",
  "lt": "Pašarų kombainai"
}'::jsonb
WHERE name_et ILIKE '%niiduk%'
   OR name_et ILIKE '%siloharvester%'
   OR name_et ILIKE '%forage%'
   OR name ILIKE '%forage%'
   OR name_et ILIKE '%heksler%';

UPDATE equipment_types
SET name_translations = '{
  "en": "Wheel loader",
  "de": "Radlader",
  "fi": "Pyöräkuormaaja",
  "sv": "Hjullastare",
  "da": "Hjullæsser",
  "no": "Hjullaster",
  "pl": "Ładowarka kołowa",
  "lv": "Riteņu iekrāvējs",
  "lt": "Ratinis krautuvas"
}'::jsonb
WHERE name_et ILIKE '%ratslaadurit%'
   OR name_et ILIKE '%wheel loader%'
   OR name ILIKE '%wheel loader%'
   OR name_et ILIKE '%rataslaadurit%';

UPDATE equipment_types
SET name_translations = '{
  "en": "Self-propelled sprayer",
  "de": "Selbstfahrende Feldspritze",
  "fi": "Itseajettava ruisku",
  "sv": "Självgående spruta",
  "da": "Selvkørende sprøjte",
  "no": "Selvgående sprøyte",
  "pl": "Opryskiwacz samojezdny",
  "lv": "Pašgājējs smidzinātājs",
  "lt": "Savaeigis purkštuvas"
}'::jsonb
WHERE name_et ILIKE '%iseliikuv%'
   OR name_et ILIKE '%self-propelled%'
   OR name ILIKE '%self-propelled%'
   OR name_et ILIKE '%pritsmasin%';

UPDATE equipment_types
SET name_translations = '{
  "en": "Trailed sprayer",
  "de": "Anhängespritzgerät",
  "fi": "Perässävedettävä ruisku",
  "sv": "Bogserad spruta",
  "da": "Trukket sprøjte",
  "no": "Trukket sprøyte",
  "pl": "Opryskiwacz zaczepiany",
  "lv": "Piekabināmais smidzinātājs",
  "lt": "Tempiamas purkštuvas"
}'::jsonb
WHERE name_et ILIKE '%haagis%prits%'
   OR name_et ILIKE '%trailed%'
   OR name ILIKE '%trailed%';

UPDATE equipment_types
SET name_translations = '{
  "en": "Round baler",
  "de": "Rundballenpresse",
  "fi": "Pyöröpaalaaja",
  "sv": "Rundbalspress",
  "da": "Rundballer",
  "no": "Rundballer",
  "pl": "Prasa okrągłobelowa",
  "lv": "Apaļo baļu presētājs",
  "lt": "Apvalių ryšulių presai"
}'::jsonb
WHERE name_et ILIKE '%ruloon%'
   OR name_et ILIKE '%round baler%'
   OR name ILIKE '%round baler%'
   OR name ILIKE '%round_baler%'
   OR name_et ILIKE '%rullpress%';



## Probleem

Brošüüri üleslaadimise ja andmete ekstraheerimise süsteem kasutab alati kombainide välju, sõltumata tehnika tüübist. See tähendab, et teleskooplaaduri brošüüri üles laadides kuvatakse kombainidele spetsiifilisi näitajaid (rootori läbimõõt, pekspind, viljabunker jne), mitte telehandleri omi (tõstekõrgus, tõstevõime, hüdraulikapump jne).

## Põhjus

Serverfunktsioon `extract-brochure-specs` sisaldab ainult kombainide skeemi ja ei tea, mis tüüpi tehnikaga on tegu. Ka kliendipoolne kood ei edasta tehnika tüüpi funktsioonile.

## Lahendus

Muudame süsteemi nii, et see edastab tehnika tüübi ja kasutab tüübipõhist skeemi.

### Muudatused

**1. `supabase/functions/extract-brochure-specs/index.ts`** — Tüübipõhine skeem

- Lisame eraldi väljade konfiguratsioonid iga tehnika tüübi jaoks (telehandler, combine, tractor jne)
- Võtame vastu uue parameetri `equipment_type` (nt "telehandler", "combine")
- Kasutame tüübile vastavat skeemi AI promptis
- Teleskooplaaduri skeem sisaldab:
  - equipment_columns: lift_height_m, lift_reach_m, max_lift_capacity_kg, hydraulic_pump_lpm, engine_power_hp, weight_kg, transport_width_mm, transport_height_mm, fuel_tank_liters
  - detailed_specs: tõsteomadused, hüdraulika, mõõtmed, mootor (4 kategooriat)

**2. `src/components/admin/BrochureUpload.tsx`** — Tehnika tüübi edastamine

- Lisame `equipment.equipment_type?.name` andmete saatmisele serverfunktsiooni
- Edge function kutse saab uue välja: `equipment_type`

**3. `src/components/admin/BrochureDataReview.tsx`** — Tüübipõhised sildid

- Lisame telehandler-spetsiifilised COLUMN_LABELS (lift_height_m, lift_reach_m jne)
- Lisame telehandler-spetsiifilised CATEGORY_LABELS (tõsteomadused, hüdraulika)

### Toetatud tüübid ja nende skeem

| Tüüp | equipment_columns | detailed_specs kategooriad |
|-------|------------------|---------------------------|
| Teleskooplaadur | lift_height_m, lift_reach_m, max_lift_capacity_kg, hydraulic_pump_lpm, engine_power_hp, weight_kg, transport_width/height_mm, fuel_tank_liters | tõsteomadused, hüdraulika, mõõtmed, mootor |
| Kombain | Praegune skeem (rootor, peks, bunker jne) | Kõik 12 kategooriat |
| Teised tüübid | Tüübile vastavad väljad | Tüübile vastavad kategooriad |

### Muudatuste failid

- `supabase/functions/extract-brochure-specs/index.ts`
- `src/components/admin/BrochureUpload.tsx`
- `src/components/admin/BrochureDataReview.tsx`


# T5 ja T6 kombainide tehniliste andmete lisamine

## Ülevaade

Lisa võrdlustabelisse T5 (400, 500, 600, 700) ja T6 (500, 600, 700, 800) kombainide täielikud tehnilised andmed vastavalt kasutaja esitatud brošüüridele.

## Praegune olukord

**Andmebaasis olemas:**
- T6 500, T6 600, T6 700, T6 800 - osaliste andmetega

**Puuduvad mudelid:**
- T5 400, T5 500, T5 600, T5 700

## Lisatavad/uuendatavad andmed

### Uued mudelid (INSERT)

**T5 400:**
- engine_power_hp: 305 (suurim võimsus)
- engine_displacement_liters: 6.8
- engine_cylinders: 6
- grain_tank_liters: 10000
- threshing_drum_diameter_mm: 660
- threshing_drum_width_mm: 1400
- rotor_diameter_mm: 800
- separator_area_m2: 3.30
- straw_walker_count: 5
- straw_walker_area_m2: 4.8
- cleaning_area_m2: 4.7
- sieve_area_m2: 2.0
- unloading_rate_ls: 125
- weight_kg: 15200

**T5 500:**
- engine_power_hp: 348
- engine_displacement_liters: 9
- grain_tank_liters: 10000
- threshing_drum_diameter_mm: 660
- threshing_drum_width_mm: 1400
- rotor_diameter_mm: 800
- separator_area_m2: 3.30
- straw_walker_count: 5
- straw_walker_area_m2: 4.8
- cleaning_area_m2: 4.7
- sieve_area_m2: 2.0
- unloading_rate_ls: 125
- weight_kg: 15200

**T5 600:**
- engine_power_hp: 387
- engine_displacement_liters: 9
- grain_tank_liters: 10000
- threshing_drum_diameter_mm: 660
- threshing_drum_width_mm: 1400
- rotor_diameter_mm: 800
- separator_area_m2: 3.30
- straw_walker_count: 5
- straw_walker_area_m2: 4.8
- cleaning_area_m2: 4.7
- sieve_area_m2: 2.0
- unloading_rate_ls: 125
- weight_kg: 15800

**T5 700:**
- engine_power_hp: 421
- engine_displacement_liters: 9
- grain_tank_liters: 11500
- threshing_drum_diameter_mm: 660
- threshing_drum_width_mm: 1400
- rotor_diameter_mm: 800
- separator_area_m2: 3.30
- straw_walker_count: 5
- straw_walker_area_m2: 4.8
- cleaning_area_m2: 4.7
- sieve_area_m2: 2.0
- unloading_rate_ls: 150
- weight_kg: 15800

### Olemasolevate mudelite uuendamine (UPDATE)

**T6 500** (id: 5731f0eb-0ab4-47bc-b378-415c6ca49387):
- engine_displacement_liters: 9
- threshing_drum_diameter_mm: 660
- threshing_drum_width_mm: 1670
- rotor_diameter_mm: 800
- separator_area_m2: 4.0
- straw_walker_count: 6
- straw_walker_area_m2: 5.8
- cleaning_area_m2: 5.5
- sieve_area_m2: 2.3
- unloading_rate_ls: 125
- weight_kg: 16500

**T6 600** (id: b2cfdbe3-7380-43dc-8e35-446974bb7158):
- engine_displacement_liters: 9
- threshing_drum_diameter_mm: 660
- threshing_drum_width_mm: 1670
- rotor_diameter_mm: 800
- separator_area_m2: 4.0
- straw_walker_count: 6
- straw_walker_area_m2: 5.8
- cleaning_area_m2: 5.5
- sieve_area_m2: 2.3
- unloading_rate_ls: 125
- weight_kg: 16500

**T6 700** (id: 0f3b7773-8379-4b89-b102-d8241c8b9f79):
- engine_displacement_liters: 9
- threshing_drum_diameter_mm: 660
- threshing_drum_width_mm: 1670
- rotor_diameter_mm: 800
- separator_area_m2: 4.0
- straw_walker_count: 6
- straw_walker_area_m2: 5.8
- cleaning_area_m2: 5.5
- sieve_area_m2: 2.3
- unloading_rate_ls: 150
- grain_tank_liters: 13500
- weight_kg: 16500

**T6 800** (id: b9d853bc-a5b4-4648-832f-74b03d03ffe2):
- engine_displacement_liters: 9
- threshing_drum_diameter_mm: 660
- threshing_drum_width_mm: 1670
- rotor_diameter_mm: 800
- separator_area_m2: 4.0
- straw_walker_count: 6
- straw_walker_area_m2: 5.8
- cleaning_area_m2: 5.5
- sieve_area_m2: 2.3
- unloading_rate_ls: 150
- weight_kg: 16500

## Tehniline teostus

Kasutan Supabase'i INSERT tööriista uute T5 mudelite lisamiseks ja UPDATE päringuid olemasolevate T6 mudelite andmete täiendamiseks.

## Tulemus

Pärast uuendamist on võrdlustabelis kõik 8 John Deere T-seeria kombinati täielike tehniliste andmetega:
- T5 400, T5 500, T5 600, T5 700 (uued)
- T6 500, T6 600, T6 700, T6 800 (uuendatud)

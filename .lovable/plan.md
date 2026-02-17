

## Brošüüri ekstraheerimise skeemi sünkroniseerimine admin/võrdlustabeli väljadega

### Probleem

Edge function'i (`extract-brochure-specs`) ekstraheerimise skeem ei ühti täpselt admin vormi ja võrdlustabeli väljadega. See põhjustab:
- Puuduvad väljad: mõned olulised näitajad (nt `transport_length_mm`, `header_width_m`, `fuel_consumption_lh`) jäävad ekstraheerimata, sest neid pole edge function'i skeemis
- Üleliigsed väljad: mõned väljad on skeemis, aga neid ei kasutata kusagil

### Muudatuste plaan

**Fail 1: `supabase/functions/extract-brochure-specs/index.ts`**

Sünkroniseerida `EQUIPMENT_TYPE_SCHEMAS` nii, et:

a) **equipment_columns** vastaks täpselt `equipmentTypeFields.ts` väljadele (v.a majandusandmed nagu hind ja hoolduskulu, mida brošüürist ei saa):

Puuduvad väljad, mida lisada:
- Combine: `transport_length_mm`, `header_width_m`, `fuel_consumption_lh`  
- Telehandler: `transport_length_mm`
- Tractor: puudub `fuel_consumption_lh`
- Forage harvester: `fuel_tank_liters`, `max_torque_nm`, `transport_length_mm`
- Wheel loader: puudub `fuel_tank_liters`, `fuel_consumption_lh`
- Self-propelled sprayer: puudub `fuel_consumption_lh`
- Round baler: puudub `fuel_consumption_lh`

b) **detailed_specs_categories** vastaks täpselt `pdfSpecsHelpers.ts` väljadele (need on juba suures osas sünkroonis, aga mõned erinevused):

- Telehandler: edge function'il on laiendatud väljad (nt `tõstevõime_max_kõrgusel_kg`, `tõsteaeg_s`, `kallutusjõud_kN`, `teljevahe_mm`, `kliirens_mm`, `pöörderaadius_m`) mida `pdfSpecsHelpers.ts` ei kasuta -- need tuleb eemaldada
- Tractor: edge function'il on `töömaht_l` asemel `töömahu_liitrid` ja puudub `tõstevõime_kg` -- parandada
- Forage harvester: edge function'il on ainult `mootor` kategooria, aga `pdfSpecsHelpers.ts` defineerib ka `lõikur`, `tõstuk`, `mõõtmed` -- need tuleb lisada

**Fail 2: `src/components/admin/BrochureDataReview.tsx`**

Praegu kuvab see komponent kõik AI poolt tagastatud väljad. Tuleb:
- Filtreerida kuvamine nii, et näidatakse ainult neid `equipment_columns` võtmeid, mis on defineeritud `equipmentTypeFields.ts` failis (selle masina tüübi jaoks)
- Filtreerida `detailed_specs` kategooriad/väljad nii, et näidatakse ainult neid, mis on `pdfSpecsHelpers.ts` failis defineeritud
- Kasutada silte `equipmentTypeFields.ts` ja `pdfSpecsHelpers.ts` failidest selle asemel, et kasutada oma `COLUMN_LABELS` ja `CATEGORY_LABELS` sõnastikke (eemaldada duplikaadid)

### Tehniline detail

```text
equipmentTypeFields.ts       --> equipment_columns skeem (edge function)
pdfSpecsHelpers.ts           --> detailed_specs skeem (edge function)
BrochureDataReview.tsx       --> filtreerib kuvamise nende kahe alusel
```

Peale seda muudatust:
1. AI ekstraheerib ainult neid välju, mida süsteem tegelikult kasutab
2. Ülevaatuse ekraanil kuvatakse ainult relevantseid välju
3. Puuduvad väljad lisatakse skeemi, nii et AI proovib neid ka täita

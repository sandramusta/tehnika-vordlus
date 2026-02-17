

## Topeltnäitajate eemaldamine ja andmevoo konsolideerimine

### Probleem

Praegu kuvab admin vormi redigeerimisvaade **kahes kohas** sarnaseid tehnilisi näitajaid:
1. **Dünaamilised väljad** (nt Tõstekõrgus, Tõste kaugus, Max tõstevõime, Laius, Kõrgus, Pikkus jne) -- salvestatakse otse equipment tabeli veergudesse
2. **Detailsed spetsifikatsioonid** (samad väljad kategooriate kaupa tabelis) -- salvestatakse detailed_specs JSONB väljale

See tekitab segadust, sest samad andmed on kahes kohas.

### Lahendus

1. **Eemaldame tüübipõhised dünaamilised väljad** vormist (EquipmentForm read 220-234) -- need on "Bunker ja heedrid", "Mootor ja küttesüsteem", "Peksusüsteem", "Tõsteomadused", "Hüdraulika", "Mõõtmed" jne plokid
2. **Jätame alles majandusandmed** (hind, hoolduskulu, eluiga) ja põhiandmed (võimsus, kaal, kütusekulu), sest need on vajalikud TCO/ROI arvutusteks
3. **Brošüüri andmete kinnitamisel** suuname ka equipment_columns väärtused detailsete spetsifikatsioonide tabelisse, et kõik tehnilised andmed oleksid ühes kohas

### Tehnilised detailid

**Fail 1: `src/components/admin/EquipmentForm.tsx`**
- Eemaldame read 220-234 (tüübipõhiste dünaamiliste väljade renderdamine)
- Jätame alles COMMON_FIELDS ploki (Põhiandmed + Majandusandmed), kuna need sisaldavad hinda, hoolduskulu, eluiga jms

**Fail 2: `src/lib/equipmentTypeFields.ts`**
- Eemaldame TYPE_SPECIFIC_FIELDS ekspordi (kuna seda enam vormis ei kasutata)
- Jätame alles COMMON_FIELDS

**Fail 3: `src/pages/Admin.tsx`**
- Brošüüri andmete kinnitamise funktsioonis (`handleConfirmBrochureData`) lisame loogika, mis teisendab `equipment_columns` väärtused ka `detailed_specs` struktuuri, et need ilmuksid DetailedSpecsEditori tabelisse

**Fail 4: `src/components/admin/BrochureDataReview.tsx`**
- Lihtsustame ülevaatuse vaadet -- equipment_columns andmed kuvatakse koos detailed_specs andmetega samas tabeliformaadis, mitte eraldi sektsioonina


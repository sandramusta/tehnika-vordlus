
## Detailsete spetsifikatsioonide dünaamiliseks muutmine tehnika tüübi järgi

### Probleem
`DetailedSpecsEditor` komponent näitab praegu kõikidele tehnikatüüpidele kombainide jaoks mõeldud 12 kategooriat (MOOTOR, KALDTRANSPORTÖÖR, PEKSUSÜSTEEM jne), kuigi peaks näitama ainult valitud tehnika tüübile sobivaid välju.

### Lahendus

#### 1. Laiendada `pdfSpecsHelpers.ts` faili - lisada tehnika tüübipõhised spetsifikatsioonide definitsioonid

Praegu on olemas ainult kombainide kategooriad. Lisan:

- **Teleskooplaadurite kategooriad:**
  - TÕSTEOMADUSED (tõstekõrgus, tõste kaugus, max tõstevõime)
  - HÜDRAULIKA (hüdraulikapumba võimsus)
  - MÕÕTMED (laius, kõrgus, pikkus)
  - MOOTOR (võimsus, kaal)

- **Traktorite kategooriad:**
  - MOOTOR (kütusepaak, töömaht, silindrid, pöördemoment)
  - HÜDRAULIKA (hüdraulikapump, tõstevõime)
  - MÕÕTMED

- **Teiste tehnikatüüpide kategooriad** (hekseldi, rataslaadur, pritsimispritsid, ruloonpress)

Iga tehnikatüüp saab oma:
- `CATEGORY_ORDER_[TYPE]` - kategooriate järjekord
- `CATEGORY_NAMES_[TYPE]` - kategooriate nimed eesti keeles
- `FIELD_NAMES_[TYPE]` - väljade nimed eesti keeles

#### 2. Lisa utility funktsioonid `pdfSpecsHelpers.ts` faili

```typescript
// Tagastab kategooriate järjekorra tehnikatüübi järgi
export function getCategoryOrderForType(typeName?: string): string[]

// Tagastab kategooriate nimed tehnikatüübi järgi  
export function getCategoryNamesForType(typeName?: string): Record<string, string>

// Tagastab väljade nimed tehnikatüübi järgi
export function getFieldNamesForType(typeName?: string): Record<string, Record<string, string>>
```

#### 3. Muuda `DetailedSpecsEditor.tsx` komponenti

- Lisa uus prop: `equipmentTypeName?: string`
- Kasuta dünaamilisi kategooriaid ja välju sõltuvalt tehnikatüübist
- Asenda staatilised impordid dünaamiliste funktsioonidega

#### 4. Muuda `EquipmentForm.tsx` - edasta tehnikatüübi nimi editorile

- Edasta `selectedType?.name` `DetailedSpecsEditor` komponendile

### Tehnilised detailid

**Uued kategooriad teleskooplaaduritele:**

| Kategooria        | Väljad |
|-------------------|--------|
| TÕSTEOMADUSED     | Tõstekõrgus (m), Tõste kaugus (m), Max tõstevõime (kg) |
| HÜDRAULIKA        | Hüdraulikapumba võimsus (l/min) |
| MÕÕTMED           | Laius (mm), Kõrgus (mm), Pikkus (mm) |
| MOOTOR            | Võimsus (hj), Kaal (kg), Kütusekulu (l/h) |

**Mõjutatud failid:**
1. `src/lib/pdfSpecsHelpers.ts` - lisa tehnikatüübipõhised definitsioonid ja utility funktsioonid
2. `src/components/admin/DetailedSpecsEditor.tsx` - muuda dünaamiliseks
3. `src/components/admin/EquipmentForm.tsx` - edasta tehnikatüübi nimi

### Tulemus

Pärast muudatust:
- **Kombainidel** kuvatakse 12 kategooriat (MOOTOR, PEKSUSÜSTEEM jne)
- **Teleskooplaadurite** kuvatakse 4 kategooriat (TÕSTEOMADUSED, HÜDRAULIKA, MÕÕTMED, MOOTOR)
- **Traktoritel** kuvatakse 3 kategooriat (MOOTOR, HÜDRAULIKA, MÕÕTMED)
- Iga tehnika tüüp saab oma spetsifikatsioonid, mis vastavad võrdlustabeli näitajatele

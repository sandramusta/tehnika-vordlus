
# Müütide haldamise sektsioon Admin lehel

## Ülevaade

Lisa "Haldus" (Admin) vahelehele uus sektsioon müütide lisamiseks, muutmiseks ja kustutamiseks. Praegu on müüdid otse koodis defineeritud (`Myths.tsx`), kuid nüüd viiakse need andmebaasi, et võimaldada dünaamilist haldamist.

## Andmebaasi muudatused

### Uus tabel: `myths`

| Veerg | Tüüp | Kirjeldus |
|-------|------|-----------|
| `id` | uuid | Primaarvõti |
| `category` | text | Kategooria võti (finance, tech, weather, market) |
| `myth` | text | Müüdi tekst |
| `reality` | text | Tegelikkuse tekst |
| `advantage` | text | John Deere'i eelise tekst |
| `sort_order` | integer | Järjestus kategooria sees |
| `created_at` | timestamp | Loomise aeg |
| `updated_at` | timestamp | Muutmise aeg |

### Kategooriad

- `finance` - Finantsid ja investeeringud
- `tech` - Tehnika ja töökindlus
- `weather` - Ilm, saagikus ja juhtimine
- `market` - Turg ja konkurents

## Tehnilised muudatused

### 1. Andmebaasi migratsioon

Loome uue tabeli `myths` koos RLS poliitikatega avalikuks lugemiseks ja täielikuks haldamiseks.

### 2. Tüübid: `src/types/equipment.ts`

Lisa uus tüüp:

```typescript
export interface Myth {
  id: string;
  category: string;
  myth: string;
  reality: string;
  advantage: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

### 3. Andmepäringud: `src/hooks/useEquipmentData.ts`

Lisa uued hookid:

- `useMyths()` - kõigi müütide päring
- `useCreateMyth()` - uue müüdi loomine
- `useUpdateMyth()` - müüdi uuendamine
- `useDeleteMyth()` - müüdi kustutamine

### 4. Admin leht: `src/pages/Admin.tsx`

Lisa uus tab "Müüdid" olemasolevate tabide kõrvale:

```text
┌─────────────────────────────────────────────────────────────────┐
│  [Tehnika]  [Argumendid]  [Müüdid]   ◄── UUS TAB               │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Müütide haldamine                    [+ Lisa müüt]         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  FINANTSID JA INVESTEERINGUD                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Müüt: Uue masina ost on liiga suur risk...    [✏️] [🗑️]   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  TEHNIKA JA TÖÖKINDLUS                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Müüt: Vana masin on odavam...                 [✏️] [🗑️]   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Müütide leht: `src/pages/Myths.tsx`

Uuenda Myths.tsx kasutama andmebaasist pärinevaid andmeid staatiliste andmete asemel:

- Asenda hardcoded massiivid `useMyths()` hookiga
- Grupeeri müüdid kategooriate kaupa
- Kui andmebaas on tühi, kuva sobiv teade

## Dialoogivorm müütide lisamiseks/muutmiseks

```text
┌─────────────────────────────────────────────────────┐
│         Lisa uus müüt / Muuda müüti                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Kategooria:  [▼ Finantsid ja investeeringud     ] │
│                                                     │
│  Müüt:                                              │
│  ┌─────────────────────────────────────────────┐   │
│  │ Kirjelda levinud väärarusaama...            │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Tegelikkus:                                        │
│  ┌─────────────────────────────────────────────┐   │
│  │ Selgita tegelikku olukorda...               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  John Deere'i Eelis:                                │
│  ┌─────────────────────────────────────────────┐   │
│  │ Too välja John Deere eelis...               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Järjestus: [0]                                     │
│                                                     │
│           [         Salvesta         ]              │
└─────────────────────────────────────────────────────┘
```

## Andmete migreerimine

Olemasolevad hardcoded müüdid sisestatakse andmebaasi migratsiooni käigus:

- 2 müüti: Finantsid (finance)
- 3 müüti: Tehnika (tech)
- 3 müüti: Ilm ja juhtimine (weather)
- 2 müüti: Turg (market)

## Muudetavad failid

| Fail | Muudatus |
|------|----------|
| `supabase/migrations/` | **UUS** - Loob `myths` tabeli ja sisestab algandmed |
| `src/types/equipment.ts` | Lisa `Myth` interface |
| `src/hooks/useEquipmentData.ts` | Lisa `useMyths`, `useCreateMyth`, `useUpdateMyth`, `useDeleteMyth` hookid |
| `src/pages/Admin.tsx` | Lisa uus "Müüdid" tab koos CRUD funktsioonidega |
| `src/pages/Myths.tsx` | Muuda kasutama andmebaasi päringuid |

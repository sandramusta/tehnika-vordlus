
# Kaks ROI Kalkulaatorit Kõrvuti Võrdluseks

## Ülevaade

Loome uue komponendi, mis kuvab kaks ROI kalkulaatorit kõrvuti:
- **Vasak pool**: "Olemasolev masin" - praeguse masina parameetrid
- **Parem pool**: "Uus masin" - huvi pakkuva masina parameetrid

Mõlemad kalkulaatorid on üksteisest sõltumatud ja kasutaja saab sisestada erinevad väärtused. Lisaks genereeritakse võrdlusraport PDF-failina, mis sisaldab mõlema masina andmeid ja kokkuvõtvat võrdlust.

## Visuaalne paigutus

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     ROI Võrdluskalkulaator                          │
├────────────────────────────┬────────────────────────────────────────┤
│                            │                                        │
│   OLEMASOLEV MASIN         │          UUS MASIN                     │
│   (Punane/hall värv)       │       (John Deere roheline)            │
│                            │                                        │
│   [Sisendväljad...]        │       [Sisendväljad...]                │
│   [Tulemused...]           │       [Tulemused...]                   │
│                            │                                        │
├────────────────────────────┴────────────────────────────────────────┤
│                       VÕRDLUSKOKKUVÕTE                              │
│   • TCO võrdlus tulpdiagramm (mõlemad masinad)                      │
│   • Sääst uue masina kasuks (€ ja %)                                │
│   • Tasuvusaeg                                                      │
├─────────────────────────────────────────────────────────────────────┤
│            [Genereeri võrdlus PDF-raport] nupp                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Tehnilised muudatused

### 1. Uus komponent: `ROIComparisonCalculator.tsx`

Loome uue komponendi, mis sisaldab:

- **Kaks sõltumatut olekut** (`ROIInputs` tüübiga):
  - `existingMachineInputs` - olemasoleva masina sisendid
  - `newMachineInputs` - uue masina sisendid
  
- **Kaks sisendpaneeli kõrvuti** (2-column grid layout):
  - Vasak paneel: "Olemasolev masin" (hall/punane aktsent)
  - Parem paneel: "Uus masin (John Deere)" (roheline aktsent)
  
- **Ühine võrdluskokkuvõte** all:
  - TCO võrdlus tulpdiagrammiga (Recharts)
  - Kokkuvõtlikud numbrid: kogusääst, tasuvusaeg, ROI erinevus

- **PDF võrdlusraporti genereerimine**:
  - Sisaldab mõlema masina parameetreid ja tulemusi
  - Võrdlustabel kõrvuti
  - Kokkuvõte säästu kohta

### 2. Sisendväljade organiseerimine

Kuna kaks täielikku kalkulaatorit kõrvuti võtab palju ruumi, optimeerime kuvamist:

- **Kompaktne sisendvorm** - väiksemad sisendväljad
- **Kokkukäivad sektsioonid** (`Collapsible` komponent) - kasutaja saab avada/sulgeda sisendgruppe
- **Tab-vaade alternatiiv mobiilil** - väiksel ekraanil kuvatakse kalkulaatorid üksteise all või tab-vaatena

### 3. PDF-raporti struktuur

```text
┌───────────────────────────────────────────────────┐
│            ROI VÕRDLUSRAPORT                      │
│            Genereeritud: [kuupäev]                │
├───────────────────────────────────────────────────┤
│                                                   │
│  SISENDPARAMEETRID                                │
│  ┌───────────────┬───────────────┬───────────────┐│
│  │ Parameeter    │ Olemasolev    │ Uus masin     ││
│  ├───────────────┼───────────────┼───────────────┤│
│  │ Ostuhind      │ 350 000 €     │ 500 000 €     ││
│  │ Hektarid/a    │ 800 ha        │ 800 ha        ││
│  │ ...           │ ...           │ ...           ││
│  └───────────────┴───────────────┴───────────────┘│
│                                                   │
│  TULEMUSED                                        │
│  ┌───────────────┬───────────────┬───────────────┐│
│  │ Näitaja       │ Olemasolev    │ Uus masin     ││
│  ├───────────────┼───────────────┼───────────────┤│
│  │ TCO (5a)      │ 450 000 €     │ 380 000 €     ││
│  │ ROI           │ 15%           │ 35%           ││
│  │ Kulu/ha       │ 112 €         │ 95 €          ││
│  │ ...           │ ...           │ ...           ││
│  └───────────────┴───────────────┴───────────────┘│
│                                                   │
│  KOKKUVÕTE                                        │
│  • Uue masinaga säästaksid 5 aasta jooksul:       │
│    70 000 € (15.5% madalam TCO)                   │
│  • Uue masina tasuvusaeg vs olemasolev: 3.2 aastat│
│                                                   │
└───────────────────────────────────────────────────┘
```

### 4. Comparison.tsx uuendamine

Asendame praeguse `<ROICalculator />` komponendi uue `<ROIComparisonCalculator />` komponendiga.

## Muudetavad failid

| Fail | Muudatus |
|------|----------|
| `src/components/comparison/ROIComparisonCalculator.tsx` | **UUS** - Võrdluskalkulaatori põhikomponent |
| `src/components/comparison/SingleROICalculator.tsx` | **UUS** - Ühe masina sisendvorm (korduvkasutatav) |
| `src/pages/Comparison.tsx` | Asendame `ROICalculator` uue `ROIComparisonCalculator` komponendiga |

## Kasutajakogemus

1. Kasutaja avab lehe ja näeb kahte kalkulaatorit kõrvuti
2. Vasakusse sisestab olemasoleva masina andmed
3. Paremale sisestab huvi pakkuva (uue) masina andmed
4. All kuvatakse automaatselt võrdluskokkuvõte
5. Nupu "Genereeri võrdlus PDF" vajutamisel salvestatakse fail, mille saab kliendile saata

## Alternatiivne mobiilivaade

Kuna kaks kalkulaatorit kõrvuti ei mahu väiksele ekraanile:
- **Desktop (>1024px)**: Kaks tulpa kõrvuti
- **Tahvel/mobiil (<1024px)**: Kalkulaatorid üksteise all või Tabs-vaade ("Olemasolev" | "Uus masin")

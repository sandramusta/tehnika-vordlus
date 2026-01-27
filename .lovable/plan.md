
# Kahekordne filtreerimissüsteem võrdlustabelis

## Ülevaade

Lisame kaks eraldi võrdlusrežiimi, mis töötavad kõrvuti:

1. **Automaatne konkurendisobitamine** - Vali tüüp → bränd → mudel → süsteem leiab automaatselt konkurendid ±50hj vahemikus samas kategoorias
2. **Käsitsi multi-select** - Vali tüüp → vali käsitsi 1-3 mudelit võrdluseks

## Kasutajaliidese kontseptsioon

```text
+--------------------------------------------------+
|           TEHNIKA VÕRDLUS                        |
+--------------------------------------------------+
|  Võrdlusrežiim:                                  |
|  [🔘 Automaatne konkureerimine] [⚪ Käsitsi valik]|
+--------------------------------------------------+
|                                                  |
|  Automaatne režiim:                             |
|  [Tüüp ▼] → [Bränd ▼] → [Mudel ▼]               |
|                                                  |
|  "Leitud 3 konkurenti ±50hj vahemikus"          |
|                                                  |
+--------------------------------------------------+
|  VÕI                                            |
+--------------------------------------------------+
|  Käsitsi režiim:                                |
|  [Tüüp ▼]  [Vali 1-3 mudelit... ▼]              |
|                                                  |
+--------------------------------------------------+
```

## Tehniline teostus

### 1. Uus komponent: ComparisonModeSelector.tsx

Loome tabbed või radio-nupu põhise režiimivaliku:
- "Automaatne konkureerimine" - kasutab olemasolevat EquipmentFilters loogikat
- "Käsitsi valik" - kasutab olemasolevat ModelMultiSelect loogikat

### 2. Uuendused Comparison.tsx lehel

Lisame state:
- `comparisonMode: "auto" | "manual"` - praegune režiim

Mõlemad režiimid jagavad sama `selectedType` state'i, aga:
- Auto režiimis: `selectedBrand`, `selectedModel` → arvutab `competitors` automaatselt
- Manual režiimis: `selectedModels` (multi-select)

### 3. Automaatse konkurendiotsingu loogika

Kui kasutaja valib mudeli auto-režiimis:

```text
1. Võta valitud mudeli engine_power_hp
2. Filtreeri sama equipment_type_id masinad
3. Filtreeri: |competitor.engine_power_hp - selected.engine_power_hp| <= 50
4. Filtreeri: competitor.brand_id != selected.brand_id (teiste brändide masinad)
5. Näita võrdlustabelis: valitud mudel + leitud konkurendid
```

### 4. EquipmentFilters.tsx uuendused

Taastame ja täiustame kolmeastmelist valikut:
- Type → Brand → Model (järjestikune valik)
- Pärast mudeli valikut kutsub callback, mis käivitab konkurendiotsingu

### 5. Uus hook: useCompetitors

```typescript
function useCompetitors(selectedModel: Equipment | null, allEquipment: Equipment[]) {
  return useMemo(() => {
    if (!selectedModel?.engine_power_hp) return [];
    
    const HP_RANGE = 50;
    return allEquipment.filter(eq => 
      eq.id !== selectedModel.id &&
      eq.equipment_type_id === selectedModel.equipment_type_id &&
      eq.brand_id !== selectedModel.brand_id &&
      eq.engine_power_hp &&
      Math.abs(eq.engine_power_hp - selectedModel.engine_power_hp) <= HP_RANGE
    );
  }, [selectedModel, allEquipment]);
}
```

## Muudetavad failid

| Fail | Muudatus |
|------|----------|
| `src/pages/Comparison.tsx` | Lisa režiimivalik, mõlemad filtrikomponendid, konkurendiotsingu loogika |
| `src/components/comparison/EquipmentFilters.tsx` | Taasta täielik Type→Brand→Model voog |
| `src/components/comparison/ModelMultiSelect.tsx` | Väiksemad kohandused (kui vajalik) |
| Uus: `src/components/comparison/ComparisonModeSelector.tsx` | Režiimivaliku UI |
| Uus: `src/hooks/useCompetitors.ts` | Konkurendiotsingu loogika (valikuline, võib olla lehes) |

## Kasutajakogemus

### Automaatne režiim (vaikimisi):
1. Kasutaja valib tehnika tüübi → "Kombain"
2. Valib brändi → "John Deere"
3. Valib mudeli → "S7-700" (450 hj)
4. Süsteem näitab: "Leitud 3 konkurenti vahemikus 400-500 hj"
5. Tabel näitab: John Deere S7-700 + Case IH 7250 + Claas Lexion 7500 + New Holland CR9

### Käsitsi režiim:
1. Kasutaja valib tehnika tüübi → "Kombain"
2. Avab multi-select dropdown
3. Valib käsitsi 1-3 mudelit (olenemata võimsusest)
4. Tabel näitab valitud mudelid

## Olemasoleva funktsionaalsuse säilitamine

- PDF eksport töötab mõlema režiimiga
- TCO ja Competitive Advantages sektsioonid töötavad mõlema režiimiga
- ROI kalkulaator jääb alati nähtavaks
- Kõik olemasolevad filtrid ja "JD eelis" badge'id säilivad

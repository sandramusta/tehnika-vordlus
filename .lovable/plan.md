
# Ühtne näitajate kuvamine kõikidele kombainidele

## Probleem

Praegu kuvatakse detailseid spetsifikatsioone (`MOOTOR`, `PEKSUSÜSTEEM`, `INTEGREERITUD TEHNOLOOGIA` jne) ainult siis, kui vähemalt ühel valitud masinal on selles kategoorias andmed. See tähendab, et:

- Kui valida ainult Case IH või Claas mudelid (millel puuduvad `detailed_specs` andmed), siis detailseid sektsioone ei kuvata üldse
- Kui valida John Deere mudel koos konkurendiga, siis kõik John Deere kategooriad kuvatakse

## Lahendus

Muudame loogika nii, et **kombainide puhul kuvatakse alati kõik standardsed kategooriad** - "Võimsus" kuni "Integreeritud tehnoloogia". Puuduvad väärtused kuvatakse kui "—".

## Tehniline teostus

### Faili muudatused: `src/components/comparison/DetailedSpecsTableRows.tsx`

**1. Lisa kontrollmehhanism tehnika tüübi jaoks:**

Lisame `DetailedSpecsTableRowsProps` interface'ile uue `equipmentTypeName` prop:

```typescript
interface DetailedSpecsTableRowsProps {
  allModels: Equipment[];
  selectedModelId: string;
  equipmentTypeName?: string;  // Uus prop
}
```

**2. Muuda `getAvailableCategories` funktsiooni:**

```typescript
function getAvailableCategories(allModels: Equipment[], forceAll: boolean = false): string[] {
  // Kombainide puhul näita alati kõik kategooriad
  if (forceAll) {
    return CATEGORY_ORDER.slice();
  }
  
  // Muu tehnika puhul - praegune loogika
  const availableCategories = new Set<string>();
  allModels.forEach((model) => {
    const specs = model.detailed_specs;
    if (specs && typeof specs === "object") {
      Object.keys(specs).forEach((key) => {
        if (CATEGORY_ORDER.includes(key)) {
          availableCategories.add(key);
        }
      });
    }
  });
  return CATEGORY_ORDER.filter((cat) => availableCategories.has(cat));
}
```

**3. Komponendi kutsumisel kontrolli tehnika tüüpi:**

```typescript
export function DetailedSpecsTableRows({
  allModels,
  selectedModelId,
  equipmentTypeName,
}: DetailedSpecsTableRowsProps) {
  // Kombainide puhul näita alati kõik kategooriad
  const isCombine = equipmentTypeName === "combine";
  const availableCategories = getAvailableCategories(allModels, isCombine);
  // ...
}
```

### Faili muudatused: `src/components/comparison/MultiModelComparison.tsx`

**1. Lisa tehnika tüübi nimi props'idesse:**

```typescript
interface MultiModelComparisonProps {
  selectedModels: Equipment[];
  equipmentTypeName?: string;  // Uus prop
}
```

**2. Edasta tehnika tüüp DetailedSpecsTableRows komponendile:**

```typescript
<DetailedSpecsTableRows 
  allModels={selectedModels} 
  selectedModelId={selectedModels[0]?.id || ""}
  equipmentTypeName={equipmentTypeName}
/>
```

### Faili muudatused: `src/pages/Comparison.tsx`

**1. Edasta tehnika tüübi nimi võrdlustabelile:**

```typescript
<MultiModelComparison 
  selectedModels={displayModels} 
  equipmentTypeName={currentEquipmentType?.name}
/>
```

## Tulemus

| Enne | Pärast |
|------|--------|
| Case IH mudelitel puuduvad detailsed sektsioonid | Kõik sektsioonid kuvatakse, puuduvad väärtused = "—" |
| Erinevad read olenevalt valitud mudelitest | Ühtsed read kõikide kombainide võrdlustes |
| Automaatne ja käsitsi režiim võivad kuvada erinevaid ridu | Mõlemad režiimid näitavad alati samu ridu |

## Muudetavad failid

| Fail | Muudatus |
|------|----------|
| `src/components/comparison/DetailedSpecsTableRows.tsx` | Lisa `equipmentTypeName` prop ja `forceAll` loogika |
| `src/components/comparison/MultiModelComparison.tsx` | Lisa `equipmentTypeName` prop ja edasta see edasi |
| `src/pages/Comparison.tsx` | Edasta `equipmentTypeName` MultiModelComparison komponendile |

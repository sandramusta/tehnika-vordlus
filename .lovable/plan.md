
# PDF ekspordi laiendamine kõikide tabeli näitajatega

## Probleem

Praegune PDF eksport sisaldab ainult **9 põhinäitajat** (SPEC_ROWS):
- Võimsus, Viljabunker, Heedri laius, Kütusepaak, Puhasti pindala, Rootori läbimõõt, Läbilaskevõime, Kaal, Kütusekulu

Kuid tabelis kuvatakse **12 kategooriat** kõigi alamväljadega:
1. MOOTOR (9 välja)
2. KALDTRANSPORTÖÖR / ETTEANNE (4 välja)
3. PEKS JA SEPAREERIMINE (6 välja)
4. PUHASTUSSÜSTEEM (4 välja)
5. TERAPUNKER (6 välja)
6. KORISTUSJÄÄKIDE KÄITLEMINE (2 välja)
7. NÕLVAKUSÜSTEEM (3 välja)
8. MÕÕTMED (3 välja)
9. HEEDRID (2 välja)
10. KABIIN (3 välja)
11. VEOSÜSTEEM (2 välja)
12. INTEGREERITUD TEHNOLOOGIA (4 välja)

## Lahendus

Laiendame PDF ekspordi funktsioone, et need sisaldaksid KÕIK kategooriad ja väljad `DetailedSpecsTableRows.tsx` komponendist.

## Tehniline teostus

### 1. Lisa kategooriate ja väljanimede definitsioonid PDF ekspordifaili

Impordime või kopeerime `CATEGORY_ORDER`, `CATEGORY_NAMES` ja `FIELD_NAMES` konstandid `ComparisonPDFExport.tsx` faili.

### 2. Lisa abifunktsioon detailsete spetsifikatsioonide kogumiseks

```typescript
function buildDetailedSpecRows(
  selectedModels: Equipment[],
  isCombine: boolean
): { category: string; rows: string[][] }[] {
  const result: { category: string; rows: string[][] }[] = [];
  
  // Kombainide puhul näita alati kõik kategooriad
  const categories = isCombine ? CATEGORY_ORDER : getAvailableCategories(selectedModels);
  
  categories.forEach((categoryKey) => {
    const categoryName = CATEGORY_NAMES[categoryKey] || categoryKey;
    const fields = getAllFieldsForCategory(selectedModels, categoryKey);
    const fieldNames = FIELD_NAMES[categoryKey] || {};
    
    const rows: string[][] = [];
    fields.forEach((fieldKey) => {
      const label = fieldNames[fieldKey] || fieldKey.replace(/_/g, " ");
      const values = selectedModels.map((model) => {
        const specs = model.detailed_specs;
        const categoryData = specs?.[categoryKey] as Record<string, unknown> | null;
        const value = categoryData?.[fieldKey];
        return formatDetailedValue(value);
      });
      rows.push([`  ${label}`, ...values]);
    });
    
    if (rows.length > 0 || isCombine) {
      result.push({ category: categoryName, rows });
    }
  });
  
  return result;
}
```

### 3. Muuda `generateComparisonTablePDF` funktsiooni

Asendame praeguse `SPEC_ROWS` loogika detailsete spetsifikatsioonidega:

```typescript
export function generateComparisonTablePDF(
  selectedModels: Equipment[],
  equipmentType: EquipmentType | null
): void {
  const doc = new jsPDF();
  const isCombine = equipmentType?.name === "combine";
  
  // ... header ja pealkiri ...
  
  const headers = ["Näitaja", ...selectedModels.map(m => `${m.brand?.name}\n${m.model_name}`)];
  
  // Kogu kõik kategooriad ja väljad
  const detailedSpecs = buildDetailedSpecRows(selectedModels, isCombine);
  
  const specBody: string[][] = [];
  detailedSpecs.forEach(({ category, rows }) => {
    // Lisa kategooria pealkiri
    specBody.push([category, ...selectedModels.map(() => "")]);
    // Lisa kõik väljad
    rows.forEach((row) => specBody.push(row));
  });
  
  // Lisa kuluread lõppu
  COST_ROWS.forEach(row => {
    const values = selectedModels.map(m => {
      const val = m[row.key as keyof Equipment] as number | null;
      if (row.format === "currency") return formatCurrency(val);
      if (row.suffix) return val !== null ? `${formatNumber(val)}${row.suffix}` : "—";
      return formatNumber(val);
    });
    specBody.push([row.label, ...values]);
  });
  
  // TCO rida
  specBody.push(["TCO (Kogukulu)", ...selectedModels.map(m => formatCurrency(calculateTCO(m)))]);
  
  // Genereeri tabel
  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: specBody,
    theme: "striped",
    headStyles: { fillColor: [34, 87, 46], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { cellWidth: 60 } },
    // Kategooria pealkirjad boldis
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const text = data.cell.text[0];
        if (Object.values(CATEGORY_NAMES).includes(text)) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
        }
      }
    },
  });
  
  // ... footer ...
}
```

### 4. Uuenda ka `generateComparisonWithTCOPDF` ja `generateFullReportPDF`

Sama loogika rakendub kõikidele PDF ekspordi funktsioonidele.

### 5. Lisa parameetrina `equipmentTypeName`

Kuna PDF eksport vajab teada, kas tegemist on kombainiga, lisame selle info props'idesse.

## Muudetavad failid

| Fail | Muudatus |
|------|----------|
| `src/components/comparison/ComparisonPDFExport.tsx` | Lisa kategooriate definitsioonid, abifunktsioonid ja laienda kõiki PDF funktsioone |
| `src/pages/Comparison.tsx` | Edasta `equipmentTypeName` PDF ekspordi komponendile |

## Tulemus

| Enne | Pärast |
|------|--------|
| 9 näitajat PDF-is | Kõik 12 kategooriat (48+ välja) |
| Puuduvad detailsed spetsifikatsioonid | Kõik MOOTOR, PEKS, PUHASTUS jne sektsioonid |
| Käsitsi ja automaatne režiim erinevad | Ühtsed näitajad mõlemas režiimis |

## Mitmeleheküljeline PDF

Kuna andmeid on palju, genereerib `autoTable` automaatselt vajalikul arvul lehekülgi. Lisame lehekülje numbrid ja päised igale lehele.

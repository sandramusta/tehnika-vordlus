
# DetailedSpecsEditor kuvamine uue masina lisamisel

## Probleem

Praegu kuvatakse `DetailedSpecsEditor` komponent ainult siis, kui muudetakse **olemasolevat** tehnikat:

```typescript
{editingEquipment && (
  <DetailedSpecsEditor
    equipment={editingEquipment}
    onChange={setDetailedSpecs}
  />
)}
```

Uue masina lisamisel on `editingEquipment` väärtus `null`, seega editorit ei kuvata ja kasutaja ei saa kohe sisestada detailseid spetsifikatsioone.

## Lahendus

Muudame `DetailedSpecsEditor` komponenti nii, et see aktsepteerib valikulist `equipment` prop'i ja töötab ka tühja andmekomplektiga uue masina puhul.

## Tehniline teostus

### 1. Muuda `DetailedSpecsEditor` komponendi interface'i

Muudame `equipment` prop valikuliseks ja lisame `initialSpecs` prop:

```typescript
interface DetailedSpecsEditorProps {
  equipment?: Equipment | null;
  initialSpecs?: Record<string, unknown>;
  onChange: (updatedSpecs: Record<string, unknown>) => void;
}
```

### 2. Uuenda komponendi loogikat

Komponendi sees kasutame kas `equipment.detailed_specs` või `initialSpecs`:

```typescript
export function DetailedSpecsEditor({ 
  equipment, 
  initialSpecs = {},
  onChange 
}: DetailedSpecsEditorProps) {
  const [internalSpecs, setInternalSpecs] = useState<Record<string, Record<string, unknown>>>(
    (equipment?.detailed_specs as Record<string, Record<string, unknown>>) || 
    (initialSpecs as Record<string, Record<string, unknown>>) || 
    {}
  );
  
  // Sync with external changes
  useEffect(() => {
    if (equipment?.detailed_specs) {
      setInternalSpecs(equipment.detailed_specs as Record<string, Record<string, unknown>>);
    }
  }, [equipment?.detailed_specs]);

  // ...rest of component uses internalSpecs instead of equipment.detailed_specs
}
```

### 3. Muuda Admin.tsx failis tingimust

Eemaldame `editingEquipment &&` tingimuse ja kuvame editori alati:

```typescript
{/* Detailed specs editor - alati nähtav */}
<DetailedSpecsEditor
  equipment={editingEquipment}
  initialSpecs={detailedSpecs}
  onChange={setDetailedSpecs}
/>
```

### 4. Samuti kuva brošüüride sektsiooni ainult olemasolevale tehnikale

Brošüüride nimekiri jääb nähtavaks ainult olemasolevate masinate puhul (loogiline, kuna uuel masinal pole veel brošüüre):

```typescript
{editingEquipment && (
  <EquipmentBrochuresList equipment={editingEquipment} />
)}
```

## Muudetavad failid

| Fail | Muudatus |
|------|----------|
| `src/components/admin/DetailedSpecsEditor.tsx` | Muuda interface valikuliseks, lisa sisemine state ja sünkroonimine |
| `src/pages/Admin.tsx` | Eemalda `editingEquipment &&` tingimus DetailedSpecsEditor ümbert |

## Tulemus

| Enne | Pärast |
|------|--------|
| Detailsed spetsifikatsioonid ainult olemasolevate masinate muutmisel | Spetsifikatsioonid nähtavad ka uue masina lisamisel |
| Kasutaja peab esmalt masina salvestama, seejärel muutma | Kasutaja saab kohe kõik andmed sisestada |

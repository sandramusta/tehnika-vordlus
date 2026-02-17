

## "Salvestan..." ja "Laen..." probleemide lahendamine

### Juurprobleem

1. **"Salvestan..." nupp jääb kinni**: `Admin.tsx` (rida 506) kasutab `createEquipment.isPending || updateEquipment.isPending` -- need mutation hook'id elavad paremas komponentis (`Admin`) ja kui eelmine salvestamine jäi pooleli (aeglane vastus, vorguviga), jääb `isPending` trueks ka järgmise dialoogi avamisel.

2. **"Laen..." brošüüridel**: `EquipmentBrochuresList` fetch voib jääda rippuma kui Supabase on aeglane.

### Lahendus

**Fail 1: `src/pages/Admin.tsx`**
- Lisa lokaalne `isSavingEquipment` state muutuja (rida ~91)
- Kasuta seda `handleEquipmentFormSubmit` funktsioonis manuaalselt (try alguses `true`, finally plokis `false`)
- Muuda rida 506: `isSubmitting={isSavingEquipment}` selle asemel, et kasutada `isPending`

**Fail 2: `src/components/admin/EquipmentBrochuresList.tsx`**
- Lisa fetch'ile timeout (10 sekundit), et see ei jääks igavesti ootama
- Lisa `AbortController`, mis katkestab aegunud päringu

### Tehniline detail

```typescript
// Admin.tsx — lokaalne salvestamise olek
const [isSavingEquipment, setIsSavingEquipment] = useState(false);

const handleEquipmentFormSubmit = useCallback(async (...) => {
  setIsSavingEquipment(true);
  try {
    // ... existing save logic
  } catch (error) {
    // ... error handling
  } finally {
    setIsSavingEquipment(false);
  }
}, [...]);

// Rida 506:
isSubmitting={isSavingEquipment}
```

```typescript
// EquipmentBrochuresList.tsx — timeout
useEffect(() => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  const fetchBrochures = async () => {
    try {
      const { data, error } = await supabase
        .from("equipment_brochures")
        .select("*")
        .eq("equipment_id", equipment.id)
        .abortSignal(controller.signal)
        .order("created_at", { ascending: false });
      // ...
    } catch { setBrochures([]); }
    finally { setIsLoading(false); clearTimeout(timeoutId); }
  };
  
  fetchBrochures();
  return () => { controller.abort(); clearTimeout(timeoutId); };
}, [equipment.id]);
```


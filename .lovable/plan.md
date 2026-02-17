

## Brošüüri üleslaadimise timeout'i parandamine

### Juurprobleem

`BrochureUpload.tsx` ridadel 103-129 on `AbortController` loodud ja 120-sekundiline timeout seatud, **AGA signal ei ole kunagi ühendatud `supabase.functions.invoke` kutsega**. See tähendab:

1. Timer tikub 120 sekundit ja kutsub `controller.abort()`
2. Aga kuna signal ei ole invoke'ile edastatud, siis HTTP päring **ei katke kunagi**
3. `supabase.functions.invoke` ei viska viga (ta tagastab `{ data, error }` objekti), seega `catch` plokk rida 123 ei käivitu kunagi
4. UI jääb igavesti "Ekstraheerin andmeid..." olekusse

### Lahendus

**Fail: `src/components/admin/BrochureUpload.tsx` (read 102-130)**

Asendame praeguse katkise AbortController loogika **`Promise.race`** mustriga, mis tegelikult töötab:

```typescript
// Step 4: Call edge function with 120s timeout using Promise.race
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error("Ekstraheerimine aegus (2 min). Proovi väiksema PDF-iga.")), 120000);
});

const invokePromise = supabase.functions.invoke(
  "extract-brochure-specs",
  {
    body: {
      brochure_id: brochureRecord.id,
      pdf_content: pdfContent,
      model_name: equipment.model_name,
      equipment_type: equipment.equipment_type?.name || "combine",
    },
  }
);

const response = await Promise.race([invokePromise, timeoutPromise]);
const extractionResult = response.data;
const extractionError = response.error;
```

See tagab, et kui edge function ei vasta 120 sekundi jooksul, visatakse viga ja UI näitab veateadet "Ekstraheerimine aegus" selle asemel, et jääda igavesti laadima.


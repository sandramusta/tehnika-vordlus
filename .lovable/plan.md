

## Brošüüri üleslaadimise ja salvestamise "jääb laadima" probleemide parandamine

### Tuvastatud probleemid

1. **Brošüüri üleslaadimine jääb laadima**: Edge function kutsel puudub timeout. Kui AI analüüs vottab kaua aega (suurte PDF-ide puhul), jääb brauser lihtsalt ootama -- lõpmatuseni. Samuti on kliendipoolne PDF teksti lugemine (`readPdfAsText`) vigane -- see ei suuda kaasaegseid tihendatud PDF-e lugeda ja saadab AI-le binaarseid jäätmeid.

2. **Salvesta nupp jääb "Salvestan..." peale**: Kui eelmine mutation ebaonnestub (nt vorguviga), siis React Query `isPending` olek voib jääda kinni. Vaja on paremat veakäsitlust.

3. **Brošüüride laadimise lõputu spinner**: `EquipmentBrochuresList` komponendi fetch voib vaikselt ebaonnestuda ja loading olek jääb trueks.

4. **React ref hoiatus**: `BrochureUpload` komponent saab Radix Dialog'ilt ref'i, aga ei kasuta `forwardRef`'i. See tekitab konsooli hoiatuse ja voib põhjustada renderdamisprobleeme.

### Lahendusplaan

**Fail 1: `src/components/admin/BrochureUpload.tsx`**
- Lisa edge function kutsele 120-sekundiline timeout (`AbortController`)
- Kui timeout saabub, sea staatus "error" ja kuva selge veateade
- Lisa `forwardRef` wrapper, et Radix Dialog ref-hoiatus kaoks
- Paranda `readPdfAsText` -- kui teksti ei suudeta lugeda, saada AI-le ausalt teada, et tekst on minimaalne

**Fail 2: `src/components/admin/EquipmentBrochuresList.tsx`**
- Lisa veakäsitlus `catch` plokki, et loading olek läheks alati false'iks
- Lisa ka timeout fetch'ile, et see ei jääks igavesti laadima

**Fail 3: `src/pages/Admin.tsx`**
- Paranda `handleEquipmentFormSubmit` veakäsitlust, et mutation kindlasti lahti lastaks ka ootamatute vigade puhul (nt vorgukatkestus)

### Tehniline detailid

**Timeout lisamine edge function kutsele:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 120000);

try {
  const { data, error } = await supabase.functions.invoke(
    "extract-brochure-specs",
    { body: { ... }, signal: controller.signal }
  );
  clearTimeout(timeoutId);
} catch (err) {
  clearTimeout(timeoutId);
  if (err.name === 'AbortError') {
    throw new Error('Ekstraheerimine aegus. Proovi väiksema PDF-iga.');
  }
  throw err;
}
```

**forwardRef lisamine BrochureUpload-ile:**
```typescript
export const BrochureUpload = forwardRef<HTMLDivElement, BrochureUploadProps>(
  function BrochureUpload({ equipment, onExtractionComplete }, ref) {
    // ... existing code
    return <div ref={ref} className="space-y-3">...</div>;
  }
);
```

**EquipmentBrochuresList vigade käsitlus:**
```typescript
} catch (error) {
  console.error("Failed to fetch brochures:", error);
  setBrochures([]);  // ensure empty state shown
} finally {
  setIsLoading(false);  // already there, but ensure it runs
}
```


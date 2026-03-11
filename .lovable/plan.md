

## Probleem

Kui admin kustutab näitaja (nt `võimsus_hj` kategooriast `mootor`), salvestatakse see `__hidden_fields` massiivi masina `detailed_specs` JSONB-s. Kuid brošüüri ekstraheerimise ülevaatuses (`BrochureDataReview.tsx`) kasutatakse staatilist skeemi (`pdfSpecsHelpers.ts`), mis ei kontrolli `__hidden_fields` olemasolu. Seetõttu:

1. Ekstraheeritud andmete ülevaatus kuvab kustutatud näitajad tagasi
2. Kinnitamisel kirjutatakse need tagasi andmebaasi, tühistades eelneva kustutamise

## Lahendus

### 1. `BrochureDataReview.tsx` — peida `__hidden_fields` väljad

Filtreerimisloogikas (read `filteredData` useMemo, rida ~90-122) tuleb enne väljade itereerimist kontrollida iga kategooria `__hidden_fields` massiivi masina olemasolevates andmetes ja jätta need väljad vahele.

### 2. `BrochureDataReview.tsx` — ära kirjuta peidetud välju kinnitamisel

Tagada, et `editedData.detailed_specs` ei sisalda peidetud välju ja säilitab olemasoleva `__hidden_fields` massiivi.

### 3. Edge function `extract-brochure-specs` — valikuline

Edge function kasutab staatilist skeemi ja saadab kõik väljad kliendile. Kuna `BrochureDataReview` on väravavaht, piisab kliendipoolsest filtreerimisest. Edge funktsiooni muutmine pole vajalik.

### Tehniline muudatus

Failis `BrochureDataReview.tsx`:
- Lugeda iga kategooria `__hidden_fields` masina olemasolevatest `detailed_specs`-idest
- `filteredSpecs` loomisel jätta vahele kõik väljad, mis on `__hidden_fields` massiivis
- Säilitada `__hidden_fields` massiiv kinnitamisel tagastatavates andmetes


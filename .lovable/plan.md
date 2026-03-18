

## ROI kalkulaatori automaatne sünkroonimine võrdlustabeli tehnika tüübiga

### Probleem
Kui kasutaja valib võrdlustabelis tehnika tüübi (nt "Kombain" või "Taimekaitseprits"), siis ROI kalkulaator ei muutu vastavalt — seal on eraldi rippmenüü, mida tuleb käsitsi muuta.

### Lahendus
Sünkrooni ROI kalkulaatori tehnika tüüp automaatselt võrdlustabeli valikuga. Kui võrdlustabelis on tüüp valitud, kasuta seda ROI-s ja peida ROI oma tüübivalija. Kui tüüp on "all", kuva ROI oma valijat nagu praegu.

### Muudatused

**`src/components/comparison/ROIComparisonCalculator.tsx`**
- Lisa `useEffect`, mis jälgib `equipmentTypeName` prop'i muutumist
- Kui `equipmentTypeName` on olemas, arvuta vastav `selectedTypeId` väärtus `getROIEquipmentCategory()` abil ja sea see automaatselt
- Kui `equipmentTypeName` on olemas (st tüüp tuleb võrdlustabelist), peida ROI kalkulaatori enda tehnika tüübi rippmenüü, kuna see on juba määratud
- Kui `equipmentTypeName` puudub (tüüp on "all"), kuva rippmenüü nagu praegu

**`src/pages/Comparison.tsx`**
- Muudatusi pole vaja — `equipmentTypeName` edastatakse juba praegu `currentEquipmentType?.name` kaudu


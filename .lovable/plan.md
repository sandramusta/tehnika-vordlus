

## Probleem

Kui admin paneelil toote dialoogi sulgeda (pärast salvestamist), kerib leht automaatselt üles tagasi. See juhtub, kuna Radix UI Dialog taastab fookuse elemendile, mis dialogi avas, ja brauser kerib selle elemendini -- kuid React Query andmete uuendamine põhjustab listi uuestirenderdamise, mis võib muuta DOM-i ja kaotada keripositsiooni.

## Lahendus

Salvestada keripositsioon enne dialogi sulgemist ja taastada see pärast sulgemist. Muudetakse `closeEquipmentDialog` funktsiooni failis `src/pages/Admin.tsx`.

## Tehnilised detailid

Muudetav fail: **src/pages/Admin.tsx**

1. Muuta `closeEquipmentDialog` funktsiooni, et see salvestaks `window.scrollY` väärtuse enne dialogi sulgemist
2. Kasutada `requestAnimationFrame` või `setTimeout`, et taastada keripositsioon pärast DOM-i uuendamist
3. Sama loogika rakendada ka `closeBrochureDialog` ja `closeArgumentDialog` ning `closeMythDialog` funktsioonidele, et kõik dialoogid käituksid ühtmoodi

Näide lahendusest:
```typescript
const closeEquipmentDialog = () => {
  const scrollY = window.scrollY;
  setEquipmentDialogOpen(false);
  setEditingEquipment(null);
  requestAnimationFrame(() => {
    window.scrollTo(0, scrollY);
  });
};
```


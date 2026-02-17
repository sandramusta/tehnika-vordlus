

## Probleem

Rakenduse admin-leht on avatud ilma autentimiseta (arenduse lihtsustamiseks), kuid andmebaasi turvareeglid (RLS) nõuavad endiselt sisselogitud kasutajat kirjutamisoperatsioonide jaoks. See tähendab, et:
- Tehnika andmete uuendamine ebaõnnestub
- Brošüüride üleslaadimine ebaõnnestub
- Kõik muud salvestamisoperatsioonid ebaõnnestuvad

## Lahendus

Taastame admin-lehe jaoks autentimise nõude, nii et kasutaja peab olema sisse logitud enne admin-lehele pääsemist.

### Muudatused

**1. `src/App.tsx`** — Taastame ProtectedRoute admin-lehe jaoks

- Impordime `ProtectedRoute` komponendi
- Mähime `/admin` marsruudi `ProtectedRoute` sisse, mis nõuab `product_manager` või `admin` rolli
- Teised lehed (võrdlus, müüdid, avaleht) jäävad avalikuks, kuna need on ainult lugemiseks

```text
/admin → ProtectedRoute (rollid: product_manager, admin)
/comparison → avalik (ainult lugemine)
/myths → avalik (ainult lugemine)
/ → avalik
```

### Tehniline detail

- `ProtectedRoute` komponent on juba olemas (`src/components/auth/ProtectedRoute.tsx`)
- Admin-kasutaja on juba andmebaasis olemas (sandraude@gmail.com, roll: admin)
- Sisselogimisleht on juba olemas (`/auth`)
- Muudatus puudutab ainult ühte faili


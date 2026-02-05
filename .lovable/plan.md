
## Admin lehe nähtavaks muutmine arenduse ajaks

Lihtne muudatus, et Admin link oleks päises alati nähtav ilma sisselogimiseta.

## Muudatus

### Fail: `src/components/layout/Header.tsx`

Muudan rea 30 nii, et Admin link on **alati nähtav** (`show: true`):

```tsx
// ENNE (rida 30):
{ href: "/admin", label: "Admin", icon: Settings, show: canEdit },

// PÄRAST:
{ href: "/admin", label: "Admin", icon: Settings, show: true }, // TODO: Taasta canEdit kui projekt on valmis
```

## Tulemus

Pärast muudatust on päises kolm vahelehte nähtavad kõigile:
- **Võrdlus** - avalik
- **Müüdid** - avalik  
- **Admin** - nähtav arenduse ajal (hiljem piiratakse `canEdit` tingimusega)

Kui projekt on valmis, saab `show: true` tagasi muuta `show: canEdit` peale, et Admin vaheleht oleks nähtav ainult administraatoritele ja tootejuhtidele.

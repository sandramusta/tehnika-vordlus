
# Brändide nimede värvimine Admin lehel

## Ülevaade

Lisa brändide nimedele Admin lehel (Haldus) sama värviskeem, mis on kasutusel võrdlustabelis. Iga brändi nimi kuvatakse selle brändi iseloomulikus värvis: John Deere roheline, Claas punane, Case IH tumepunane, New Holland sinine, Fendt must.

## Muudatused

### Fail: `src/pages/Admin.tsx`

**1. Lisa abifunktsioon brändi värvi saamiseks**

Lisa faili algusesse (pärast importide ja konstantide defineerimist) sama funktsioon, mis on ModelComparison.tsx failis:

```typescript
function getBrandTextColor(brandName: string): string {
  switch (brandName) {
    case "John Deere":
      return "text-john-deere";
    case "Claas":
      return "text-claas";
    case "Case IH":
      return "text-case-ih";
    case "New Holland":
      return "text-new-holland";
    case "Fendt":
      return "text-fendt";
    default:
      return "text-foreground";
  }
}
```

**2. Tehnika sektsiooni brändide nimed**

Muuda rida ~568:
```tsx
// Praegu:
<h3 className="font-semibold text-lg">{brand.name}</h3>

// Uuendatud:
<h3 className={cn("font-semibold text-lg", getBrandTextColor(brand.name))}>
  {brand.name}
</h3>
```

**3. Argumentide sektsiooni brändide nimed**

Muuda rida ~793:
```tsx
// Praegu:
<h3 className="font-semibold text-lg">vs {brand.name}</h3>

// Uuendatud:
<h3 className="font-semibold text-lg">
  vs <span className={getBrandTextColor(brand.name)}>{brand.name}</span>
</h3>
```

## Tulemus

| Bränd | Värv |
|-------|------|
| John Deere | Roheline |
| Claas | Punane |
| Case IH | Tumepunane |
| New Holland | Sinine |
| Fendt | Must |

Mõlemad sektsioonid (Tehnika ja Argumendid) kuvavad nüüd brändide nimesid nende eristuvates värvides, luues visuaalse seose võrdlustabeliga.

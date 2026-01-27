
# Võrdlustabeli kirjelduste uuendamine

## Ülevaade

Uuendan kõik kirjeldused ja juhendtekstid, et need kajastaksid kahte võrdlusrežiimi korrektselt.

## Muudatused

### 1. Hero sektsiooni kirjeldus (Comparison.tsx)

**Praegune tekst:**
```
Vali tehnika tüüp ja võrdle kuni 3 mudelit omavahel kõrvuti.
```

**Uus tekst:**
```
Vali tehnika tüüp ja kasuta automaatset konkurentide võrdlust või vali ise kuni 3 mudelit.
```

### 2. Filtreerimise pealkirjad (Comparison.tsx)

Praegused pealkirjad jäävad samaks, sest need on juba korrektsed:
- Auto režiim: "Automaatne konkurentide võrdlus"
- Manual režiim: "Vali mudelid võrdluseks"

### 3. Automaatse režiimi juhised (AutoModeFilters.tsx)

**Praegune tekst:**
```
Vali bränd ja mudel, et näha automaatselt sobitatud konkurente
```

**Uus tekst:**
```
Vali bränd ja mudel. Süsteem leiab automaatselt konkurendid ±50 hj vahemikus teistest brändidest.
```

### 4. Käsitsi valiku juhised (ModelMultiSelect.tsx)

Praegune tekst on korrektne ja jääb samaks:
```
Vali vähemalt 1 mudel, et näha võrdlustabelit
```

## Muudetavad failid

| Fail | Muudatus |
|------|----------|
| `src/pages/Comparison.tsx` | Hero sektsiooni kirjelduse uuendus |
| `src/components/comparison/AutoModeFilters.tsx` | Juhendteksti uuendus |

## Tehniline teostus

### Comparison.tsx (read 121-123)
```typescript
<p className="mt-2 text-primary-foreground/80">
  Vali tehnika tüüp ja kasuta automaatset konkurentide võrdlust või vali ise kuni 3 mudelit.
</p>
```

### AutoModeFilters.tsx (read 149-152)
```typescript
{!isModelSelected && isTypeSelected && (
  <div className="text-sm text-muted-foreground">
    Vali bränd ja mudel. Süsteem leiab automaatselt konkurendid ±50 hj vahemikus teistest brändidest.
  </div>
)}
```

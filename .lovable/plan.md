
# Lehekülje numbrite asukoha muutmine PDF jaluses

## Probleem
Praegu kuvatakse lehekülje number PDF-i jaluses **keskel** lehe allosas. Kasutaja soovib, et number oleks **paremal pool** panga info all, nagu näidatud pildil.

## Lahendus

Muudan `src/lib/pdfHelpers.ts` failis `addPDFFooter` funktsiooni:

### Muudatus
Lehekülje number liigutatakse parempoolsesse veergu, panga info alla:

**Praegune asukoht:**
```
WIHURI OÜ                    Reg. Nr: 14866275
Tehnika 9, Türi vald...      KMKR Nr: EE102238673
72213                        SEB Pank: EE1010220283192220

              3 / 3  (keskel)
```

**Uus asukoht:**
```
WIHURI OÜ                    Reg. Nr: 14866275
Tehnika 9, Türi vald...      KMKR Nr: EE102238673
72213                        SEB Pank: EE1010220283192220
                             3 / 3  (paremal, panga all)
```

## Tehniline muudatus

Failis `src/lib/pdfHelpers.ts`, read 173-178:

```typescript
// Praegu (keskel):
doc.text(`${pageNum} / ${totalPages}`, pageWidth / 2, pageHeight - 8, {
  align: "center",
});

// Uus (paremal, panga info all):
doc.text(`${pageNum} / ${totalPages}`, rightCol, footerY + 12);
```

Lehekülje number paigutatakse:
- X-positsioon: `rightCol` (sama mis registreerimisnumbrid, ~lehe keskpunkt)
- Y-positsioon: `footerY + 12` (4mm allpool panga infot)
- Joondus: vasakule (sama mis ülejäänud paremal pool olev info)

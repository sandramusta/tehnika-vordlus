

## Konkurentsieeliste tehnikatüübipõhine kuvamine

### Probleem
Praegu kuvab konkurentsieeliste sektsioon alati "John Deere konkurentsieelised" ja staatilise konkurentide nimekirja, soltumata valitud tehnika tuubist. Tegelikult on eelised andmebaasis seotud konkreetse tehnikatuubiga (equipment_type_id) ja need peavad kuvama ainult meie brändide (John Deere, Kramer) eeliseid vastava tehnikatuubi kontekstis.

### Lahendus
Muuta `CompetitiveAdvantages` komponenti nii, et:
1. Tuvastatakse automaatselt, milline meie brand (John Deere voi Kramer) on vorlustabelis valitud, kasutades `is_primary` lippu andmebaasis
2. Kuvatakse ainult valitud tehnikatuubile vastavaid argumente (see juba toimib labi `useCompetitiveArguments` hooki)
3. Konkurentide nimekiri filtreeritakse dunaamiliselt - kuvatakse ainult neid konkurente, kellele on selle tehnikatuubi jaoks argumente lisatud
4. Pealkiri muutub dunaamiliselt vastavalt meie brandile (nt "John Deere konkurentsieelised" voi "Kramer konkurentsieelised")

### Tehniline plaan

**Fail: `src/components/comparison/CompetitiveAdvantages.tsx`**

- Eemaldada staatilise `COMPETITOR_BRANDS` massiiv
- Lisada loogika, mis tuvastab meie brandi nime `selectedModel.brand?.is_primary` jargi
- Pealkirja tekst muutub dunaamiliselt: `{ourBrandName} konkurentsieelised`
- Konkurentide rippmenuu naitab ainult neid brande, kellel on argumente selle tehnikatuubi jaoks (filtreerides `args` massiivi jargi)
- Kui valitud mudel EI OLE meie brand, siis kuvada meie brandi eelised selle konkurendi vastu (praegune loogika juba teeb seda osaliselt)

**Fail: `src/pages/Comparison.tsx`**

- Veenduda, et `effectiveTypeId` edastatakse korrektselt `useCompetitiveArguments` hookile (juba toimib)
- Tagada, et `CompetitiveAdvantages` saab korrektsed argumendid vastavalt tehnikatuubile

### Muudatuste kokkuvote

| Fail | Muudatus |
|------|----------|
| `src/components/comparison/CompetitiveAdvantages.tsx` | Dunaamiline brandi tuvastus, dunaamiline pealkiri, konkurentide filtreerimine argumentide jargi |

Muudatus on umberiselt 15-20 rida koodi ja ei nua andmebaasi muudatusi, kuna struktuur juba toetab tehnikatuubipohist filtreerimist.

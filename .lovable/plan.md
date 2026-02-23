

# Mitmese pumba tüübiga mudelite kuvamine mõlemas võrdlusgrupis

## Probleem

Praegu tagastab `getSprayerPumpCategory` ainult uhe kategooria. Mudelid, mille pumba tyyp sisaldab molemaid variante (nt "tsentrifugaal voi kolb-membraan"), kuvatakse ainult kolb-membraanpumba vordluses.

## Lahendus

Muuta `getSprayerPumpCategory` tagastama massiivi kategooriatest uhe vaartuse asemel. Vordlusloogikas kontrollida, kas valitud mudeli ja konkurendi pumba kategooriad kattuvad (intersection).

## Tehnilised muudatused

### 1. `src/hooks/useCompetitors.ts`

**Funktsioon `getSprayerPumpCategory`:**
- Tagastustyyp muutub `string | null` asemel `("tsentrifugaal" | "kolb-membraan")[] | null`
- Kui tekst sisaldab molemaid marksoanu, tagastatakse `["tsentrifugaal", "kolb-membraan"]`
- Kui ainult yhte, tagastatakse yheelemendine massiiv

**Vordlusloogika `useCompetitors` hookis:**
- Praegune `eqPump !== selectedPump` kontroll asendatakse kattuvuse kontrollile: kas valitud mudeli ja konkurendi kategooriate massiividel on yhisosa
- Nt kui valitud mudelil on `["tsentrifugaal"]` ja konkurendil `["tsentrifugaal", "kolb-membraan"]`, siis on yhisosa olemas ja mudel kuvatakse

**Kokkuvottefunktsioon `getCompetitorSummary`:**
- Kuvab pumba tyybi(d) massiivi pohjal, nt "tsentrifugaalpump" voi "tsentrifugaal- / kolb-membraanpump"

### Naide

Kui kasutaja valib mudeli pumba tyybiga "tsentrifugaalpump":
- Kuvatakse konkurendid, kus pumba tyyp on "tsentrifugaalpump"
- Kuvatakse ka konkurendid, kus pumba tyyp on "tsentrifugaal voi kolb-membraan"

Kui kasutaja valib mudeli pumba tyybiga "tsentrifugaal voi kolb-membraan":
- Kuvatakse molemad grupid: nii tsentrifugaal- kui ka kolb-membraanpumbaga konkurendid


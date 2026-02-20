

## Probleem

Andmebaasis on ruloonpressi tehnikatüübi nimi `round_baler` (alakriipsuga), aga koodis kontrollitakse ainult `"round baler"` (tühikuga) ja `"ruloonpress"`. Kuna vaste puudub, tagastatakse vaikimisi **kombaini** skeem. Sama probleem esineb ka teistel tüüpidel: `forage_harvester`, `self_propelled_sprayer`, `trailed_sprayer`, `wheel_loader`.

## Lahendus

Lisada alakriipsuga variandid kõigisse kolme funktsiooni (`getCategoryOrderForType`, `getCategoryNamesForType`, `getFieldNamesForType`) failis `src/lib/pdfSpecsHelpers.ts`.

## Tehnilised detailid

Muudetav fail: `src/lib/pdfSpecsHelpers.ts`

Igas kolmes funktsioonis lisatakse puuduvad alakriipsuga variandid:

| Andmebaasi nimi | Praegu kontrollitakse | Lisatakse |
|---|---|---|
| `round_baler` | `"ruloonpress"`, `"round baler"` | `"round_baler"` |
| `forage_harvester` | `"hekseldi"`, `"forage harvester"` | `"forage_harvester"` |
| `wheel_loader` | `"rataslaadur"`, `"wheel loader"` | `"wheel_loader"` |
| `self_propelled_sprayer` | `"iseliikuv taimekaitseprits"`, `"self-propelled sprayer"` | `"self_propelled_sprayer"` |
| `trailed_sprayer` | `"järelveetav taimekaitseprits"`, `"trailed sprayer"` | `"trailed_sprayer"` |

Samuti kontrollitakse `src/lib/fieldSyncMapping.ts` — seal on juba alakriipsuga variandid olemas, seega seda faili muutma ei pea.

